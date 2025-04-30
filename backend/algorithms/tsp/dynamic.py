import itertools


def dynamic_programming_tsp(cities, distances):
    """
    Solve TSP using dynamic programming (Held-Karp algorithm)
    :param cities: List of cities to visit (including home city)
    :param distances: Dictionary of distances between cities
    :return: Tuple of (optimal route, optimal distance)
    """
    if len(cities) <= 1:
        return cities, 0
    
    home = cities[0]
    other_cities = cities[1:]
    n = len(other_cities)
    
    # Memoization table: key=(subset, last_city), value=(distance, path)
    memo = {}
    
    # Initialize memo table for subsets of size 1
    for i, city in enumerate(other_cities):
        key = (frozenset([city]), city)
        memo[key] = (distances[f"{home}-{city}"], [home, city])
    
    # Iterate through subset sizes from 2 to n
    for subset_size in range(2, n + 1):
        new_memo = {}
        
        for subset in itertools.combinations(other_cities, subset_size):
            subset = frozenset(subset)
            
            for last_city in subset:
                # Initialize min distance for this (subset, last_city)
                min_dist = float('inf')
                best_path = None
                
                # Try all possible previous cities in the subset
                for prev_city in subset:
                    if prev_city == last_city:
                        continue
                    
                    # Previous subset without last_city
                    prev_subset = subset - {last_city}
                    key = (prev_subset, prev_city)
                    
                    if key in memo:
                        dist, path = memo[key]
                        total_dist = dist + distances[f"{prev_city}-{last_city}"]
                        
                        if total_dist < min_dist:
                            min_dist = total_dist
                            best_path = path + [last_city]
                
                if best_path is not None:
                    new_key = (subset, last_city)
                    new_memo[new_key] = (min_dist, best_path)
        
        memo = new_memo
    
    # Find the minimal distance by connecting back to home city
    min_distance = float('inf')
    best_route = None
    
    for last_city in other_cities:
        key = (frozenset(other_cities), last_city)
        if key in memo:
            dist, path = memo[key]
            total_dist = dist + distances[f"{last_city}-{home}"]
            
            if total_dist < min_distance:
                min_distance = total_dist
                best_route = path + [home]
    
    return best_route, min_distance