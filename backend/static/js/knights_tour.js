document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const statusDisplay = document.getElementById('game-status');
    const moveCountDisplay = document.getElementById('move-count');
    const startButton = document.getElementById('start-game');
    const solveButton = document.getElementById('solve-game');
    const submitButton = document.getElementById('submit-solution');
    const playerNameInput = document.getElementById('player-name');
    const movesList = document.getElementById('moves-list');
    const historyList = document.getElementById('history-list');
    const warnsdorffTimeDisplay = document.getElementById('warnsdorff-time');
    const backtrackingTimeDisplay = document.getElementById('backtracking-time');
    
    let board = [];
    let currentPosition = null;
    let moveHistory = [];
    let moveCount = 0;
    let gameActive = false;
    let gameId = null;
    
    // Initialize the chessboard
    function initializeChessboard() {
        chessboard.innerHTML = '';
        board = Array(8).fill().map(() => Array(8).fill(0));
        moveHistory = [];
        moveCount = 0;
        moveCountDisplay.textContent = '0';
        movesList.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                chessboard.appendChild(square);
            }
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
        gameActive = true;
        
        // Randomly select starting position
        const startRow = Math.floor(Math.random() * 8);
        const startCol = Math.floor(Math.random() * 8);
        
        // Place the knight at the starting position
        currentPosition = { row: startRow, col: startCol };
        board[startRow][startCol] = 1;
        moveCount = 1;
        moveCountDisplay.textContent = '1';
        
        // Mark the starting position
        const startSquare = document.querySelector(`.square[data-row="${startRow}"][data-col="${startCol}"]`);
        startSquare.classList.add('start', 'current');
        
        // Add knight to the starting square
        const knight = document.createElement('div');
        knight.className = 'knight';
        knight.textContent = '♞';
        startSquare.appendChild(knight);
        
        // Add move number
        const moveNumber = document.createElement('div');
        moveNumber.className = 'move-number';
        moveNumber.textContent = '1';
        startSquare.appendChild(moveNumber);
        
        // Add to move history
        moveHistory.push({ row: startRow, col: startCol, move: 1 });
        addMoveToHistory(1, startRow, startCol);
        
        statusDisplay.textContent = 'Select next move from highlighted squares';
        startButton.textContent = 'Restart Game';
        chessboard.classList.add('active');
        
        showMessage('Game started! The knight has been placed at a random position', 'success');
        
        // Show possible moves from the starting position
        showPossibleMoves(startRow, startCol);
    }
    
    // Handle first move (placing the knight)
    function handleFirstMove(e) {
        if (!gameActive || currentPosition !== null) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        currentPosition = { row, col };
        board[row][col] = 1;
        moveCount = 1;
        moveCountDisplay.textContent = '1';
        
        // Mark the starting position
        e.target.classList.add('start');
        
        // Add knight to the square
        const knight = document.createElement('div');
        knight.className = 'knight';
        knight.textContent = '♞';
        e.target.appendChild(knight);
        
        // Add move number
        const moveNumber = document.createElement('div');
        moveNumber.className = 'move-number';
        moveNumber.textContent = '1';
        e.target.appendChild(moveNumber);
        
        // Add to move history
        moveHistory.push({ row, col, move: 1 });
        addMoveToHistory(1, row, col);
        
        // Change status
        statusDisplay.textContent = 'Now click on a highlighted square for the next move';
        
        // Remove this event listener
        document.querySelectorAll('.square').forEach(square => {
            square.removeEventListener('click', handleFirstMove);
        });
        
        // Show possible moves
        showPossibleMoves(row, col);
    }
    
    // Show possible moves from current position
    function showPossibleMoves(row, col) {
        // Clear all previous possible moves and block all squares
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('possible-move');
            square.removeEventListener('click', makeMove);
            square.style.pointerEvents = 'none'; // Block all squares
        });

        // Only show moves from the current position
        const moves = getPossibleMoves(row, col);
        
        moves.forEach(move => {
            const square = document.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
            if (square && board[move.row][move.col] === 0) {
                square.classList.add('possible-move');
                square.style.pointerEvents = 'auto'; // Enable only possible moves
                square.addEventListener('click', () => makeMove(move.row, move.col));
            }
        });
    }
    
    // Get all possible knight moves from a position
    function getPossibleMoves(row, col) {
        const moves = [
            { row: row + 2, col: col + 1 },
            { row: row + 2, col: col - 1 },
            { row: row - 2, col: col + 1 },
            { row: row - 2, col: col - 1 },
            { row: row + 1, col: col + 2 },
            { row: row + 1, col: col - 2 },
            { row: row - 1, col: col + 2 },
            { row: row - 1, col: col - 2 }
        ];
        
        return moves.filter(move => 
            move.row >= 0 && move.row < 8 && 
            move.col >= 0 && move.col < 8 &&
            board[move.row][move.col] === 0
        );
    }
    
    // Make a move to the specified position
    function makeMove(row, col) {
        if (!gameActive || currentPosition === null) return;
        // Prevent moving to an already visited square
        if (board[row][col] !== 0) return;
        // Clear previous possible moves and block all squares
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('possible-move');
            square.removeEventListener('click', makeMove);
            square.style.pointerEvents = 'none';
        });
        // Clear current position highlight
        document.querySelectorAll('.current').forEach(square => {
            square.classList.remove('current');
        });
        // Mark the square as visited
        const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
        square.classList.add('visited', 'current');
        // Remove any existing knight
        const existingKnight = square.querySelector('.knight');
        if (existingKnight) {
            square.removeChild(existingKnight);
        }
        // Add knight to the new square
        const knight = document.createElement('div');
        knight.className = 'knight';
        knight.textContent = '♞';
        square.appendChild(knight);
        // Update move count
        moveCount++;
        moveCountDisplay.textContent = moveCount;
        // Add move number
        const moveNumber = document.createElement('div');
        moveNumber.className = 'move-number';
        moveNumber.textContent = moveCount;
        square.appendChild(moveNumber);
        // Update board state
        board[row][col] = moveCount;
        currentPosition = { row, col };
        // Prevent duplicate moves in moveHistory
        if (!moveHistory.some(m => m.row === row && m.col === col)) {
            moveHistory.push({ row, col, move: moveCount });
            addMoveToHistory(moveCount, row, col);
        }
        // Check if the tour is complete
        if (moveCount === 64) {
            endGame(true);
            return;
        }
        // Show next possible moves
        const possibleMoves = getPossibleMoves(row, col);
        if (possibleMoves.length === 0) {
            statusDisplay.textContent = 'No more possible moves! Tour ended early.';
            submitButton.disabled = false;
        } else {
            statusDisplay.textContent = `Move ${moveCount}. Select next move from highlighted squares`;
            showPossibleMoves(row, col);
        }
    }
    
    // Add move to history list
    function addMoveToHistory(move, row, col) {
        const moveItem = document.createElement('div');
        moveItem.className = 'move-item';
        moveItem.textContent = `${move}. ${String.fromCharCode(65 + col)}${8 - row}`;
        movesList.appendChild(moveItem);
        movesList.scrollTop = movesList.scrollHeight;
    }
    
    // End the game
    function endGame(isComplete) {
        gameActive = false;
        chessboard.classList.remove('active');
        
        if (isComplete) {
            statusDisplay.textContent = 'Congratulations! You completed the Knight\'s Tour!';
            saveGameResult(true);
            showMessage('Congratulations! You completed the Knight\'s Tour!', 'success');
        } else {
            statusDisplay.textContent = 'Game over! Try again!';
            saveGameResult(false);
            showMessage('Game over! Try again!', 'error');
        }
    }
    
    // Solve the game automatically
    solveButton.addEventListener('click', () => {
        if (!gameActive || currentPosition !== null) return;
        
        // Disable interactions while solving
        gameActive = false;
        statusDisplay.textContent = 'Solving...';
        
        // Get a random starting position
        const startRow = Math.floor(Math.random() * 8);
        const startCol = Math.floor(Math.random() * 8);
        
        // Solve using Warnsdorff's algorithm
        let startTime = performance.now();
        const warnsdorffSolution = solveWarnsdorff(startRow, startCol);
        let endTime = performance.now();
        warnsdorffTimeDisplay.textContent = `${(endTime - startTime).toFixed(2)}ms`;
        saveAlgorithmTime('warnsdorff', endTime - startTime);
        
        // Solve using backtracking
        startTime = performance.now();
        const backtrackingSolution = solveBacktracking(startRow, startCol);
        endTime = performance.now();
        backtrackingTimeDisplay.textContent = `${(endTime - startTime).toFixed(2)}ms`;
        saveAlgorithmTime('backtracking', endTime - startTime);
        
        // Animate the Warnsdorff solution (usually faster)
        animateSolution(warnsdorffSolution, startRow, startCol);
    });
    
    // Animate the solution
    function animateSolution(solution, startRow, startCol) {
        // Reset the board
        initializeChessboard();
        board[startRow][startCol] = 1;
        currentPosition = { row: startRow, col: startCol };
        moveCount = 1;
        moveCountDisplay.textContent = '1';
        
        // Mark the starting position
        const startSquare = document.querySelector(`.square[data-row="${startRow}"][data-col="${startCol}"]`);
        startSquare.classList.add('start', 'current');
        
        // Add knight to the starting square
        const knight = document.createElement('div');
        knight.className = 'knight';
        knight.textContent = '♞';
        startSquare.appendChild(knight);
        
        // Add move number
        const moveNumber = document.createElement('div');
        moveNumber.className = 'move-number';
        moveNumber.textContent = '1';
        startSquare.appendChild(moveNumber);
        
        // Add to move history
        moveHistory.push({ row: startRow, col: startCol, move: 1 });
        addMoveToHistory(1, startRow, startCol);
        
        // Animate each move
        let i = 0;
        const interval = setInterval(() => {
            if (i >= solution.length) {
                clearInterval(interval);
                endGame(true);
                return;
            }
            
            const move = solution[i];
            makeMove(move.row, move.col);
            i++;
        }, 300);
    }
    
    // Knight's tour algorithms
    function solveWarnsdorff(startRow, startCol) {
        // Initialize board
        const board = Array(8).fill().map(() => Array(8).fill(0));
        board[startRow][startCol] = 1;
        
        const moves = [];
        let currentRow = startRow;
        let currentCol = startCol;
        
        for (let move = 2; move <= 64; move++) {
            // Get all possible next moves
            const possibleMoves = getPossibleMoves(currentRow, currentCol)
                .filter(m => board[m.row][m.col] === 0);
            
            if (possibleMoves.length === 0) {
                break; // No solution found
            }
            
            // Choose the move with the fewest onward moves (Warnsdorff's rule)
            possibleMoves.forEach(m => {
                m.onwardMoves = getPossibleMoves(m.row, m.col)
                    .filter(m2 => board[m2.row][m2.col] === 0).length;
            });
            
            possibleMoves.sort((a, b) => a.onwardMoves - b.onwardMoves);
            
            const nextMove = possibleMoves[0];
            board[nextMove.row][nextMove.col] = move;
            moves.push(nextMove);
            currentRow = nextMove.row;
            currentCol = nextMove.col;
        }
        
        return moves;
    }
    
    function solveBacktracking(startRow, startCol) {
        // Initialize board
        const board = Array(8).fill().map(() => Array(8).fill(0));
        board[startRow][startCol] = 1;
        
        // Possible knight moves
        const moves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];
        
        const solution = [];
        
        function backtrack(row, col, moveCount) {
            if (moveCount === 64) {
                return true;
            }
            
            // Try all possible moves
            for (const [dr, dc] of moves) {
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && board[newRow][newCol] === 0) {
                    board[newRow][newCol] = moveCount + 1;
                    solution.push({ row: newRow, col: newCol });
                    
                    if (backtrack(newRow, newCol, moveCount + 1)) {
                        return true;
                    }
                    
                    // Backtrack
                    board[newRow][newCol] = 0;
                    solution.pop();
                }
            }
            
            return false;
        }
        
        backtrack(startRow, startCol, 1);
        return solution;
    }
    
    // Submit solution
    submitButton.addEventListener('click', () => {
        if (moveHistory.length === 0) return;
        
        const isComplete = moveCount === 64;
        saveGameResult(isComplete);
    });
    
    // Database functions
    function createNewGame() {
        fetch('/api/knights-tour/games', {
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
    
    function saveGameResult(isComplete) {
        if (!gameId) return;
        
        fetch(`/api/knights-tour/games/${gameId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                start_position: moveHistory.length > 0 ? 
                    `${String.fromCharCode(65 + moveHistory[0].col)}${8 - moveHistory[0].row}` : '',
                move_sequence: JSON.stringify(moveHistory),
                is_complete: isComplete
            })
        })
        .then(() => {
            loadGameHistory();
        })
        .catch(error => {
            console.error('Error saving game result:', error);
        });
    }
    
    function saveAlgorithmTime(algorithm, time) {
        if (!gameId) return;
        
        fetch('/api/knights-tour/algorithm-times', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_id: gameId,
                algorithm_used: algorithm,
                time_taken: time
            })
        })
        .catch(error => {
            console.error('Error saving algorithm time:', error);
        });
    }
    
    function loadGameHistory() {
        fetch('/api/knights-tour/games')
        .then(response => response.json())
        .then(games => {
            historyList.innerHTML = '';
            games.forEach(game => {
                const item = document.createElement('div');
                item.className = 'history-item';
                
                const playerSpan = document.createElement('span');
                playerSpan.className = 'history-player';
                playerSpan.textContent = game.player_name;
                
                const startSpan = document.createElement('span');
                startSpan.className = 'history-start';
                startSpan.textContent = game.start_position || '-';
                
                const movesSpan = document.createElement('span');
                movesSpan.className = 'history-moves';
                movesSpan.textContent = `${game.move_count} moves`;
                
                item.appendChild(playerSpan);
                item.appendChild(startSpan);
                item.appendChild(movesSpan);
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