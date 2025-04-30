def find_queens_solutions_sequential():
    """
    Find all solutions to the 8 queens problem using sequential backtracking
    :return: List of solutions (each solution is a list of queen positions)
    """
    solutions = []
    cols = set()
    pos_diag = set()  # (r + c)
    neg_diag = set()  # (r - c)
    board = [[0] * 8 for _ in range(8)]
    
    def backtrack(r):
        if r == 8:
            # Add the solution
            solution = []
            for i in range(8):
                for j in range(8):
                    if board[i][j] == 1:
                        solution.append({'row': i, 'col': j})
            solutions.append(solution)
            return
        
        for c in range(8):
            if c in cols or (r + c) in pos_diag or (r - c) in neg_diag:
                continue
            
            cols.add(c)
            pos_diag.add(r + c)
            neg_diag.add(r - c)
            board[r][c] = 1
            
            backtrack(r + 1)
            
            cols.remove(c)
            pos_diag.remove(r + c)
            neg_diag.remove(r - c)
            board[r][c] = 0
    
    backtrack(0)
    return solutions
