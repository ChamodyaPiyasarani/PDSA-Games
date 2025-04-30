import random

def genetic_algorithm_tsp(cities, distances, population_size=50, generations=100, mutation_rate=0.01):
    """
    Solve TSP using a genetic algorithm
    :param cities: List of cities to visit (including home city)
    :param distances: Dictionary of distances between cities
    :param population_size: Number of individuals in each generation
    :param generations: Number of generations to evolve
    :param mutation_rate: Probability of mutation
    :return: Tuple of (best route, best distance)
    """
    if len(cities) <= 1:
        return cities, 0
    
    home = cities[0]
    other_cities = cities[1:]
    
    # Fitness function (inverse of route distance)
    def calculate_fitness(route):
        total_distance = 0
        for i in range(len(route) - 1):
            key = f"{route[i]}-{route[i+1]}"
            total_distance += distances[key]
        return 1 / total_distance
    
    # Create initial population
    def create_individual():
        individual = [home] + random.sample(other_cities, len(other_cities)) + [home]
        return individual
    
    population = [create_individual() for _ in range(population_size)]
    
    # Evolve the population
    for _ in range(generations):
        # Evaluate fitness
        fitnesses = [calculate_fitness(individual) for individual in population]
        total_fitness = sum(fitnesses)
        probabilities = [f / total_fitness for f in fitnesses]
        
        # Select parents (roulette wheel selection)
        parents = []
        for _ in range(population_size):
            r = random.random()
            cumulative_probability = 0
            for i, prob in enumerate(probabilities):
                cumulative_probability += prob
                if r <= cumulative_probability:
                    parents.append(population[i])
                    break
        
        # Crossover (ordered crossover)
        new_population = []
        for i in range(0, population_size, 2):
            parent1, parent2 = parents[i], parents[i+1]
            
            # Select crossover points (excluding home cities)
            start, end = sorted(random.sample(range(1, len(other_cities) + 1), 2))
            
            # Create child1
            child1 = [None] * (len(other_cities) + 2)
            child1[0] = child1[-1] = home
            child1[start:end] = parent1[start:end]
            
            # Fill remaining cities from parent2 in order
            remaining = [city for city in parent2[1:-1] if city not in child1[start:end]]
            ptr = 1
            for city in remaining:
                while ptr < len(child1) - 1 and child1[ptr] is not None:
                    ptr += 1
                if ptr >= len(child1) - 1:
                    break
                child1[ptr] = city
                ptr += 1
            
            # Create child2 similarly
            child2 = [None] * (len(other_cities) + 2)
            child2[0] = child2[-1] = home
            child2[start:end] = parent2[start:end]
            
            remaining = [city for city in parent1[1:-1] if city not in child2[start:end]]
            ptr = 1
            for city in remaining:
                while ptr < len(child2) - 1 and child2[ptr] is not None:
                    ptr += 1
                if ptr >= len(child2) - 1:
                    break
                child2[ptr] = city
                ptr += 1
            
            new_population.extend([child1, child2])
        
        # Mutation (swap mutation)
        for i in range(len(new_population)):
            if random.random() < mutation_rate:
                # Select two random positions (excluding home cities) to swap
                idx1, idx2 = random.sample(range(1, len(other_cities) + 1), 2)
                new_population[i][idx1], new_population[i][idx2] = new_population[i][idx2], new_population[i][idx1]
        
        population = new_population
    
    # Find the best individual in the final population
    best_individual = min(population, key=lambda x: calculate_fitness(x))
    best_distance = 1 / calculate_fitness(best_individual)
    
    return best_individual, best_distance