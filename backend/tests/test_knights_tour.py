import pytest
from backend.models.knights_tour import KnightsTourGame

def test_knights_tour_game_creation():
    """Test creating a new Knight's Tour game."""
    game = KnightsTourGame()
    assert len(game.board) == 8  # Default 8x8 board
    assert all(cell == 0 for row in game.board for cell in row)
    assert game.current_position is None
    assert game.moves == 0
    assert game.is_complete() is False

def test_knights_tour_valid_move():
    """Test making a valid move in Knight's Tour."""
    game = KnightsTourGame()
    # Start at position (0, 0)
    assert game.start_tour(0, 0) is True
    assert game.current_position == (0, 0)
    assert game.board[0][0] == 1
    assert game.moves == 1
    # Make a valid L-shaped move
    assert game.make_move(2, 1) is True
    assert game.current_position == (2, 1)
    assert game.board[2][1] == 2
    assert game.moves == 2

def test_knights_tour_invalid_move():
    """Test making an invalid move in Knight's Tour."""
    game = KnightsTourGame()
    # Start at position (0, 0)
    game.start_tour(0, 0)
    # Try to move to invalid position
    assert game.make_move(1, 1) is False  # Not an L-shaped move
    assert game.make_move(3, 3) is False  # Not an L-shaped move
    # Try to move to already visited position
    assert game.make_move(0, 0) is False
    # Try to move outside board
    assert game.make_move(8, 8) is False
    assert game.make_move(-1, -1) is False

def test_knights_tour_win_condition():
    """Test win condition in Knight's Tour."""
    game = KnightsTourGame()
    # Start at position (0, 0)
    game.start_tour(0, 0)
    # Make a sequence of valid moves that covers the entire board
    moves = [(2, 1), (4, 0), (6, 1), (7, 3), (5, 4), (7, 5), (6, 7), (4, 6),
             (2, 7), (0, 6), (1, 4), (3, 5), (5, 6), (7, 7), (6, 5), (4, 4),
             (2, 3), (0, 4), (1, 2), (3, 1), (5, 0), (7, 1), (6, 3), (4, 2),
             (2, 1), (0, 2), (1, 0), (3, 1), (5, 2), (7, 3), (6, 5), (4, 6),
             (2, 7), (0, 6), (1, 4), (3, 5), (5, 6), (7, 7), (6, 5), (4, 4),
             (2, 3), (0, 4), (1, 2), (3, 1), (5, 0), (7, 1), (6, 3), (4, 2),
             (2, 1), (0, 2), (1, 0), (3, 1), (5, 2), (7, 3), (6, 5), (4, 6),
             (2, 7), (0, 6), (1, 4), (3, 5), (5, 6), (7, 7), (6, 5), (4, 4)]
    for move in moves:
        assert game.make_move(*move) is True
    assert game.is_complete() is True
    assert game.moves == 64

def test_knights_tour_api_create_game(client):
    """Test creating a new game through the API."""
    response = client.post('/api/knights-tour/games')
    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert 'board' in data
    assert 'current_position' in data
    assert 'moves' in data
    assert data['current_position'] is None
    assert data['moves'] == 0

def test_knights_tour_api_start_tour(client):
    """Test starting a tour through the API."""
    # First create a game
    response = client.post('/api/knights-tour/games')
    game_id = response.get_json()['id']
    
    # Start the tour
    response = client.post(f'/api/knights-tour/games/{game_id}/start',
                         json={'row': 0, 'col': 0})
    assert response.status_code == 200
    data = response.get_json()
    assert data['current_position'] == [0, 0]
    assert data['board'][0][0] == 1
    assert data['moves'] == 1

def test_knights_tour_api_make_move(client):
    """Test making a move through the API."""
    # First create a game
    response = client.post('/api/knights-tour/games')
    game_id = response.get_json()['id']
    
    # Start the tour
    client.post(f'/api/knights-tour/games/{game_id}/start',
               json={'row': 0, 'col': 0})
    
    # Make a valid move
    response = client.post(f'/api/knights-tour/games/{game_id}/move',
                         json={'row': 2, 'col': 1})
    assert response.status_code == 200
    data = response.get_json()
    assert data['current_position'] == [2, 1]
    assert data['board'][2][1] == 2
    assert data['moves'] == 2

def test_knights_tour_api_invalid_move(client):
    """Test making an invalid move through the API."""
    # First create a game
    response = client.post('/api/knights-tour/games')
    game_id = response.get_json()['id']
    
    # Start the tour
    client.post(f'/api/knights-tour/games/{game_id}/start',
               json={'row': 0, 'col': 0})
    
    # Try to make an invalid move
    response = client.post(f'/api/knights-tour/games/{game_id}/move',
                         json={'row': 1, 'col': 1})
    assert response.status_code == 400

def test_knights_tour_api_get_game(client):
    """Test retrieving a game through the API."""
    # First create a game
    response = client.post('/api/knights-tour/games')
    game_id = response.get_json()['id']
    
    # Get the game
    response = client.get(f'/api/knights-tour/games/{game_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == game_id
    assert 'board' in data
    assert 'current_position' in data
    assert 'moves' in data 