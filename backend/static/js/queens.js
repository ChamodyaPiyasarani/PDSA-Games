document.addEventListener("DOMContentLoaded", () => {
  const chessboard = document.getElementById("chessboard");
  const statusDisplay = document.getElementById("game-status");
  const queensCountDisplay = document.getElementById("queens-count");
  const startButton = document.getElementById("start-game");
  const findSolutionsButton = document.getElementById("find-solutions");
  const submitButton = document.getElementById("submit-solution");
  const playerNameInput = document.getElementById("player-name");
  const solutionsList = document.getElementById("solutions-list");
  const historyList = document.getElementById("history-list");
  const sequentialSolutionsDisplay = document.getElementById(
    "sequential-solutions"
  );
  const threadedSolutionsDisplay =
    document.getElementById("threaded-solutions");
  const sequentialTimeDisplay = document.getElementById("sequential-time");
  const threadedTimeDisplay = document.getElementById("threaded-time");

  let queens = [];
  let gameActive = false;
  let gameId = null;
  let allSolutions = [];
  let foundSolutions = 0;
  let playerName = "";

  // Initialize the chessboard
  function initializeChessboard() {
    chessboard.innerHTML = "";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
        square.dataset.row = row;
        square.dataset.col = col;
        square.addEventListener("click", () => handleSquareClick(row, col));
        chessboard.appendChild(square);
      }
    }
  }

  // Handle square click
  function handleSquareClick(row, col) {
    if (!gameActive) {
      showMessage("Please start a new game first", "error");
      return;
    }

    // Check if there's already a queen at this position
    const existingQueen = queens.find((q) => q.row === row && q.col === col);

    if (existingQueen) {
      // Remove the queen
      queens = queens.filter((q) => !(q.row === row && q.col === col));
      updateBoard();
      return;
    }

    // Check if placing a queen here is safe
    if (!isSafe(row, col, queens)) {
      showMessage(
        "Cannot place a queen here - it would be under attack!",
        "error"
      );
      return;
    }

    // Add the queen
    queens.push({ row, col });
    updateBoard();

    // Check if all queens are placed
    if (queens.length === 8) {
      checkSolutionValidity();
    }
  }

  // Check if a position is safe for a queen
  function isSafe(row, col, otherQueens) {
    for (const queen of otherQueens) {
      // Same row or column
      if (queen.row === row || queen.col === col) return false;

      // Same diagonal
      if (Math.abs(queen.row - row) === Math.abs(queen.col - col)) return false;
    }
    return true;
  }

  // Check if current solution is valid
  function checkSolutionValidity() {
    const isValid = queens.every((queen) => {
      const otherQueens = queens.filter((q) => q !== queen);
      return isSafe(queen.row, queen.col, otherQueens);
    });

    if (isValid) {
      statusDisplay.textContent = "Valid solution! Click Submit to save.";
      submitButton.disabled = false;
      showMessage(
        "Congratulations! You placed all 8 queens correctly!",
        "success"
      );
    } else {
      statusDisplay.textContent =
        "Invalid solution - queens are attacking each other";
      submitButton.disabled = true;
      showMessage("Some queens are attacking each other. Try again!", "error");
    }
  }

  // Update the board visualization
  function updateBoard() {
    // Clear highlights and queens
    document.querySelectorAll(".square").forEach((square) => {
      square.innerHTML = "";
      square.classList.remove("highlight", "threat");
    });

    // Place queens and highlight threatened squares
    queens.forEach((queen) => {
      const square = document.querySelector(
        `.square[data-row="${queen.row}"][data-col="${queen.col}"]`
      );
      if (square) {
        const queenElement = document.createElement("div");
        queenElement.className = "queen";
        queenElement.textContent = "♛";
        square.appendChild(queenElement);

        // Highlight threatened squares
        document.querySelectorAll(".square").forEach((otherSquare) => {
          const otherRow = parseInt(otherSquare.dataset.row);
          const otherCol = parseInt(otherSquare.dataset.col);

          if (
            (otherRow === queen.row ||
              otherCol === queen.col ||
              Math.abs(otherRow - queen.row) ===
                Math.abs(otherCol - queen.col)) &&
            !(otherRow === queen.row && otherCol === queen.col)
          ) {
            otherSquare.classList.add("threat");
          }
        });
      }
    });

    // Update queens count
    queensCountDisplay.textContent = queens.length;

    // Update status message
    if (queens.length < 8) {
      statusDisplay.textContent =
        "Place 8 queens on the board so that no two threaten each other";
      submitButton.disabled = true;
    }
  }

  // Show message to user
  function showMessage(message, type) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    document.body.appendChild(messageElement);

    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }

  // Start a new game
  function startGame() {
    const result = validation.validatePlayerName(playerNameInput.value);
    if (!result.isValid) {
      validation.showValidationMessage(playerNameInput, result.message, false);
      return;
    }

    playerName = playerNameInput.value.trim();
    initializeChessboard();
    queens = [];
    gameActive = true;
    foundSolutions = 0;
    queensCountDisplay.textContent = "0";
    statusDisplay.textContent =
      "Place 8 queens on the board so that no two threaten each other";
    submitButton.disabled = true;
    chessboard.classList.add("active");
    allSolutions = [];
    solutionsList.innerHTML = "";

    // Create new game in db
    createNewGame();

    showMessage("Game started! Place 8 queens on the board", "success");
  }

  // Submit solution
  function submitSolution() {
    if (!gameActive) {
      showMessage("Please start a new game first", "error");
      return;
    }

    if (queens.length !== 8) {
      showMessage("You need to place all 8 queens before submitting", "error");
      return;
    }

    // Verify the solution again before submitting
    const isValid = queens.every((queen, index) => {
      const otherQueens = queens.filter((_, i) => i !== index);
      return isSafe(queen.row, queen.col, otherQueens);
    });

    if (isValid) {
      saveSolution(queens);
    } else {
      showMessage(
        "This is not a valid solution. Some queens are attacking each other",
        "error"
      );
    }
  }

  // Find solutions
  function findAllSolutions() {
    if (!gameActive) {
      showMessage("Please start a new game first", "error");
      return;
    }

    gameActive = false;
    statusDisplay.textContent = "Finding all solutions...";
    submitButton.disabled = true;

    // Reset results
    sequentialSolutionsDisplay.textContent = "0";
    threadedSolutionsDisplay.textContent = "0";
    sequentialTimeDisplay.textContent = "0ms";
    threadedTimeDisplay.textContent = "0ms";
    solutionsList.innerHTML = "";

    // Find solutions sequentially
    let startTime = performance.now();
    fetch("/api/queens/solutions/sequential")
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        const endTime = performance.now();
        sequentialSolutionsDisplay.textContent = data.solutions.length;
        sequentialTimeDisplay.textContent = `${(endTime - startTime).toFixed(
          2
        )}ms`;

        // Save sequential algorithm time
        saveAlgorithmTime(
          "sequential",
          endTime - startTime,
          data.solutions.length
        );

        // Find solutions with threading
        startTime = performance.now();
        fetch("/api/queens/solutions/threaded")
          .then((response) => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
          })
          .then((threadedData) => {
            const threadedEndTime = performance.now();
            threadedSolutionsDisplay.textContent =
              threadedData.solutions.length;
            threadedTimeDisplay.textContent = `${(
              threadedEndTime - startTime
            ).toFixed(2)}ms`;

            // Save threaded algorithm time
            saveAlgorithmTime(
              "threaded",
              threadedEndTime - startTime,
              threadedData.solutions.length
            );

            // Display solutions
            allSolutions = threadedData.solutions;
            displaySolutions();

            gameActive = true;
            statusDisplay.textContent = `Found ${allSolutions.length} solutions!`;
          })
          .catch((error) => {
            console.error("Error finding threaded solutions:", error);
            showMessage(
              "Error finding threaded solutions. Please try again.",
              "error"
            );
            gameActive = true;
          });
      })
      .catch((error) => {
        console.error("Error finding sequential solutions:", error);
        showMessage(
          "Error finding sequential solutions. Please try again.",
          "error"
        );
        gameActive = true;
      });
  }

  // Display aswers
  function displaySolutions() {
    solutionsList.innerHTML = "";

    if (!allSolutions || allSolutions.length === 0) {
      const noSolutions = document.createElement("div");
      noSolutions.className = "no-solutions";
      noSolutions.textContent = "No solutions found";
      solutionsList.appendChild(noSolutions);
      return;
    }

    allSolutions.forEach((solution, index) => {
      const solutionItem = document.createElement("div");
      solutionItem.className = "solution-item";
      solutionItem.addEventListener("click", () =>
        displaySolutionOnBoard(solution)
      );

      const solutionBoard = document.createElement("div");
      solutionBoard.className = "solution-board";

      // Create a mini chessboard for this solution
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const square = document.createElement("div");
          square.className = `solution-square ${
            (row + col) % 2 === 0 ? "light" : "dark"
          }`;

          if (solution.some((q) => q.row === row && q.col === col)) {
            const queen = document.createElement("div");
            queen.className = "solution-queen";
            queen.textContent = "♛";
            square.appendChild(queen);
          }

          solutionBoard.appendChild(square);
        }
      }

      const solutionNumber = document.createElement("div");
      solutionNumber.className = "solution-number";
      solutionNumber.textContent = `Solution ${index + 1}`;

      solutionItem.appendChild(solutionBoard);
      solutionItem.appendChild(solutionNumber);
      solutionsList.appendChild(solutionItem);
    });
  }

  // Display a solution on the main board
  function displaySolutionOnBoard(solution) {
    queens = JSON.parse(JSON.stringify(solution));
    updateBoard();
    checkSolutionValidity();
  }

  // Database functions
  function createNewGame() {
    fetch("/api/queens/games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player_name: playerName,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        gameId = data.game_id;
        console.log("New game created with ID:", gameId);
      })
      .catch((error) => {
        console.error("Error creating new game:", error);
        showMessage("Error creating new game", "error");
      });
  }

  function saveSolution(solution) {
    if (!gameId) {
      showMessage("No active game to save solution to", "error");
      return;
    }

    fetch("/api/queens/solutions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        game_id: gameId,
        solution: solution,
        solution_number: foundSolutions + 1,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        foundSolutions = data.solution_number;
        showMessage(
          `Solution ${foundSolutions} saved successfully!`,
          "success"
        );
        loadGameHistory();
      })
      .catch((error) => {
        console.error("Error saving solution:", error);
        showMessage("Error saving solution", "error");
      });
  }

  function saveAlgorithmTime(algorithm, time, solutions) {
    if (!gameId) return;

    fetch("/api/queens/algorithm-times", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        game_id: gameId,
        algorithm_type: algorithm,
        solutions_found: solutions,
        time_taken: time,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        console.log(`${algorithm} algorithm time saved`);
      })
      .catch((error) => {
        console.error(`Error saving ${algorithm} algorithm time:`, error);
      });
  }

  function loadGameHistory() {
    fetch("/api/queens/games")
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((games) => {
        historyList.innerHTML = "";
        games.forEach((game) => {
          const item = document.createElement("div");
          item.className = "history-item";

          const playerSpan = document.createElement("span");
          playerSpan.className = "history-player";
          playerSpan.textContent = game.player_name;

          const solutionSpan = document.createElement("span");
          solutionSpan.className = "history-solution";
          solutionSpan.textContent = `Solution ${game.solution_number}`;

          const dateSpan = document.createElement("span");
          dateSpan.className = "history-date";
          dateSpan.textContent = new Date(game.date).toLocaleString();

          item.appendChild(playerSpan);
          item.appendChild(solutionSpan);
          item.appendChild(dateSpan);
          historyList.appendChild(item);
        });
      })
      .catch((error) => {
        console.error("Error loading game history:", error);
      });
  }

  // Event listeners
  startButton.addEventListener("click", startGame);
  submitButton.addEventListener("click", submitSolution);
  findSolutionsButton.addEventListener("click", findAllSolutions);

  // Initialize the chessboard
  initializeChessboard();
  loadGameHistory();
});
