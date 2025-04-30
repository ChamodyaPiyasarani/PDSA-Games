import pytest
from backend.models.tic_tac_toe import TicTacToeGame, Algorithm

def test_tic_tac_toe_game_creation():
    """Test creating a new Tic-Tac-Toe game."""
    game = TicTacToeGame()
    assert game.board == [['', '', ''], ['', '', ''], ['', '', '']]
    assert game.current_player == 'X'
    assert game.winner is None
    assert game.is_draw is False
    assert game.algorithm == Algorithm.MINIMAX  # Default algorithm

def test_tic_tac_toe_game_creation_with_algorithm():
    """Test creating a new Tic-Tac-Toe game with specific algorithm."""
    # Test with random algorithm
    game = TicTacToeGame(algorithm=Algorithm.RANDOM)
    assert game.algorithm == Algorithm.RANDOM
    
    # Test with greedy algorithm
    game = TicTacToeGame(algorithm=Algorithm.GREEDY)
    assert game.algorithm == Algorithm.GREEDY
    
    # Test with minimax algorithm
    game = TicTacToeGame(algorithm=Algorithm.MINIMAX)
    assert game.algorithm == Algorithm.MINIMAX

def test_tic_tac_toe_valid_move():
    """Test making a valid move in Tic-Tac-Toe."""
    game = TicTacToeGame()
    assert game.make_move(0, 0) is True
    assert game.board[0][0] == 'X'
    assert game.current_player == 'O'

def test_tic_tac_toe_invalid_move():
    """Test making an invalid move in Tic-Tac-Toe."""
    game = TicTacToeGame()
    game.make_move(0, 0)
    assert game.make_move(0, 0) is False  # Try to place in occupied cell
    assert game.make_move(-1, 0) is False  # Try to place outside board
    assert game.make_move(3, 0) is False   # Try to place outside board

def test_tic_tac_toe_win_condition():
    """Test win conditions in Tic-Tac-Toe."""
    game = TicTacToeGame()
    # Test row win
    game.make_move(0, 0)  # X
    game.make_move(1, 0)  # O
    game.make_move(0, 1)  # X
    game.make_move(1, 1)  # O
    game.make_move(0, 2)  # X
    assert game.winner == 'X'
    assert game.is_draw is False

def test_tic_tac_toe_draw_condition():
    """Test draw condition in Tic-Tac-Toe."""
    game = TicTacToeGame()
    # Create a draw scenario
    moves = [(0, 0), (0, 1), (0, 2),
             (1, 0), (1, 1), (1, 2),
             (2, 0), (2, 1), (2, 2)]
    for move in moves:
        game.make_move(*move)
    assert game.winner is None
    assert game.is_draw is True

def test_tic_tac_toe_computer_move_random():
    """Test computer move with random algorithm."""
    game = TicTacToeGame(algorithm=Algorithm.RANDOM)
    game.make_move(0, 0)  # Player makes first move
    computer_move = game.make_computer_move()
    assert computer_move is True
    # Check that computer made a valid move
    assert any(cell == 'O' for row in game.board for cell in row)

def test_tic_tac_toe_computer_move_greedy():
    """Test computer move with greedy algorithm."""
    game = TicTacToeGame(algorithm=Algorithm.GREEDY)
    # Set up a scenario where computer can win
    game.board = [['X', 'X', ''],
                 ['O', 'O', ''],
                 ['', '', '']]
    game.current_player = 'O'
    computer_move = game.make_computer_move()
    assert computer_move is True
    assert game.board[1][2] == 'O'  # Computer should complete the row

def test_tic_tac_toe_computer_move_minimax():
    """Test computer move with minimax algorithm."""
    game = TicTacToeGame(algorithm=Algorithm.MINIMAX)
    # Set up a scenario where computer can win
    game.board = [['X', 'X', ''],
                 ['O', 'O', ''],
                 ['', '', '']]
    game.current_player = 'O'
    computer_move = game.make_computer_move()
    assert computer_move is True
    assert game.board[1][2] == 'O'  # Computer should complete the row

def test_tic_tac_toe_api_create_game(client):
    """Test creating a new game through the API."""
    # Test with default algorithm
    response = client.post('/api/tic-tac-toe/games')
    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert 'board' in data
    assert 'current_player' in data
    assert 'algorithm' in data
    assert data['current_player'] == 'X'
    assert data['algorithm'] == 'MINIMAX'

    # Test with specific algorithm
    response = client.post('/api/tic-tac-toe/games',
                         json={'algorithm': 'RANDOM'})
    assert response.status_code == 201
    data = response.get_json()
    assert data['algorithm'] == 'RANDOM'

def test_tic_tac_toe_api_make_move(client):
    """Test making a move through the API."""
    # First create a game
    response = client.post('/api/tic-tac-toe/games')
    game_id = response.get_json()['id']
    
    # Make a valid move
    response = client.post(f'/api/tic-tac-toe/games/{game_id}/move',
                         json={'row': 0, 'col': 0})
    assert response.status_code == 200
    data = response.get_json()
    assert data['board'][0][0] == 'X'
    assert data['current_player'] == 'O'

def test_tic_tac_toe_api_computer_move(client):
    """Test computer making a move through the API."""
    # First create a game
    response = client.post('/api/tic-tac-toe/games')
    game_id = response.get_json()['id']
    
    # Make player move
    client.post(f'/api/tic-tac-toe/games/{game_id}/move',
               json={'row': 0, 'col': 0})
    
    # Get computer move
    response = client.post(f'/api/tic-tac-toe/games/{game_id}/computer-move')
    assert response.status_code == 200
    data = response.get_json()
    assert any(cell == 'O' for row in data['board'] for cell in row)
    assert data['current_player'] == 'X'

def test_tic_tac_toe_api_invalid_move(client):
    """Test making an invalid move through the API."""
    # First create a game
    response = client.post('/api/tic-tac-toe/games')
    game_id = response.get_json()['id']
    
    # Make an invalid move
    response = client.post(f'/api/tic-tac-toe/games/{game_id}/move',
                         json={'row': -1, 'col': 0})
    assert response.status_code == 400

def test_tic_tac_toe_api_get_game(client):
    """Test retrieving a game through the API."""
    # First create a game
    response = client.post('/api/tic-tac-toe/games')
    game_id = response.get_json()['id']
    
    # Get the game
    response = client.get(f'/api/tic-tac-toe/games/{game_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == game_id
    assert 'board' in data
    assert 'current_player' in data
    assert 'algorithm' in data 