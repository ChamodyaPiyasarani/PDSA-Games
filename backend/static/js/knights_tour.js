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
    let playerName = '';
    let animationInterval = null;

    // Initialize the chessboard
    function initializeChessboard() {
        // Clear any existing animation
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }

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
    async function startGame() {
        const name = playerNameInput.value.trim();
        if (!name) {
            showMessage('Please enter your name to start the game', 'error');
            return;
        }

        playerName = name;
        initializeChessboard();
        
        try {
            // Create new game in database
            const response = await fetch('/api/knights-tour/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: playerName
                })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create game');
            
            gameId = data.game_id;
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
            
            // Update game with starting position
            await updateGame(startRow, startCol);
            
        } catch (error) {
            console.error('Error starting game:', error);
            showMessage('Failed to start game: ' + error.message, 'error');
            gameActive = false;
        }
    }

    // Update game in database
    async function updateGame(row, col) {
        if (!gameId) return;
        
        try {
            const response = await fetch(`/api/knights-tour/games/${gameId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_position: `${String.fromCharCode(65 + col)}${8 - row}`,
                    move_sequence: moveHistory,
                    is_complete: moveCount === 64
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update game');
            }
        } catch (error) {
            console.error('Error updating game:', error);
        }
    }

    // Show possible moves from current position
    function showPossibleMoves(row, col) {
        // Clear all previous possible moves and block all squares
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('possible-move');
            square.removeEventListener('click', makeMove);
            square.style.pointerEvents = 'none';
        });

        // Only show moves from the current position
        const moves = getPossibleMoves(row, col);
        
        moves.forEach(move => {
            const square = document.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
            if (square && board[move.row][move.col] === 0) {
                square.classList.add('possible-move');
                square.style.pointerEvents = 'auto';
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
    async function makeMove(row, col, isAutomated = false) {
        if (!isAutomated && (!gameActive || currentPosition === null)) return;
        if (board[row][col] !== 0) return;
        
        // Clear UI elements
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('possible-move');
            square.removeEventListener('click', makeMove);
            square.style.pointerEvents = 'none';
        });
        
        document.querySelectorAll('.current').forEach(square => {
            square.classList.remove('current');
        });
        
        // Update board state
        const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
        square.classList.add('visited', 'current');
        
        // Remove existing knight and add new one
        const existingKnight = square.querySelector('.knight');
        if (existingKnight) square.removeChild(existingKnight);
        
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
        
        // Update game state
        board[row][col] = moveCount;
        currentPosition = { row, col };
        
        if (!moveHistory.some(m => m.row === row && m.col === col)) {
            moveHistory.push({ row, col, move: moveCount });
            addMoveToHistory(moveCount, row, col);
        }
        
        // Check for game completion
        if (moveCount === 64) {
            await endGame(true);
            return;
        }
        
        // Show next possible moves (only if not automated)
        if (!isAutomated) {
            const possibleMoves = getPossibleMoves(row, col);
            if (possibleMoves.length === 0) {
                statusDisplay.textContent = 'No more possible moves! Tour ended early.';
                submitButton.disabled = false;
                await endGame(false);
            } else {
                statusDisplay.textContent = `Move ${moveCount}. Select next move from highlighted squares`;
                showPossibleMoves(row, col);
            }
        }
        
        // Update game in database
        if (!isAutomated) {
            await updateGame(row, col);
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
    async function endGame(isComplete) {
        gameActive = false;
        chessboard.classList.remove('active');
        
        try {
            await fetch(`/api/knights-tour/games/${gameId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_complete: isComplete
                })
            });
            
            if (isComplete) {
                statusDisplay.textContent = 'Congratulations! You completed the Knight\'s Tour!';
                showMessage('Congratulations! You completed the Knight\'s Tour!', 'success');
            } else {
                statusDisplay.textContent = 'Game over! Try again!';
                showMessage('Game over! Try again!', 'error');
            }
            
            loadGameHistory();
        } catch (error) {
            console.error('Error ending game:', error);
            showMessage('Failed to save game result', 'error');
        }
    }

    // Solve the game automatically
    solveButton.addEventListener('click', async () => {
        const name = playerNameInput.value.trim();
        if (!name) {
            showMessage('Please enter your name to start the game', 'error');
            return;
        }

        playerName = name;
        initializeChessboard();
        solveButton.disabled = true;
        statusDisplay.textContent = 'Solving...';
        warnsdorffTimeDisplay.textContent = 'Calculating...';
        backtrackingTimeDisplay.textContent = 'Calculating...';

        try {
            // Create new game in database
            const gameResponse = await fetch('/api/knights-tour/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: playerName
                })
            });
            
            const gameData = await gameResponse.json();
            if (!gameResponse.ok) throw new Error(gameData.message || 'Failed to create game');
            
            gameId = gameData.game_id;
            gameActive = false;

            // Get a random starting position
            const startRow = Math.floor(Math.random() * 8);
            const startCol = Math.floor(Math.random() * 8);

            // Solve using Warnsdorff's algorithm
            let startTime = performance.now();
            statusDisplay.textContent = 'Solving with Warnsdorff...';
            
            const warnsdorffSolution = solveWithWarnsdorff(startRow, startCol);
            let endTime = performance.now();
            const warnsdorffTime = endTime - startTime;
            warnsdorffTimeDisplay.textContent = `${warnsdorffTime.toFixed(2)}ms`;

            // Check if solution is complete
            if (!warnsdorffSolution || warnsdorffSolution.length !== 63) {
                statusDisplay.textContent = 'No complete tour found from this starting position. Please try again.';
                showMessage('No complete tour found from this starting position. Please try again.', 'error');
                solveButton.disabled = false;
                return;
            }
            
            // Solve using backtracking
            startTime = performance.now();
            statusDisplay.textContent = 'Solving with Backtracking...';
            
            const backtrackingSolution = solveWithBacktracking(startRow, startCol);
            endTime = performance.now();
            const backtrackingTime = endTime - startTime;
            backtrackingTimeDisplay.textContent = `${backtrackingTime.toFixed(2)}ms`;
            
            // Save algorithm times
            await saveAlgorithmTime('warnsdorff', warnsdorffTime);
            await saveAlgorithmTime('backtracking', backtrackingTime);
            
            // Animate the Warnsdorff solution
            statusDisplay.textContent = 'Animating solution...';
            await animateSolution(warnsdorffSolution, startRow, startCol);

        } catch (error) {
            console.error('Error solving:', error);
            showMessage('Error solving the puzzle: ' + error.message, 'error');
            statusDisplay.textContent = 'Solution failed';
        } finally {
            solveButton.disabled = false;
            gameActive = false;
        }
    });

    // Implement Warnsdorff's algorithm
    function solveWithWarnsdorff(startRow, startCol) {
        const board = Array(8).fill().map(() => Array(8).fill(0));
        board[startRow][startCol] = 1;
        const moves = [];
        let currentRow = startRow;
        let currentCol = startCol;

        for (let move = 2; move <= 64; move++) {
            const possibleMoves = getPossibleMoves(currentRow, currentCol)
                .filter(m => board[m.row][m.col] === 0)
                .map(m => {
                    m.onwardMoves = getPossibleMoves(m.row, m.col)
                        .filter(m2 => board[m2.row][m2.col] === 0).length;
                    return m;
                });

            if (possibleMoves.length === 0) break;

            possibleMoves.sort((a, b) => a.onwardMoves - b.onwardMoves);
            const nextMove = possibleMoves[0];
            board[nextMove.row][nextMove.col] = move;
            moves.push(nextMove);
            currentRow = nextMove.row;
            currentCol = nextMove.col;
        }

        return moves;
    }

    // Implement Backtracking algorithm
    function solveWithBacktracking(startRow, startCol) {
        const board = Array(8).fill().map(() => Array(8).fill(0));
        board[startRow][startCol] = 1;
        const solution = [];
        const moves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];

        function backtrack(row, col, moveCount) {
            if (moveCount === 64) return true;
            
            const possibleMoves = moves.map(([dr, dc]) => ({
                row: row + dr,
                col: col + dc
            })).filter(m => 
                m.row >= 0 && m.row < 8 && 
                m.col >= 0 && m.col < 8 &&
                board[m.row][m.col] === 0
            );

            for (const move of possibleMoves) {
                board[move.row][move.col] = moveCount + 1;
                solution.push(move);
                
                if (backtrack(move.row, move.col, moveCount + 1)) {
                    return true;
                }
                
                board[move.row][move.col] = 0;
                solution.pop();
            }
            return false;
        }

        backtrack(startRow, startCol, 1);
        return solution;
    }

    // Save algorithm time to database
    async function saveAlgorithmTime(algorithm, time) {
        if (!gameId) return;
        
        try {
            await fetch('/api/knights-tour/algorithm-times', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_id: gameId,
                    algorithm_used: algorithm,
                    time_taken: time
                })
            });
        } catch (error) {
            console.error('Error saving algorithm time:', error);
        }
    }

    // Animate the solution
    async function animateSolution(solution, startRow, startCol) {
        return new Promise((resolve) => {
            initializeChessboard();
            board[startRow][startCol] = 1;
            currentPosition = { row: startRow, col: startCol };
            moveCount = 1;
            moveCountDisplay.textContent = '1';
            
            const startSquare = document.querySelector(`.square[data-row="${startRow}"][data-col="${startCol}"]`);
            startSquare.classList.add('start', 'current');
            
            const knight = document.createElement('div');
            knight.className = 'knight';
            knight.textContent = '♞';
            startSquare.appendChild(knight);
            
            const moveNumber = document.createElement('div');
            moveNumber.className = 'move-number';
            moveNumber.textContent = '1';
            startSquare.appendChild(moveNumber);
            
            moveHistory = [{ row: startRow, col: startCol, move: 1 }];
            movesList.innerHTML = '';
            addMoveToHistory(1, startRow, startCol);
            
            let i = 0;
            animationInterval = setInterval(() => {
                if (i >= solution.length) {
                    clearInterval(animationInterval);
                    statusDisplay.textContent = 'Solution complete!';
                    resolve();
                    return;
                }
                
                const move = solution[i];
                makeMove(move.row, move.col, true);
                i++;
            }, 100);
        });
    }

    // Load game history
    async function loadGameHistory() {
        try {
            const response = await fetch('/api/knights-tour/games');
            const games = await response.json();
            
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
                
                const completeSpan = document.createElement('span');
                completeSpan.className = 'history-complete';
                completeSpan.textContent = game.is_complete ? '✓' : '✗';
                
                item.appendChild(playerSpan);
                item.appendChild(startSpan);
                item.appendChild(movesSpan);
                item.appendChild(completeSpan);
                historyList.appendChild(item);
            });
        } catch (error) {
            console.error('Error loading game history:', error);
        }
    }

    // Utility function to show messages
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Start game button
    startButton.addEventListener('click', startGame);
    
    // Submit solution button
    submitButton.addEventListener('click', () => {
        if (moveHistory.length === 0) return;
        const isComplete = moveCount === 64;
        endGame(isComplete);
    });
    
    // Initialize the chessboard and load history
    initializeChessboard();
    loadGameHistory();
});