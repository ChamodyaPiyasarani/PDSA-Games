def check_win(board, player):
    """Check if the given player has won by getting 5 in a row"""
    # Check rows
    for row in range(5):
        for col in range(1):
            if (board[row*5 + col] == player and 
                board[row*5 + col+1] == player and 
                board[row*5 + col+2] == player and 
                board[row*5 + col+3] == player and 
                board[row*5 + col+4] == player):
                return True
    
    # Check columns
    for col in range(5):
        for row in range(1):
            if (board[row*5 + col] == player and 
                board[(row+1)*5 + col] == player and 
                board[(row+2)*5 + col] == player and 
                board[(row+3)*5 + col] == player and 
                board[(row+4)*5 + col] == player):
                return True
    
    # Check diagonals
    # Top-left to bottom-right
    if (board[0] == player and board[6] == player and 
        board[12] == player and board[18] == player and board[24] == player):
        return True
    
    # Top-right to bottom-left
    if (board[4] == player and board[8] == player and 
        board[12] == player and board[16] == player and board[20] == player):
        return True
    
    return False