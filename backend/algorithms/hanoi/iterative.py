def hanoi_iterative(n, source, target, auxiliary):
    """
    Solve Tower of Hanoi iteratively
    :param n: Number of disks
    :param source: Source peg
    :param target: Target peg
    :param auxiliary: Auxiliary peg
    :return: List of moves
    """
    moves = []
    stack = []
    stack.append({'n': n, 'source': source, 'target': target, 'auxiliary': auxiliary, 'stage': 0})
    
    while stack:
        current = stack[-1]
        
        if current['n'] == 1:
            moves.append((1, current['source'], current['target']))
            stack.pop()
            continue
        
        if current['stage'] == 0:
            # Move n-1 disks from source to auxiliary
            current['stage'] = 1
            stack.append({
                'n': current['n']-1,
                'source': current['source'],
                'target': current['auxiliary'],
                'auxiliary': current['target'],
                'stage': 0
            })
        elif current['stage'] == 1:
            # Move nth disk from source to target
            moves.append((current['n'], current['source'], current['target']))
            current['stage'] = 2
            stack.append({
                'n': current['n']-1,
                'source': current['auxiliary'],
                'target': current['target'],
                'auxiliary': current['source'],
                'stage': 0
            })
        else:
            stack.pop()
    
    return moves