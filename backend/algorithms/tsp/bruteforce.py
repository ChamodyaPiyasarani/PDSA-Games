import itertools

def brute_force_tsp(cities, distances):
    """
    Solve TSP using brute force (exhaustive search)
    :param cities: List of cities to visit (including home city)
    :param distances: Dictionary of distances between cities
    :return: Tuple of (optimal route, optimal distance)
    """
    if len(cities) <= 1:
        return cities, 0
    
    home = cities[0]
    other_cities = cities[1:]
    min_distance = float('inf')
    best_route = None
    
    # Generate all possible permutations of the cities
    for permutation in itertools.permutations(other_cities):
        current_route = [home] + list(permutation) + [home]
        current_distance = 0
        
        # Calculate total distance for this route
        for i in range(len(current_route) - 1):
            key = f"{current_route[i]}-{current_route[i+1]}"
            current_distance += distances[key]
        
        # Update best route if this one is better
        if current_distance < min_distance:
            min_distance = current_distance
            best_route = current_route
    
    return best_route, min_distance