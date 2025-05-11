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
    
    let diskCount = 5; 
    let pegCount = 3;
    let disks = [];
    let selectedDisk = null;
    let selectedPeg = null;
    let moveCount = 0;
    let moveHistory = [];
    let gameActive = false;
    let gameId = null;
    let playerName = '';
    
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
        
        // Create a new game record on the server
        fetch('/api/hanoi/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_name: playerName
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to create game');
            return response.json();
        })
        .then(data => {
            gameId = data.game_id;
            diskCount = data.disk_count;
            
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
                disk.style.backgroundColor = `hsl(${(i * 30) % 360}, 70%, 50%)`;
                
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
            submitButton.disabled = true;
            
            // Enable peg interactions
            enablePegInteractions();
            
            showMessage('Game started! Click on a disk to move it', 'success');
        })
        .catch(error => {
            console.error('Error creating game:', error);
            showMessage('Failed to start game', 'error');
        });
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
        
        if (!selectedDisk) {
            const pegDisks = document.getElementById(`disks-${pegId}`).children;
            const topDisk = pegDisks[pegDisks.length - 1];
            
            if (disk === topDisk) {
                selectedDisk = disk;
                selectedPeg = pegId;
                disk.classList.add('selected');
                statusDisplay.textContent = `Selected disk ${disk.dataset.size}. Now click on a peg to move it.`;
            } else {
                showMessage('You can only select the top disk of a peg', 'error');
            }
        } else if (disk === selectedDisk) {
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
            if (pegId === selectedPeg) {
                resetSelection();
                return;
            }
            
            const targetDisks = document.getElementById(`disks-${pegId}`).children;
            const selectedDiskSize = parseInt(selectedDisk.dataset.size);
            
            if (targetDisks.length > 0) {
                const topDiskSize = parseInt(targetDisks[targetDisks.length - 1].dataset.size);
                
                if (selectedDiskSize > topDiskSize) {
                    showMessage('Cannot place a larger disk on a smaller one', 'error');
                    resetSelection();
                    return;
                }
            }
            
            moveDisk(selectedDisk, selectedPeg, pegId);
        } else {
            const pegDisks = document.getElementById(`disks-${pegId}`).children;
            if (pegDisks.length > 0) {
                selectDisk(pegDisks[pegDisks.length - 1], pegId);
            }
        }
    }
    
    // Move disk from one peg to another
    function moveDisk(disk, fromPeg, toPeg) {
        document.getElementById(`disks-${fromPeg}`).removeChild(disk);
        
        disk.style.opacity = '1';
        disk.style.transform = 'translateY(0)';
        disk.classList.remove('selected');
        disk.addEventListener('click', (e) => {
            e.stopPropagation();
            selectDisk(disk, toPeg);
        });
        document.getElementById(`disks-${toPeg}`).appendChild(disk);
        
        moveCount++;
        moveCountDisplay.textContent = moveCount;
        
        const moveDescription = `Move disk ${disk.dataset.size} from peg ${fromPeg} to peg ${toPeg}`;
        moveHistory.push({disk: disk.dataset.size, from: fromPeg, to: toPeg});
        
        const moveItem = document.createElement('div');
        moveItem.className = 'move-item';
        moveItem.textContent = `${moveCount}. ${moveDescription}`;
        movesList.appendChild(moveItem);
        movesList.scrollTop = movesList.scrollHeight;
        
        // Check for game completion based on number of pegs
        const finalPeg = pegCount === 3 ? 'C' : 'D';
        if (document.getElementById(`disks-${finalPeg}`).children.length === diskCount) {
            endGame(true);
        } else {
            statusDisplay.textContent = 'Disk moved. Select another disk.';
            submitButton.disabled = false;
        }
        
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
        
        disablePegInteractions();
        gameActive = false;
        
        const disks = Array.from({length: diskCount}, (_, i) => diskCount - i);
        let solution;
        
        // Choose algorithm based on peg count
        if (pegCount === 3) {
            // Recursive solution for 3 pegs
            let startTime = performance.now();
            solution = solveHanoiRecursive(diskCount, 'A', 'C', 'B');
            let endTime = performance.now();
            recursiveTimeDisplay.textContent = `${(endTime - startTime).toFixed(2)}ms`;
            saveAlgorithmTime('recursive', endTime - startTime);
        } else {
            // Frame-Stewart algorithm for 4 pegs
            let startTime = performance.now();
            solution = solveHanoiFourPegs(diskCount, 'A', 'D', 'B', 'C');
            let endTime = performance.now();
            fourpegTimeDisplay.textContent = `${(endTime - startTime).toFixed(2)}ms`;
            saveAlgorithmTime('fourpeg', endTime - startTime);
        }
        
        animateSolution(solution);
    });
    
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
    
    function solveHanoiFourPegs(n, source, target, auxiliary1, auxiliary2) {
        if (n === 0) return [];
        if (n === 1) return [{disk: n, from: source, to: target}];
        
        // Calculate optimal k using Frame-Stewart algorithm
        const k = Math.floor(n - Math.sqrt(2 * n + 1) + 1);
        const moves = [];
        
        // Move k smallest disks to auxiliary1 using all 4 pegs
        moves.push(...solveHanoiFourPegs(k, source, auxiliary1, target, auxiliary2));
        
        // Move remaining n-k disks to target using 3 pegs (without auxiliary1)
        moves.push(...solveHanoiRecursive(n - k, source, target, auxiliary2));
        
        // Move k smallest disks from auxiliary1 to target using all 4 pegs
        moves.push(...solveHanoiFourPegs(k, auxiliary1, target, source, auxiliary2));
        
        return moves;
    }
    
    // Animate the solution
    function animateSolution(solution) {
        let i = 0;
        const movesList = document.getElementById('moves-list');
        movesList.innerHTML = ''; // Clear previous moves
        
        // Add explanation header
        const explanationHeader = document.createElement('div');
        explanationHeader.className = 'move-item explanation';
        explanationHeader.innerHTML = `<strong>Solution Steps (${pegCount} Pegs):</strong>`;
        movesList.appendChild(explanationHeader);
        
        function performMove() {
            if (i >= solution.length) {
                endGame(true);
                return;
            }
            
            const move = solution[i];
            const disk = document.querySelector(`#disks-${move.from} .disk:last-child`);
            
            // Add move explanation
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            moveItem.innerHTML = `<strong>Step ${i + 1}:</strong> Move disk ${move.disk} from peg ${move.from} to peg ${move.to}`;
            movesList.appendChild(moveItem);
            movesList.scrollTop = movesList.scrollHeight;
            
            if (disk) {
                // Add moving class to disk
                disk.classList.add('moving');
                
                // Add source and target classes to pegs
                const fromPeg = document.getElementById(`peg-${move.from}`);
                const toPeg = document.getElementById(`peg-${move.to}`);
                fromPeg.classList.add('source');
                toPeg.classList.add('target');
                
                // Create movement path
                const path = document.createElement('div');
                path.className = 'movement-path';
                const diskRect = disk.getBoundingClientRect();
                path.style.width = `${diskRect.width * 1.5}px`;
                path.style.height = `${diskRect.height * 1.5}px`;
                path.style.left = `${diskRect.left - diskRect.width/4}px`;
                path.style.top = `${diskRect.top - diskRect.height/4}px`;
                document.body.appendChild(path);
                
                // Create movement arrow
                const arrow = document.createElement('div');
                arrow.className = 'movement-arrow';
                arrow.style.left = `${diskRect.left + diskRect.width/2 - 10}px`;
                arrow.style.top = `${diskRect.top + diskRect.height/2 - 10}px`;
                document.body.appendChild(arrow);
                
                // Move the disk
                const toPegRect = toPeg.getBoundingClientRect();
                const targetX = toPegRect.left + (toPegRect.width / 2) - (diskRect.width / 2);
                const targetY = toPegRect.top + toPegRect.height - diskRect.height - 10;
                
                disk.style.position = 'fixed';
                disk.style.left = `${diskRect.left}px`;
                disk.style.top = `${diskRect.top}px`;
                disk.style.zIndex = '1000';
                
                requestAnimationFrame(() => {
                    disk.style.transform = `translate(${targetX - diskRect.left}px, ${targetY - diskRect.top}px)`;
                });
                
                // After animation completes, update the DOM
                setTimeout(() => {
                    // Clean up visual elements
                    disk.classList.remove('moving');
                    fromPeg.classList.remove('source');
                    toPeg.classList.remove('target');
                    path.remove();
                    arrow.remove();
                    
                    // Reset disk styles
                    disk.style.position = '';
                    disk.style.left = '';
                    disk.style.top = '';
                    disk.style.transform = '';
                    
                    // Update the disk's position in the DOM
                    document.getElementById(`disks-${move.from}`).removeChild(disk);
                    document.getElementById(`disks-${move.to}`).appendChild(disk);
                    
                    // Update disk click handler
                    disk.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectDisk(disk, move.to);
                    });
                    
                    i++;
                    setTimeout(performMove, 30);
                }, 150);
            }
        }
        
        performMove();
    }
    
    // Save game result
    function saveGameResult(isComplete) {
        if (!gameId) {
            console.error('No game ID available');
            return;
        }
        
        fetch(`/api/hanoi/games/${gameId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                move_count: moveCount,
                is_solved: isComplete ? 1 : 0,
                move_sequence: moveHistory
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to save game');
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
    
    // Helper function to show messages
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
        
        const finalPeg = pegCount === 3 ? 'C' : 'D';
        const isComplete = document.getElementById(`disks-${finalPeg}`).children.length === diskCount;
        saveGameResult(isComplete);
        
        if (isComplete) {
            showMessage('Solution submitted successfully!', 'success');
        } else {
            showMessage('Solution is not complete yet', 'error');
        }
    });
    
    // Load initial game history
    loadGameHistory();
});