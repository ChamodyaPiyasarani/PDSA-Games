document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const statusDisplay = document.getElementById('game-status');
    const queensCountDisplay = document.getElementById('queens-count');
    const startButton = document.getElementById('start-game');
    const findSolutionsButton = document.getElementById('find-solutions');
    const submitButton = document.getElementById('submit-solution');
    const playerNameInput = document.getElementById('player-name');
    const solutionsList = document.getElementById('solutions-list');
    const historyList = document.getElementById('history-list');
    const sequentialSolutionsDisplay = document.getElementById('sequential-solutions');
    const threadedSolutionsDisplay = document.getElementById('threaded-solutions');
    const sequentialTimeDisplay = document.getElementById('sequential-time');
    const threadedTimeDisplay = document.getElementById('threaded-time');
    
    let queens = [];
    let gameActive = false;
    let gameId = null;
    let allSolutions = [];
    let foundSolutions = 0;
    
    // Initialize the chessboard
    function initializeChessboard() {
        chessboard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.addEventListener('click', () => handleSquareClick(row, col));
                chessboard.appendChild(square);
            }
        }
    }
    
    // Handle square click
    function handleSquareClick(row, col) {
        if (!gameActive) {
            showMessage('Please start a new game first', 'error');
            return;
        }
        
        // Check if there's already a queen at this position
        const existingQueen = queens.find(q => q.row === row && q.col === col);
        
        if (existingQueen) {
            // Remove the queen
            queens = queens.filter(q => !(q.row === row && q.col === col));
            updateBoard();
            return;
        }
        
        // Check if placing a queen here is safe
        if (!isSafe(row, col, queens)) {
            showMessage('Cannot place a queen here - it would be under attack!', 'error');
            return;
        }
        
        // Add the queen
        queens.push({ row, col });
        updateBoard();
        
        if (queens.length === 8) {
            submitButton.disabled = false;
            showMessage('Congratulations! You placed all 8 queens! Click Submit to verify your solution', 'success');
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
    
    // Update the board visualization
    function updateBoard() {
        // Clear highlights and queens
        document.querySelectorAll('.square').forEach(square => {
            square.innerHTML = '';
            square.classList.remove('highlight', 'threat');
        });
        
        // Place queens and highlight threatened squares
        queens.forEach(queen => {
            const square = document.querySelector(`.square[data-row="${queen.row}"][data-col="${queen.col}"]`);
            if (square) {
                const queenElement = document.createElement('div');
                queenElement.className = 'queen';
                queenElement.textContent = '♛';
                square.appendChild(queenElement);
                
                // Highlight threatened squares
                document.querySelectorAll('.square').forEach(otherSquare => {
                    const otherRow = parseInt(otherSquare.dataset.row);
                    const otherCol = parseInt(otherSquare.dataset.col);
                    
                    if (
                        (otherRow === queen.row || otherCol === queen.col || 
                         Math.abs(otherRow - queen.row) === Math.abs(otherCol - queen.col)) &&
                        !(otherRow === queen.row && otherCol === queen.col)
                    ) {
                        otherSquare.classList.add('threat');
                    }
                });
            }
        });
        
        // Update queens count
        queensCountDisplay.textContent = queens.length;
        
        // Check if we have a valid solution
        if (queens.length === 8) {
            const isValid = queens.every(queen => {
                const otherQueens = queens.filter(q => q !== queen);
                return isSafe(queen.row, queen.col, otherQueens);
            });
            
            if (isValid) {
                statusDisplay.textContent = 'You found a valid solution! Click Submit to save it.';
                submitButton.disabled = false;
            } else {
                statusDisplay.textContent = 'You placed 8 queens, but they are threatening each other. Try again!';
                submitButton.disabled = true;
            }
        } else {
            statusDisplay.textContent = 'Place 8 queens on the board so that no two threaten each other';
            submitButton.disabled = true;
        }
    }
    
    // Start a new game
    function startGame() {
        const name = playerNameInput.value.trim();
        if (!name) {
            showMessage('Please enter your name to start the game', 'error');
            return;
        }
        
        playerName = name;
        initializeChessboard();
        queens = [];
        gameActive = true;
        foundSolutions = 0;
        queensCountDisplay.textContent = '0';
        statusDisplay.textContent = 'Place 8 queens on the board so that no two threaten each other';
        submitButton.disabled = true;
        chessboard.classList.add('active');
        
        showMessage('Game started! Place 8 queens on the board', 'success');
    }
    
    // Submit solution
    function submitSolution() {
        if (!gameActive) {
            showMessage('Please start a new game first', 'error');
            return;
        }
        
        if (queens.length !== 8) {
            showMessage('You need to place all 8 queens before submitting', 'error');
            return;
        }
        
        // Verify the solution
        const isValid = queens.every((queen, index) => {
            const otherQueens = queens.filter((_, i) => i !== index);
            return isSafe(queen.row, queen.col, otherQueens);
        });
        
        if (isValid) {
            showMessage('Congratulations! You found a valid solution!', 'success');
            saveSolution(queens);
        } else {
            showMessage('This is not a valid solution. Some queens are attacking each other', 'error');
        }
    }
    
    // Find all solutions
    findSolutionsButton.addEventListener('click', () => {
        if (!gameActive) {
            showMessage('Please start a new game first', 'error');
            return;
        }
        
        gameActive = false;
        statusDisplay.textContent = 'Finding all solutions...';
        
        // Find solutions sequentially
        let startTime = performance.now();
        fetch('/api/queens/solutions/sequential')
            .then(response => response.json())
            .then(data => {
                const endTime = performance.now();
                sequentialSolutionsDisplay.textContent = data.solutions.length;
                sequentialTimeDisplay.textContent = `${(endTime - startTime).toFixed(2)}ms`;
                
                // Save sequential algorithm time
                saveAlgorithmTime('sequential', endTime - startTime, data.solutions.length);
                
                // Find solutions with threading
                startTime = performance.now();
                fetch('/api/queens/solutions/threaded')
                    .then(response => response.json())
                    .then(threadedData => {
                        const threadedEndTime = performance.now();
                        threadedSolutionsDisplay.textContent = threadedData.solutions.length;
                        threadedTimeDisplay.textContent = `${(threadedEndTime - startTime).toFixed(2)}ms`;
                        
                        // Save threaded algorithm time
                        saveAlgorithmTime('threaded', threadedEndTime - startTime, threadedData.solutions.length);
                        
                        // Display solutions
                        allSolutions = threadedData.solutions;
                        displaySolutions();
                        
                        gameActive = true;
                        statusDisplay.textContent = `Found ${allSolutions.length} solutions!`;
                    })
                    .catch(error => {
                        console.error('Error finding threaded solutions:', error);
                        showMessage('Error finding solutions. Please try again.', 'error');
                        gameActive = true;
                    });
            })
            .catch(error => {
                console.error('Error finding sequential solutions:', error);
                showMessage('Error finding solutions. Please try again.', 'error');
                gameActive = true;
            });
    });
    
    // Display solutions
    function displaySolutions() {
        solutionsList.innerHTML = '';
        
        if (!allSolutions || allSolutions.length === 0) {
            const noSolutions = document.createElement('div');
            noSolutions.className = 'no-solutions';
            noSolutions.textContent = 'No solutions found';
            solutionsList.appendChild(noSolutions);
            return;
        }
        
        allSolutions.forEach((solution, index) => {
            const solutionItem = document.createElement('div');
            solutionItem.className = 'solution-item';
            solutionItem.addEventListener('click', () => displaySolutionOnBoard(solution));
            
            const solutionBoard = document.createElement('div');
            solutionBoard.className = 'solution-board';
            
            // Create a mini chessboard for this solution
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const square = document.createElement('div');
                    square.className = `solution-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                    
                    if (solution.some(q => q.row === row && q.col === col)) {
                        const queen = document.createElement('div');
                        queen.className = 'solution-queen';
                        queen.textContent = '♛';
                        square.appendChild(queen);
                    }
                    
                    solutionBoard.appendChild(square);
                }
            }
            
            const solutionNumber = document.createElement('div');
            solutionNumber.className = 'solution-number';
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
    }
    
    // Database functions
    function createNewGame() {
        fetch('/api/queens/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_name: playerName
            })
        })
        .then(response => response.json())
        .then(data => {
            gameId = data.game_id;
        })
        .catch(error => {
            console.error('Error creating new game:', error);
        });
    }
    
    function saveSolution(solution) {
        if (!gameId) return;
        
        fetch('/api/queens/solutions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_id: gameId,
                solution: solution,
                solution_number: foundSolutions + 1
            })
        })
        .then(() => {
            foundSolutions++;
            loadGameHistory();
        })
        .catch(error => {
            console.error('Error saving solution:', error);
        });
    }
    
    function saveAlgorithmTime(algorithm, time, solutions) {
        if (!gameId) return;
        
        fetch('/api/queens/algorithm-times', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                algorithm_type: algorithm,
                solutions_found: solutions,
                time_taken: time
            })
        })
        .catch(error => {
            console.error('Error saving algorithm time:', error);
        });
    }
    
    function loadGameHistory() {
        fetch('/api/queens/games')
        .then(response => response.json())
        .then(games => {
            historyList.innerHTML = '';
            games.forEach(game => {
                const item = document.createElement('div');
                item.className = 'history-item';
                
                const playerSpan = document.createElement('span');
                playerSpan.className = 'history-player';
                playerSpan.textContent = game.player_name;
                
                const solutionSpan = document.createElement('span');
                solutionSpan.className = 'history-solution';
                solutionSpan.textContent = `Solution ${game.solution_number}`;
                
                item.appendChild(playerSpan);
                item.appendChild(solutionSpan);
                historyList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading game history:', error);
        });
    }
    
    // Start game button
    startButton.addEventListener('click', startGame);
    
    // Initialize the chessboard
    initializeChessboard();
    loadGameHistory();
});