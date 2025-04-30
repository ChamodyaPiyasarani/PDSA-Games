import threading
from queue import Queue

def find_queens_solutions_threaded():
    """
    Find all solutions to the 8 queens problem using threading
    :return: List of solutions (each solution is a list of queen positions)
    """
    solutions = []
    solutions_lock = threading.Lock()
    result_queue = Queue()
    threads = []
    
    def worker(start_col):
        cols = set()
        pos_diag = set()  # (r + c)
        neg_diag = set()  # (r - c)
        board = [[0] * 8 for _ in range(8)]
        local_solutions = []
        
        # Place first queen in the specified column
        cols.add(start_col)
        pos_diag.add(0 + start_col)
        neg_diag.add(0 - start_col)
        board[0][start_col] = 1
        
        def backtrack(r):
            if r == 8:
                # Add the solution
                solution = []
                for i in range(8):
                    for j in range(8):
                        if board[i][j] == 1:
                            solution.append({'row': i, 'col': j})
                local_solutions.append(solution)
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
        
        backtrack(1)
        result_queue.put(local_solutions)
    
    # Start a thread for each possible first queen position
    for col in range(8):
        thread = threading.Thread(target=worker, args=(col,))
        threads.append(thread)
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    # Collect results from all threads
    while not result_queue.empty():
        solutions.extend(result_queue.get())
    
    return solutions