document.addEventListener('DOMContentLoaded', () => {
    const pegsContainer = document.querySelector('.pegs-container');
    const disksA = document.getElementById('disks-A');
    const disksB = document.getElementById('disks-B');
    const disksC = document.getElementById('disks-C');
    const statusDisplay = document.getElementById('game-status');
    const moveCountDisplay = document.getElementById('move-count');
    const minMovesDisplay = document.getElementById('min-moves');
    const diskCountDisplay = document.getElementById('disk-count');
    const startButton = document.getElementById('start-game');
    const solveButton = document.getElementById('solve-game');
    const submitButton = document.getElementById('submit-solution');
    const movesList = document.getElementById('moves-list');
    const playerNameInput = document.getElementById('player-name');
    const historyList = document.getElementById('history-list');
    const recursiveTimeDisplay = document.getElementById('recursive-time');
    const iterativeTimeDisplay = document.getElementById('iterative-time');
    const fourpegTimeDisplay = document.getElementById('fourpeg-time');
    const pegCountSelect = document.getElementById('peg-count');
    
    let diskCount = 5; // Set default disk count
    let pegCount = 3;
    let disks = [];
    let selectedDisk = null;
    let selectedPeg = null;
    let moveCount = 0;
    let moveHistory = [];
    let gameActive = false;
    let gameId = null;
    let playerName = ''; // Add playerName declaration
    
    // Handle peg count change
    pegCountSelect.addEventListener('change', () => {
        pegCount = parseInt(pegCountSelect.value);
        const pegD = document.getElementById('peg-D');
        pegD.style.display = pegCount === 4 ? 'flex' : 'none';
    });
    
    // Initialize the game
    function initializeGame() {
        const name = playerNameInput.value.trim();
        if (!name) {
            showMessage('Please enter your name to start the game', 'error');
            return;
        }
        
        playerName = name;
        console.log('Starting game initialization...');
        // Clear previous game
        document.querySelectorAll('.disks').forEach(disks => {
            disks.innerHTML = '';
        });
        
        // Reset game state
        disks = [];
        selectedDisk = null;
        selectedPeg = null;
        moveCount = 0;
        moveHistory = [];
        gameActive = true;
        
        // Create disks
        for (let i = diskCount; i > 0; i--) {
            const disk = document.createElement('div');
            disk.className = 'disk';
            disk.style.width = `${i * 30 + 20}px`;
            disk.dataset.size = i;
            disk.style.backgroundColor = `hsl(${(i * 30) % 360}, 70%, 50%)`; // Add color to disks
            disk.addEventListener('click', (e) => {
                e.stopPropagation();
                selectDisk(disk, 'A');
            });
            disksA.appendChild(disk);
            disks.push({ size: i, peg: 'A' });
        }
        
        // Update UI
        moveCountDisplay.textContent = '0';
        minMovesDisplay.textContent = `${Math.pow(2, diskCount) - 1}`;
        diskCountDisplay.textContent = diskCount;
        statusDisplay.textContent = 'Game started! Click on a disk to select it';
        startButton.textContent = 'Restart Game';
        pegsContainer.classList.add('active');
        
        // Enable peg interactions
        enablePegInteractions();
        
        showMessage('Game started! Click on a disk to move it', 'success');
    }
    
    // Enable peg interactions
    function enablePegInteractions() {
        document.querySelectorAll('.peg').forEach(peg => {
            peg.addEventListener('click', handlePegClick);
        });
    }
    
    // Disable peg interactions
    function disablePegInteractions() {
        document.querySelectorAll('.peg').forEach(peg => {
            peg.removeEventListener('click', handlePegClick);
        });
    }
    
    // Select a disk
    function selectDisk(disk, pegId) {
        if (!gameActive) return;
        
        // If no disk is selected, select the top disk of this peg
        if (!selectedDisk) {
            const pegDisks = document.getElementById(`disks-${pegId}`).children;
            if (pegDisks.length > 0 && pegDisks[pegDisks.length - 1] === disk) {
                selectedDisk = disk;
                selectedPeg = pegId;
                disk.classList.add('selected');
                statusDisplay.textContent = `Selected disk ${disk.dataset.size}. Now click on a peg to move it.`;
            }
        } else if (disk === selectedDisk) {
            // If clicking the same disk, deselect it
            resetSelection();
        }
    }
    
    // Handle peg click
    function handlePegClick(e) {
        if (!gameActive) {
            showMessage('Please start a new game first', 'error');
            return;
        }
        
        const targetPeg = e.currentTarget;
        const pegId = targetPeg.dataset.peg;
        
        if (selectedDisk) {
            // Moving a disk to a new peg
            if (pegId === selectedPeg) {
                resetSelection();
                return;
            }
            
            // Check if move is valid
            const targetDisks = document.getElementById(`disks-${pegId}`).children;
            if (targetDisks.length > 0) {
                const topDiskSize = parseInt(targetDisks[targetDisks.length - 1].dataset.size);
                const selectedDiskSize = parseInt(selectedDisk.dataset.size);
                
                if (selectedDiskSize > topDiskSize) {
                    showMessage('Cannot place a larger disk on a smaller one', 'error');
                    resetSelection();
                    return;
                }
            }
            
            // Move the disk
            moveDisk(selectedDisk, selectedPeg, pegId);
        } else {
            // Selecting a disk from this peg
            const pegDisks = document.getElementById(`disks-${pegId}`).children;
            if (pegDisks.length > 0) {
                selectDisk(pegDisks[pegDisks.length - 1], pegId);
            }
        }
    }
    
    // Move disk from one peg to another
    function moveDisk(disk, fromPeg, toPeg) {
        // Remove from old peg
        document.getElementById(`disks-${fromPeg}`).removeChild(disk);
        
        // Add to new peg
        disk.style.opacity = '1';
        disk.style.transform = 'translateY(0)';
        disk.classList.remove('selected');
        disk.addEventListener('click', (e) => {
            e.stopPropagation();
            selectDisk(disk, toPeg);
        });
        document.getElementById(`disks-${toPeg}`).appendChild(disk);
        
        // Update move count and history
        moveCount++;
        moveCountDisplay.textContent = moveCount;
        
        const moveDescription = `Move disk ${disk.dataset.size} from peg ${fromPeg} to peg ${toPeg}`;
        moveHistory.push({disk: disk.dataset.size, from: fromPeg, to: toPeg});
        
        const moveItem = document.createElement('div');
        moveItem.className = 'move-item';
        moveItem.textContent = `${moveCount}. ${moveDescription}`;
        movesList.appendChild(moveItem);
        movesList.scrollTop = movesList.scrollHeight;
        
        // Check if game is won
        if (document.getElementById('disks-C').children.length === diskCount) {
            endGame(true);
        } else {
            statusDisplay.textContent = 'Disk moved. Select another disk.';
            submitButton.disabled = false;
        }
        
        // Reset selection
        selectedDisk = null;
        selectedPeg = null;
    }
    
    // Reset disk selection
    function resetSelection() {
        if (selectedDisk) {
            selectedDisk.classList.remove('selected');
            selectedDisk = null;
            selectedPeg = null;
            statusDisplay.textContent = 'Selection cleared. Click on a disk to select it.';
        }
    }
    
    // End the game
    function endGame(isComplete) {
        gameActive = false;
        pegsContainer.classList.remove('active');
        
        if (isComplete) {
            statusDisplay.textContent = 'Congratulations! You solved the Tower of Hanoi!';
            saveGameResult(true);
            showMessage('Congratulations! You solved the Tower of Hanoi!', 'success');
        } else {
            statusDisplay.textContent = 'Game over! Try again!';
            saveGameResult(false);
            showMessage('Game over! Try again!', 'error');
        }
    }
    
    // Solve the game automatically
    solveButton.addEventListener('click', () => {
        if (!gameActive) return;
        
        // Disable interactions while solving
        disablePegInteractions();
        gameActive = false;
        
        // Solve using different algorithms and measure time
        const disks = Array.from({length: diskCount}, (_, i) => diskCount - i);
        
        // Recursive solution
        let startTime = performance.now();
        const recursiveSolution = solveHanoiRecursive(diskCount, 'A', 'C', 'B');
        let endTime = performance.now();
        recursiveTimeDisplay.textContent = `${(endTime - startTime).toFixed(2)}ms`;
        saveAlgorithmTime('recursive', endTime - startTime);
        
        // Iterative solution
        startTime = performance.now();
        const iterativeSolution = solveHanoiIterative(diskCount, 'A', 'C', 'B');
        endTime = performance.now();
        iterativeTimeDisplay.textContent = `${(endTime - startTime).toFixed(2)}ms`;
        saveAlgorithmTime('iterative', endTime - startTime);
        
        // 4-peg solution
        startTime = performance.now();
        const fourpegSolution = solveHanoiFourPegs(diskCount, 'A', 'C', 'B', 'D');
        endTime = performance.now();
        fourpegTimeDisplay.textContent = `${(endTime - startTime).toFixed(2)}ms`;
        saveAlgorithmTime('fourpeg', endTime - startTime);
        
        // Animate the recursive solution (most straightforward to visualize)
        animateSolution(recursiveSolution);
    });
    
    // Animate the solution
    function animateSolution(solution) {
        let i = 0;
        const interval = setInterval(() => {
            if (i >= solution.length) {
                clearInterval(interval);
                endGame(true);
                return;
            }
            
            const move = solution[i];
            const disk = document.querySelector(`#disks-${move.from} .disk:last-child`);
            
            if (disk) {
                selectDisk(disk, move.from);
                setTimeout(() => {
                    if (selectedDisk) {
                        const targetPeg = document.getElementById(`peg-${move.to}`);
                        handlePegClick({currentTarget: targetPeg});
                    }
                }, 500);
            }
            
            i++;
        }, 1000);
    }
    
    // Hanoi algorithms
    function solveHanoiRecursive(n, source, target, auxiliary) {
        if (n === 1) {
            return [{disk: n, from: source, to: target}];
        }
        
        const moves = [];
        moves.push(...solveHanoiRecursive(n - 1, source, auxiliary, target));
        moves.push({disk: n, from: source, to: target});
        moves.push(...solveHanoiRecursive(n - 1, auxiliary, target, source));
        return moves;
    }
    
    function solveHanoiIterative(n, source, target, auxiliary) {
        const moves = [];
        const stack = [];
        stack.push({n: n, source: source, target: target, auxiliary: auxiliary, stage: 0});
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            
            if (current.n === 1) {
                moves.push({disk: current.n, from: current.source, to: current.target});
                stack.pop();
                continue;
            }
            
            if (current.stage === 0) {
                // Move n-1 disks from source to auxiliary
                current.stage = 1;
                stack.push({n: current.n - 1, source: current.source, target: current.auxiliary, auxiliary: current.target, stage: 0});
            } else if (current.stage === 1) {
                // Move nth disk from source to target
                moves.push({disk: current.n, from: current.source, to: current.target});
                current.stage = 2;
                stack.push({n: current.n - 1, source: current.auxiliary, target: current.target, auxiliary: current.source, stage: 0});
            } else {
                stack.pop();
            }
        }
        
        return moves;
    }
    
    function solveHanoiFourPegs(n, source, target, auxiliary1, auxiliary2) {
        if (n === 0) return [];
        if (n === 1) return [{disk: n, from: source, to: target}];
        
        const k = Math.floor(n - Math.sqrt(2 * n + 1) + 1);
        const moves = [];
        
        moves.push(...solveHanoiFourPegs(k, source, auxiliary1, target, auxiliary2));
        moves.push(...solveHanoiRecursive(n - k, source, target, auxiliary2));
        moves.push(...solveHanoiFourPegs(k, auxiliary1, target, source, auxiliary2));
        
        return moves;
    }
    
    // Start game button
    startButton.addEventListener('click', initializeGame);
    
    // Submit solution button
    submitButton.addEventListener('click', () => {
        if (!gameActive) {
            showMessage('Please start a game first', 'error');
            return;
        }
        
        if (moveHistory.length === 0) {
            showMessage('No moves have been made yet', 'error');
            return;
        }
        
        const isComplete = document.getElementById('disks-C').children.length === diskCount;
        saveGameResult(isComplete);
        
        if (isComplete) {
            showMessage('Solution submitted successfully!', 'success');
        } else {
            showMessage('Solution is not complete yet', 'error');
        }
    });
    
    // Save game result
    function saveGameResult(isComplete) {
        if (!gameId) return;
        
        fetch(`/api/hanoi/games/${gameId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                move_count: moveCount,
                is_correct: isComplete,
                move_sequence: JSON.stringify(moveHistory)
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
        
        fetch('/api/hanoi/algorithm-times', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_id: gameId,
                algorithm_used: algorithm,
                pegs_used: algorithm === 'fourpeg' ? 4 : 3,
                time_taken: time
            })
        })
        .catch(error => {
            console.error('Error saving algorithm time:', error);
        });
    }
    
    function loadGameHistory() {
        fetch('/api/hanoi/games')
        .then(response => response.json())
        .then(games => {
            historyList.innerHTML = '';
            games.forEach(game => {
                const item = document.createElement('div');
                item.className = 'history-item';
                
                const playerSpan = document.createElement('span');
                playerSpan.className = 'history-player';
                playerSpan.textContent = game.player_name;
                
                const disksSpan = document.createElement('span');
                disksSpan.className = 'history-disks';
                disksSpan.textContent = `${game.disk_count} disks`;
                
                const movesSpan = document.createElement('span');
                movesSpan.className = 'history-moves';
                movesSpan.textContent = `${game.move_count} moves`;
                
                item.appendChild(playerSpan);
                item.appendChild(disksSpan);
                item.appendChild(movesSpan);
                historyList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading game history:', error);
        });
    }
    
    // Load initial game history
    loadGameHistory();
});