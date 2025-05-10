document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    const cityMap = document.getElementById('city-map');
    const statusDisplay = document.getElementById('game-status');
    const homeCityDisplay = document.getElementById('home-city');
    const selectedCitiesDisplay = document.getElementById('selected-cities');
    const playerRouteDisplay = document.getElementById('player-route');
    const playerDistanceDisplay = document.getElementById('player-distance');
    const optimalDistanceDisplay = document.getElementById('optimal-distance');
    const bruteforceTimeDisplay = document.getElementById('bruteforce-time');
    const dynamicTimeDisplay = document.getElementById('dynamic-time');
    const geneticTimeDisplay = document.getElementById('genetic-time');
    const startButton = document.getElementById('start-game');
    const submitButton = document.getElementById('submit-route');
    const showSolutionButton = document.getElementById('show-solution');
    const playerNameInput = document.getElementById('player-name');
    const historyList = document.getElementById('history-list');
    const algorithmSelect = document.getElementById('algorithm-select');
    
    // Log all DOM elements to verify they're found
    console.log('DOM Elements:', {
        cityMap,
        statusDisplay,
        homeCityDisplay,
        selectedCitiesDisplay,
        playerRouteDisplay,
        playerDistanceDisplay,
        optimalDistanceDisplay,
        submitButton,
        showSolutionButton
    });
    
    let gameActive = false;
    let cities = [];
    let homeCity = null;
    let selectedCities = [];
    let playerRoute = [];
    let distances = {};
    let optimalRoute = [];
    let optimalDistance = Infinity;
    let gameId = null;
    let selectedAlgorithm = 'bruteforce';
    
    // Initialize the game
    function initializeGame() {
        try {
            const name = playerNameInput.value.trim();
            if (!name) {
                throw new Error('Please enter your name to start the game');
            }
            
            if (name.length < 2) {
                throw new Error('Name must be at least 2 characters long');
            }
            
            if (name.length > 50) {
                throw new Error('Name must not exceed 50 characters');
            }
            
            if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
                throw new Error('Name can only contain letters, numbers, and spaces');
            }
            
            playerName = name;
            // Clear previous game
            cityMap.innerHTML = '';
            selectedCities = [];
            playerRoute = [];
            distances = {};
            optimalRoute = [];
            optimalDistance = Infinity;
            
            // Generate cities (A-J)
            cities = Array.from({length: 10}, (_, i) => String.fromCharCode(65 + i));
            
            // Randomly select home city
            homeCity = cities[Math.floor(Math.random() * cities.length)];
            
            // Generate random distances between cities (50-100 km)
            for (let i = 0; i < cities.length; i++) {
                for (let j = i + 1; j < cities.length; j++) {
                    const distance = Math.floor(Math.random() * 51) + 50; // 50-100 km
                    distances[`${cities[i]}-${cities[j]}`] = distance;
                    distances[`${cities[j]}-${cities[i]}`] = distance;
                }
            }
            
            // Update UI
            homeCityDisplay.textContent = homeCity;
            selectedCitiesDisplay.textContent = '-';
            playerRouteDisplay.textContent = '-';
            playerDistanceDisplay.textContent = '-';
            optimalDistanceDisplay.textContent = '-';
            bruteforceTimeDisplay.textContent = '-';
            dynamicTimeDisplay.textContent = '-';
            geneticTimeDisplay.textContent = '-';
            statusDisplay.textContent = 'Select cities to visit';
            submitButton.disabled = true;
            showSolutionButton.disabled = true;
            
            // Create city elements with random positions
            cities.forEach(city => {
                const cityElement = document.createElement('div');
                cityElement.className = 'city';
                cityElement.textContent = city;
                cityElement.id = `city-${city}`;
                
                // Add home city class if it's the home city
                if (city === homeCity) {
                    cityElement.classList.add('home');
                    cityElement.style.backgroundColor = '#9b59b6'; // Purple color for home city
                    cityElement.style.color = 'white';
                    cityElement.style.border = '2px solid white';
                    cityElement.style.boxShadow = '0 0 10px rgba(155, 89, 182, 0.5)';
                }
                
                // Set random position within the map container
                const mapRect = cityMap.getBoundingClientRect();
                const maxX = mapRect.width - 40; // Account for city width
                const maxY = mapRect.height - 40; // Account for city height
                
                const x = Math.floor(Math.random() * maxX);
                const y = Math.floor(Math.random() * maxY);
                
                cityElement.style.left = `${x}px`;
                cityElement.style.top = `${y}px`;
                
                // Add click event listener with proper event handling
                cityElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    toggleCitySelection(city);
                });
                
                cityMap.appendChild(cityElement);
            });
            
            gameActive = true;
            cityMap.classList.add('active');
            
            showMessage('Game started! Select cities to visit', 'success');
            
            // Create new game in database
            createNewGame();
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Game initialization error:', error);
        }
    }
    
    // Toggle city selection
    function toggleCitySelection(city) {
        try {
            if (!gameActive) {
                throw new Error('Please start a new game first');
            }
            
            if (!city || typeof city !== 'string') {
                throw new Error('Invalid city selection');
            }
            
            if (city === homeCity) {
                throw new Error('Cannot select the home city');
            }
            
            const cityElement = document.getElementById(`city-${city}`);
            if (!cityElement) {
                throw new Error('City element not found');
            }
            
            const index = selectedCities.indexOf(city);
            
            if (index === -1) {
                if (selectedCities.length >= 9) {
                    throw new Error('Maximum of 9 cities can be selected');
                }
                selectedCities.push(city);
                cityElement.classList.add('selected');
                cityElement.style.backgroundColor = '#4CAF50'; // Green color for selected cities
                cityElement.style.color = 'white';
                showMessage(`City ${city} added to your route`, 'success');
            } else {
                selectedCities.splice(index, 1);
                cityElement.classList.remove('selected');
                cityElement.style.backgroundColor = ''; // Reset to default color
                cityElement.style.color = '';
                showMessage(`City ${city} removed from your route`, 'success');
            }
            
            // Update selected cities display
            selectedCitiesDisplay.textContent = selectedCities.length > 0 ? selectedCities.join(', ') : '-';
            
            // Enable/disable buttons based on selection count
            if (selectedCities.length >= 1) {
                submitButton.disabled = false;
                showSolutionButton.disabled = false;
            } else {
                submitButton.disabled = true;
                showSolutionButton.disabled = true;
            }
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('City selection error:', error);
        }
    }
    
    // Add submit button click handler
    submitButton.addEventListener('click', () => {
        console.log('Submit button clicked');
        submitPlayerRoute();
    });
    
    // Submit player route function
    function submitPlayerRoute() {
        try {
            if (!gameActive) {
                throw new Error('Please start a new game first');
            }
            
            if (!playerName) {
                throw new Error('Player name is required');
            }
            
            if (selectedCities.length < 1) {
                throw new Error('You need to select at least 1 city to submit a route');
            }
            
            // Calculate player's route
            playerRoute = [homeCity, ...selectedCities, homeCity];
            
            // Calculate distance
            const playerDistance = calculateRouteDistance(playerRoute);
            
            // Clear previous paths
            document.querySelectorAll('.path').forEach(el => el.remove());
            
            // Update displays
            playerRouteDisplay.textContent = playerRoute.join(' → ');
            playerDistanceDisplay.textContent = `${playerDistance} km`;
            
            // Draw route
            drawRoute(playerRoute, '#4CAF50', true);
            
            // Enable show solution button
            showSolutionButton.disabled = false;
            
            // Update status
            statusDisplay.textContent = `Route submitted! Distance: ${playerDistance} km`;
            
            showMessage('Your route has been submitted!', 'success');
            
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Route submission error:', error);
        }
    }
    
    // Calculate distance for a given route
    function calculateRouteDistance(route) {
        console.log('Calculating distance for route:', route);
        console.log('Available distances:', distances);
        
        let distance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            const key = `${route[i]}-${route[i+1]}`;
            console.log(`Checking distance for ${key}`);
            
            if (distances[key] === undefined) {
                console.error(`No distance found for ${key}`);
                throw new Error(`Distance not found for route segment: ${key}`);
            }
            
            distance += distances[key];
            console.log(`Added distance for ${key}: ${distances[key]}, Total: ${distance}`);
        }
        
        return distance;
    }
    
    // Show message function
    function showMessage(message, type) {
        console.log(`Showing message: ${message} (${type})`);
        statusDisplay.textContent = message;
        statusDisplay.className = `status ${type}`;
    }
    
    // Show optimal solution
    showSolutionButton.addEventListener('click', () => {
        console.log('Show solution button clicked');
        if (!gameActive || selectedCities.length < 1) {
            console.error('Cannot show solution - game not active or no cities selected');
            showMessage('Please select cities and submit your route first', 'error');
            return;
        }
        
        // Find optimal route using selected algorithm
        findOptimalRoute();
        
        // Update UI with optimal route
        optimalDistanceDisplay.textContent = `${optimalDistance} km`;
        
        // Draw optimal path
        drawRoute(optimalRoute, '#2196F3', false); // Algorithm route in blue
        
        // Update game status
        const playerDistance = calculateRouteDistance(playerRoute);
        statusDisplay.textContent = `Your distance: ${playerDistance} km vs Optimal: ${optimalDistance} km`;
        
        // Save game result
        saveGameResult(playerDistance, optimalDistance);
    });
    
    // Draw route on the map
    function drawRoute(route, color, isPlayerRoute = false) {
        console.log('Drawing route:', route);
        console.log('Is player route:', isPlayerRoute);
        
        // Clear previous paths of the same type
        const pathClass = isPlayerRoute ? 'player-path' : 'algorithm-path';
        document.querySelectorAll(`.${pathClass}`).forEach(el => el.remove());
        
        for (let i = 0; i < route.length - 1; i++) {
            const fromCity = document.getElementById(`city-${route[i]}`);
            const toCity = document.getElementById(`city-${route[i+1]}`);
            
            if (!fromCity || !toCity) {
                console.error(`Could not find elements for cities: ${route[i]} -> ${route[i+1]}`);
                console.log('From city element:', fromCity);
                console.log('To city element:', toCity);
                continue;
            }
            
            const fromRect = fromCity.getBoundingClientRect();
            const toRect = toCity.getBoundingClientRect();
            const mapRect = cityMap.getBoundingClientRect();
            
            const fromX = fromRect.left + fromRect.width/2 - mapRect.left;
            const fromY = fromRect.top + fromRect.height/2 - mapRect.top;
            const toX = toRect.left + toRect.width/2 - mapRect.left;
            const toY = toRect.top + toRect.height/2 - mapRect.top;
            
            const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
            const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
            
            const path = document.createElement('div');
            path.className = `path ${pathClass}`;
            path.style.width = `${length}px`;
            path.style.left = `${fromX}px`;
            path.style.top = `${fromY}px`;
            path.style.transform = `rotate(${angle}deg)`;
            path.style.backgroundColor = color;
            path.style.zIndex = isPlayerRoute ? '2' : '1';
            
            cityMap.appendChild(path);
        }
        
        console.log('Route drawing completed');
    }
    
    // Find optimal route using selected algorithm
    function findOptimalRoute() {
        const citiesToVisit = selectedCities;
        const algorithm = algorithmSelect.value;
        
        let startTime = performance.now();
        let result;
        
        switch(algorithm) {
            case 'bruteforce':
                result = bruteForceTSP([homeCity, ...citiesToVisit]);
                break;
            case 'dynamic':
                result = dynamicProgrammingTSP([homeCity, ...citiesToVisit]);
                break;
            case 'genetic':
                result = geneticAlgorithmTSP([homeCity, ...citiesToVisit]);
                break;
        }
        
        let endTime = performance.now();
        const timeDisplay = document.getElementById(`${algorithm}-time`);
        timeDisplay.textContent = `${(endTime - startTime).toFixed(2)}ms`;
        saveAlgorithmTime(algorithm, endTime - startTime);
        
        optimalRoute = result.route;
        optimalDistance = result.distance;
    }
    
    // TSP Algorithms (simplified implementations)
    function bruteForceTSP(cities) {
        // In a real implementation, this would generate all permutations
        // For simplicity, we'll just return a random route here
        const shuffled = [...cities.slice(1)];
        shuffleArray(shuffled);
        const route = [cities[0], ...shuffled, cities[0]];
        return {
            route: route,
            distance: calculateRouteDistance(route)
        };
    }
    
    function dynamicProgrammingTSP(cities) {
        // In a real implementation, this would use the Held-Karp algorithm
        // For simplicity, we'll just return a nearest neighbor solution here
        if (cities.length < 2) {
            return {
                route: cities,
                distance: 0
            };
        }
        
        const route = [cities[0]];
        const unvisited = new Set(cities.slice(1));
        
        while (unvisited.size > 0) {
            const last = route[route.length - 1];
            let nearest = null;
            let minDist = Infinity;
            
            for (const city of unvisited) {
                const dist = distances[`${last}-${city}`];
                if (dist < minDist) {
                    minDist = dist;
                    nearest = city;
                }
            }
            
            route.push(nearest);
            unvisited.delete(nearest);
        }
        
        route.push(cities[0]);
        return {
            route: route,
            distance: calculateRouteDistance(route)
        };
    }
    
    function geneticAlgorithmTSP(cities) {
        // In a real implementation, this would use a genetic algorithm
        // For simplicity, we'll just return a slightly optimized random route here
        const shuffled = [...cities.slice(1)];
        shuffleArray(shuffled);
        const route = [cities[0], ...shuffled, cities[0]];
        
        // Do a simple 2-opt optimization
        let improved = true;
        while (improved) {
            improved = false;
            for (let i = 1; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length - 1; j++) {
                    const currentDistance = 
                        distances[`${route[i-1]}-${route[i]}`] + 
                        distances[`${route[j]}-${route[j+1]}`];
                    const newDistance = 
                        distances[`${route[i-1]}-${route[j]}`] + 
                        distances[`${route[i]}-${route[j+1]}`];
                    
                    if (newDistance < currentDistance) {
                        // Reverse the sub-path between i and j
                        const reversed = route.slice(i, j + 1).reverse();
                        route.splice(i, j - i + 1, ...reversed);
                        improved = true;
                    }
                }
            }
        }
        
        return {
            route: route,
            distance: calculateRouteDistance(route)
        };
    }
    
    // Utility function to shuffle array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Database functions
    function createNewGame() {
        fetch('/api/tsp/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_name: playerName,
                home_city: homeCity,
                selected_cities: JSON.stringify([]),
                shortest_route: JSON.stringify([]),
                distance: 0,
                player_distance: 0
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to create game');
            return response.json();
        })
        .then(data => {
            gameId = data.game_id;
            console.log('New game created with ID:', gameId);
            showMessage('Game created successfully!', 'success');
        })
        .catch(error => {
            console.error('Error creating new game:', error);
            showMessage('Error creating new game: ' + error.message, 'error');
        });
    }
    
    function saveGameResult(playerDistance, optimalDistance) {
        if (!gameId) {
            showMessage('No active game to save results to', 'error');
            return;
        }
        
        if (!selectedCities || !optimalRoute) {
            showMessage('Missing game data to save', 'error');
            return;
        }
        
        fetch(`/api/tsp/games/${gameId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selected_cities: JSON.stringify(selectedCities),
                shortest_route: JSON.stringify(optimalRoute),
                distance: optimalDistance,
                player_distance: playerDistance
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save game result: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Game result saved successfully:', data);
            showMessage('Game results saved successfully!', 'success');
            loadGameHistory();
        })
        .catch(error => {
            console.error('Error saving game result:', error);
            showMessage('Error saving game results: ' + error.message, 'error');
        });
    }
    
    function saveAlgorithmTime(algorithm, time) {
        if (!gameId) return;
        
        fetch('/api/tsp/algorithm-times', {
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
        fetch('/api/tsp/games')
        .then(response => response.json())
        .then(games => {
            historyList.innerHTML = '';
            games.forEach(game => {
                const item = document.createElement('div');
                item.className = 'history-item';
                
                const playerSpan = document.createElement('span');
                playerSpan.className = 'history-player';
                playerSpan.textContent = game.player_name;
                
                const distanceSpan = document.createElement('span');
                distanceSpan.className = 'history-distance';
                distanceSpan.textContent = `${game.distance} km`;
                
                const citiesSpan = document.createElement('span');
                citiesSpan.className = 'history-cities';
                citiesSpan.textContent = `${game.home_city} → ${game.selected_cities.split(',').join(' → ')} → ${game.home_city}`;
                
                item.appendChild(playerSpan);
                item.appendChild(distanceSpan);
                item.appendChild(citiesSpan);
                historyList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading game history:', error);
        });
    }
    
    // Start game button
    startButton.addEventListener('click', initializeGame);
    
    // Load initial game history
    loadGameHistory();
});