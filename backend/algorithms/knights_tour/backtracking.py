def solve_knights_tour_backtracking(start_row, start_col):
    """
    Solve Knight's Tour using backtracking
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
    
    def backtrack(row, col, move_count):
        if move_count == 64:
            return True
        
        # Try all possible moves in order
        for dr, dc in moves:
            new_row, new_col = row + dr, col + dc
            
            if (0 <= new_row < 8 and 0 <= new_col < 8 and 
                board[new_row][new_col] == 0):
                
                board[new_row][new_col] = move_count + 1
                solution.append((new_row, new_col))
                
                if backtrack(new_row, new_col, move_count + 1):
                    return True
                
                # Backtrack
                board[new_row][new_col] = 0
                solution.pop()
        
        return False
    
    backtrack(start_row, start_col, 1)
    return solution