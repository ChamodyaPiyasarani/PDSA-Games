def find_best_move(board, depth=3):
    """
    Find the best move for the computer player using Minimax algorithm
    :param board: Current game state (5x5 grid as a list)
    :param depth: Depth to search in the game tree
    :return: Best move index (0-24)
    """
    best_score = -float('inf')
    best_move = None
    
    for i in range(25):
        if board[i] == '':
            board[i] = 'O'  # Computer is 'O'
            score = minimax(board, depth, False)
            board[i] = ''  # Undo move
            
            if score > best_score:
                best_score = score
                best_move = i
                
    return best_move

def minimax(board, depth, is_maximizing):
    """
    Minimax algorithm implementation with depth limiting
    """
    # Check for terminal states
    if check_win(board, 'O'):
        return 10
    if check_win(board, 'X'):
        return -10
    if check_draw(board) or depth == 0:
        return 0
    
    if is_maximizing:
        best_score = -float('inf')
        for i in range(25):
            if board[i] == '':
                board[i] = 'O'
                score = minimax(board, depth - 1, False)
                board[i] = ''
                best_score = max(score, best_score)
        return best_score
    else:
        best_score = float('inf')
        for i in range(25):
            if board[i] == '':
                board[i] = 'X'
                score = minimax(board, depth - 1, True)
                board[i] = ''
                best_score = min(score, best_score)
        return best_score

def check_win(board, player):
    """Check if the given player has won (5 in a row)"""
    # Check all possible 5-in-a-row combinations
    # Rows (5x5)
    for row in range(5):
        for col in range(1):  # Only need to check starting positions where 5 fit
            if all(board[row*5 + col + i] == player for i in range(5)):
                return True
    
    # Columns (5x5)
    for col in range(5):
        for row in range(1):  # Only need to check starting positions where 5 fit
            if all(board[(row + i)*5 + col] == player for i in range(5)):
                return True
    
    # Diagonals (top-left to bottom-right)
    if all(board[i*5 + i] == player for i in range(5)):
        return True
    
    # Diagonals (top-right to bottom-left)
    if all(board[i*5 + (4 - i)] == player for i in range(5)):
        return True
    
    return False

def check_draw(board):
    """Check if the game is a draw"""
    return all(cell != '' for cell in board)