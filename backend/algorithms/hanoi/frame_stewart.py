def hanoi_frame_stewart(n, source, target, auxiliary1, auxiliary2):
    """
    Solve Tower of Hanoi with 4 pegs using Frame-Stewart algorithm
    :param n: Number of disks
    :param source: Source peg
    :param target: Target peg
    :param auxiliary1: First auxiliary peg
    :param auxiliary2: Second auxiliary peg
    :return: List of moves
    """
    if n == 0:
        return []
    if n == 1:
        return [(1, source, target)]
    
    k = n - int((2*n + 1)**0.5) + 1
    moves = []
    
    # Move k smallest disks to auxiliary1 using all 4 pegs
    moves.extend(hanoi_frame_stewart(k, source, auxiliary1, target, auxiliary2))
    
    # Move remaining n-k disks to target using 3 pegs (without auxiliary1)
    moves.extend(hanoi_recursive(n-k, source, target, auxiliary2))
    
    # Move k smallest disks from auxiliary1 to target using all 4 pegs
    moves.extend(hanoi_frame_stewart(k, auxiliary1, target, source, auxiliary2))
    
    return moves

def hanoi_recursive(n, source, target, auxiliary):
    """
    Helper function for 3-peg recursive solution
    """
    if n == 1:
        return [(1, source, target)]
    
    moves = []
    moves.extend(hanoi_recursive(n-1, source, auxiliary, target))
    moves.append((n, source, target))
    moves.extend(hanoi_recursive(n-1, auxiliary, target, source))
    return moves