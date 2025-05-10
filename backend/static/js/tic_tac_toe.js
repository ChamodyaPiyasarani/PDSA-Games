document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const statusDisplay = document.getElementById('game-status');
    const timerDisplay = document.getElementById('game-timer');
    const startButton = document.getElementById('start-game');
    const playerNameInput = document.getElementById('player-name');
    const algorithmSelect = document.getElementById('algorithm-select');
    const historyList = document.getElementById('history-list');
    
    let gameActive = false;
    let currentPlayer = 'X'; // Human is always X
    let gameState = Array(25).fill('');
    let playerName = '';
    let timerInterval;
    let seconds = 0;
    let gameId = null;
    let selectedAlgorithm = 'minimax'; // Default algorithm
    
    // Handle algorithm selection
    algorithmSelect.addEventListener('change', (e) => {
        selectedAlgorithm = e.target.value;
    });
    
    // Initialize the board
    function initializeBoard() {
        board.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-index', i);
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
    }
    
    // Handle cell clicks
    function handleCellClick(e) {
        if (!gameActive) return;
        
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
        
        // If cell is already filled or it's not player's turn, ignore
        if (gameState[clickedCellIndex] !== '' || currentPlayer !== 'X') {
            return;
        }
        
        // Make player move
        makeMove(clickedCell, clickedCellIndex, 'X');
        
        // Check for win or draw
        if (checkWin('X')) {
            endGame(false);
            return;
        } else if (checkDraw()) {
            endGame(true);
            return;
        }
        
        // Switch to computer's turn
        currentPlayer = 'O';
        statusDisplay.textContent = "Computer's turn...";
        
        // Computer makes move after a short delay
        setTimeout(() => {
            makeComputerMove();
        }, 500);
    }
    
    // Player makes a move
    function makeMove(cell, index, player) {
        gameState[index] = player;
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
    }
    
    // Computer makes a move
    async function makeComputerMove() {
        if (!gameActive) return;
        
        try {
            const startTime = performance.now();
            let moveIndex;
            
            switch (selectedAlgorithm) {
                case 'minimax':
                    moveIndex = await findBestMove([...gameState]);
                    break;
                case 'alphabeta':
                    moveIndex = await findBestMoveAlphaBeta([...gameState]);
                    break;
                default:
                    moveIndex = await findBestMove([...gameState]);
            }
            
            const endTime = performance.now();
            const timeTaken = (endTime - startTime) / 1000; // Convert to seconds
            
            if (moveIndex !== null && moveIndex !== undefined) {
                const cell = document.querySelector(`.cell[data-index="${moveIndex}"]`);
                makeMove(cell, moveIndex, 'O');
                saveMove(moveIndex, 'O', timeTaken);
                
                // Check for win or draw
                if (checkWin('O')) {
                    endGame(false);
                    return;
                } else if (checkDraw()) {
                    endGame(true);
                    return;
                }
                
                // Switch back to player's turn
                currentPlayer = 'X';
                statusDisplay.textContent = "Your turn!";
            }
        } catch (error) {
            console.error('Error in computer move:', error);
            currentPlayer = 'X';
            statusDisplay.textContent = "Your turn!";
        }
    }
    
    // Random move algorithm
    async function findRandomMove(board) {
        return new Promise((resolve) => {
            const availableMoves = board.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
            resolve(availableMoves.length > 0 ? availableMoves[Math.floor(Math.random() * availableMoves.length)] : null);
        });
    }
    
    // Greedy move algorithm
    async function findGreedyMove(board) {
        return new Promise((resolve) => {
            // First check if computer can win
            for (let i = 0; i < 25; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    if (checkWin('O')) {
                        board[i] = '';
                        resolve(i);
                        return;
                    }
                    board[i] = '';
                }
            }
            
            // Then check if player can win and block
            for (let i = 0; i < 25; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    if (checkWin('X')) {
                        board[i] = '';
                        resolve(i);
                        return;
                    }
                    board[i] = '';
                }
            }
            
            // If center is available, take it
            if (board[12] === '') {
                resolve(12);
                return;
            }
            
            // Otherwise make a random move
            const availableMoves = board.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
            resolve(availableMoves.length > 0 ? availableMoves[Math.floor(Math.random() * availableMoves.length)] : null);
        });
    }
    
    // Save move to database
    function saveMove(index, player, timeTaken) {
        if (!gameId) return;
        
        const row = Math.floor(index / 5);
        const col = index % 5;
        
        fetch('/api/tic-tac-toe/moves', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_id: gameId,
                algorithm_used: selectedAlgorithm,
                time_taken: timeTaken,
                move_details: {
                    row: row,
                    col: col,
                    player: player
                }
            })
        })
        .catch(error => {
            console.error('Error saving move:', error);
        });
    }
    
    // Check for a win
    function checkWin(player) {
        // Winning combinations for 5x5 (need 5 in a row)
        const winPatterns = [
            // Rows
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], 
            [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
            
            // Columns
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22],
            [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
            
            // Diagonals
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
        ];
        
        return winPatterns.some(pattern => {
            return pattern.every(index => {
                return gameState[index] === player;
            });
        });
    }
    
    // Check for a draw
    function checkDraw() {
        return !gameState.includes('');
    }
    
    // End the game
    function endGame(isDraw) {
        gameActive = false;
        clearInterval(timerInterval);
        board.classList.remove('active');
        
        if (isDraw) {
            statusDisplay.textContent = "Game ended in a draw!";
            saveGameResult('draw');
            showMessage('Game ended in a draw!', 'success');
        } else {
            const winner = currentPlayer === 'X' ? playerName : 'Computer';
            statusDisplay.textContent = `${winner} wins!`;
            saveGameResult(winner === playerName ? 'win' : 'loss');
            showMessage(`${winner} wins!`, 'success');
        }
    }
    
    // Start a new game
    function startGame() {
        const result = validation.validatePlayerName(playerNameInput.value);
        if (!result.isValid) {
            validation.showValidationMessage(playerNameInput, result.message, false);
            return;
        }
        
        playerName = playerNameInput.value.trim();
        gameActive = true;
        currentPlayer = 'X';
        gameState = Array(25).fill('');
        seconds = 0;
        updateTimer();
        
        // Clear the board
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
        });
        
        // Create new game in database
        createNewGame();
        
        // Update UI
        statusDisplay.textContent = `Game started! ${playerName} (X) vs Computer (O)`;
        startButton.textContent = 'Restart Game';
        board.classList.add('active');
        
        showMessage('Game started! Good luck!', 'success');
    }
    
    // Update game timer
    function updateTimer() {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Start game button
    startButton.addEventListener('click', startGame);
    
    // Initialize the board
    initializeBoard();
    loadGameHistory();
    
    // Optimized Minimax Algorithm
    function findBestMove(board) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                const availableMoves = board.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
                resolve(availableMoves.length > 0 ? availableMoves[Math.floor(Math.random() * availableMoves.length)] : null);
            }, 1000);

            try {
                for (let i = 0; i < 25; i++) {
                    if (board[i] === '') {
                        board[i] = 'O';
                        if (checkWin('O')) {
                            board[i] = '';
                            clearTimeout(timeout);
                            resolve(i);
                            return;
                        }
                        board[i] = '';
                    }
                }

                for (let i = 0; i < 25; i++) {
                    if (board[i] === '') {
                        board[i] = 'X';
                        if (checkWin('X')) {
                            board[i] = '';
                            clearTimeout(timeout);
                            resolve(i);
                            return;
                        }
                        board[i] = '';
                    }
                }

                if (board[12] === '') {
                    clearTimeout(timeout);
                    resolve(12);
                    return;
                }

                let bestScore = -Infinity;
                let bestMove = null;
                
                const availableMoves = board.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
                
                for (let i = availableMoves.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [availableMoves[i], availableMoves[j]] = [availableMoves[j], availableMoves[i]];
                }
                
                for (const move of availableMoves) {
                    board[move] = 'O';
                    const score = minimax(board, 0, false, 2);
                    board[move] = '';
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = move;
                    }
                }
                
                clearTimeout(timeout);
                resolve(bestMove || availableMoves[0]);
            } catch (error) {
                console.error('Error in findBestMove:', error);
                clearTimeout(timeout);
                const availableMoves = board.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
                resolve(availableMoves.length > 0 ? availableMoves[Math.floor(Math.random() * availableMoves.length)] : null);
            }
        });
    }

    function minimax(board, depth, isMaximizing, maxDepth) {
        if (checkWin('O')) return 10 - depth;
        if (checkWin('X')) return depth - 10;
        if (checkDraw() || depth >= maxDepth) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 25; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    const score = minimax(board, depth + 1, false, maxDepth);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 25; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    const score = minimax(board, depth + 1, true, maxDepth);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    
    function findPotentialWins(board, player) {
        const potentialWins = [];
        const winPatterns = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], 
            [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22],
            [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
        ];
        
        for (const pattern of winPatterns) {
            let emptyCount = 0;
            let playerCount = 0;
            let emptyIndex = -1;
            
            for (const index of pattern) {
                if (board[index] === '') {
                    emptyCount++;
                    emptyIndex = index;
                } else if (board[index] === player) {
                    playerCount++;
                }
            }
            
            if (emptyCount === 1 && playerCount === 4) {
                potentialWins.push(emptyIndex);
            }
        }
        
        return potentialWins;
    }
    
    // Database functions
    function createNewGame() {
        fetch('/api/tic-tac-toe/games', {
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
    
    function saveGameResult(result) {
        if (!gameId) return;
        
        fetch(`/api/tic-tac-toe/games/${gameId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                result: result
            })
        })
        .then(() => {
            loadGameHistory();
        })
        .catch(error => {
            console.error('Error saving game result:', error);
        });
    }
    
    function loadGameHistory() {
        fetch('/api/tic-tac-toe/games')
        .then(response => response.json())
        .then(games => {
            historyList.innerHTML = '';
            games.forEach(game => {
                const item = document.createElement('div');
                item.className = 'history-item';
                
                const playerSpan = document.createElement('span');
                playerSpan.className = 'player';
                playerSpan.textContent = game.player_name;
                
                const resultSpan = document.createElement('span');
                resultSpan.className = 'result';
                resultSpan.textContent = game.result;
                
                const dateSpan = document.createElement('span');
                dateSpan.className = 'date';
                dateSpan.textContent = new Date(game.date).toLocaleString();
                
                item.appendChild(playerSpan);
                item.appendChild(resultSpan);
                item.appendChild(dateSpan);
                historyList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading game history:', error);
        });
    }
    
    // Alpha-Beta Pruning algorithm
    async function findBestMoveAlphaBeta(board) {
        return new Promise((resolve) => {
            let bestScore = -Infinity;
            let bestMove = null;
            const availableMoves = board.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
            
            // If there's only one move available, take it immediately
            if (availableMoves.length === 1) {
                resolve(availableMoves[0]);
                return;
            }
            
            // Try to win immediately if possible
            for (const move of availableMoves) {
                board[move] = 'O';
                if (checkWin('O')) {
                    board[move] = '';
                    resolve(move);
                    return;
                }
                board[move] = '';
            }
            
            // Block opponent's winning move
            for (const move of availableMoves) {
                board[move] = 'X';
                if (checkWin('X')) {
                    board[move] = '';
                    resolve(move);
                    return;
                }
                board[move] = '';
            }
            
            // Take center if available
            if (board[12] === '') {
                resolve(12);
                return;
            }
            
            // Use Alpha-Beta for other moves
            for (const move of availableMoves) {
                board[move] = 'O';
                const score = alphaBeta(board, 0, -Infinity, Infinity, false, 3); // Limited depth
                board[move] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
            
            resolve(bestMove || availableMoves[0]);
        });
    }
    
    function alphaBeta(board, depth, alpha, beta, isMaximizing, maxDepth) {
        // Base cases
        if (checkWin('O')) return 100 - depth;
        if (checkWin('X')) return depth - 100;
        if (checkDraw()) return 0;
        if (depth >= maxDepth) return evaluateBoard(board);
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 25; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    const score = alphaBeta(board, depth + 1, alpha, beta, false, maxDepth);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                    alpha = Math.max(alpha, bestScore);
                    if (beta <= alpha) break;
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 25; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    const score = alphaBeta(board, depth + 1, alpha, beta, true, maxDepth);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                    beta = Math.min(beta, bestScore);
                    if (beta <= alpha) break;
                }
            }
            return bestScore;
        }
    }
    
    function evaluateBoard(board) {
        let score = 0;
        
        // Check rows
        for (let row = 0; row < 5; row++) {
            const rowStart = row * 5;
            score += evaluateLine(board, rowStart, rowStart + 1, rowStart + 2, rowStart + 3, rowStart + 4);
        }
        
        // Check columns
        for (let col = 0; col < 5; col++) {
            score += evaluateLine(board, col, col + 5, col + 10, col + 15, col + 20);
        }
        
        // Check diagonals
        score += evaluateLine(board, 0, 6, 12, 18, 24); // Main diagonal
        score += evaluateLine(board, 4, 8, 12, 16, 20); // Anti-diagonal
        
        return score;
    }
    
    function evaluateLine(board, a, b, c, d, e) {
        let score = 0;
        
        // Count O's and X's in the line
        let oCount = 0;
        let xCount = 0;
        let emptyCount = 0;
        
        [a, b, c, d, e].forEach(index => {
            if (board[index] === 'O') oCount++;
            else if (board[index] === 'X') xCount++;
            else emptyCount++;
        });
        
        // Evaluate based on counts
        if (oCount === 5) score += 100;
        else if (oCount === 4 && emptyCount === 1) score += 50;
        else if (oCount === 3 && emptyCount === 2) score += 10;
        else if (oCount === 2 && emptyCount === 3) score += 5;
        
        if (xCount === 5) score -= 100;
        else if (xCount === 4 && emptyCount === 1) score -= 50;
        else if (xCount === 3 && emptyCount === 2) score -= 10;
        else if (xCount === 2 && emptyCount === 3) score -= 5;
        
        return score;
    }
});