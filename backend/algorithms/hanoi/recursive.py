def hanoi_recursive(n, source, target, auxiliary):
    """
    Solve Tower of Hanoi recursively
    :param n: Number of disks
    :param source: Source peg
    :param target: Target peg
    :param auxiliary: Auxiliary peg
    :return: List of moves
    """
    if n == 1:
        return [(1, source, target)]
    
    moves = []
    moves.extend(hanoi_recursive(n-1, source, auxiliary, target))
    moves.append((n, source, target))
    moves.extend(hanoi_recursive(n-1, auxiliary, target, source))
    return moves