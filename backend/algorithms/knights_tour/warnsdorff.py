def solve_knights_tour_warnsdorff(start_row, start_col):
    """
    Solve Knight's Tour using Warnsdorff's algorithm
    :param start_row: Starting row (0-7)
    :param start_col: Starting column (0-7)
    :return: List of moves in order [(row, col), ...]
    """
    # Possible knight moves
    moves = [
        (2, 1), (2, -1), (-2, 1), (-2, -1),
        (1, 2), (1, -2), (-1, 2), (-1, -2)
    ]
    
    # Initialize board
    board = [[0] * 8 for _ in range(8)]
    board[start_row][start_col] = 1
    
    solution = []
    current_row, current_col = start_row, start_col
    
    for move_number in range(2, 65):
        # Get all possible next moves
        possible_moves = []
        
        for dr, dc in moves:
            new_row, new_col = current_row + dr, current_col + dc
            
            if (0 <= new_row < 8 and 0 <= new_col < 8 and 
                board[new_row][new_col] == 0):
                
                # Count the number of onward moves from this position
                onward_moves = 0
                
                for dr2, dc2 in moves:
                    next_row, next_col = new_row + dr2, new_col + dc2
                    
                    if (0 <= next_row < 8 and 0 <= next_col < 8 and 
                        board[next_row][next_col] == 0):
                        onward_moves += 1
                
                possible_moves.append((new_row, new_col, onward_moves))
        
        if not possible_moves:
            break  # No solution found
        
        # Choose the move with the fewest onward moves
        possible_moves.sort(key=lambda x: x[2])
        next_row, next_col, _ = possible_moves[0]
        
        board[next_row][next_col] = move_number
        solution.append((next_row, next_col))
        current_row, current_col = next_row, next_col
    
    return solution