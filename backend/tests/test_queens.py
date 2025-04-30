import pytest
from backend.models.queens import QueensGame

def test_queens_game_creation():
    """Test creating a new N-Queens game."""
    game = QueensGame()
    assert len(game.board) == 8  # Default 8x8 board
    assert all(cell == 0 for row in game.board for cell in row)
    assert game.queens_placed == 0
    assert game.is_complete() is False

def test_queens_valid_placement():
    """Test placing queens in valid positions."""
    game = QueensGame()
    # Place first queen
    assert game.place_queen(0, 0) is True
    assert game.board[0][0] == 1
    assert game.queens_placed == 1
    # Place second queen in a safe position
    assert game.place_queen(1, 2) is True
    assert game.board[1][2] == 1
    assert game.queens_placed == 2

def test_queens_invalid_placement():
    """Test placing queens in invalid positions."""
    game = QueensGame()
    # Place first queen
    game.place_queen(0, 0)
    # Try to place in same row
    assert game.place_queen(0, 1) is False
    # Try to place in same column
    assert game.place_queen(1, 0) is False
    # Try to place in diagonal
    assert game.place_queen(1, 1) is False
    # Try to place outside board
    assert game.place_queen(8, 8) is False

def test_queens_win_condition():
    """Test win condition in N-Queens."""
    game = QueensGame()
    # Place queens in a valid solution
    solution = [(0, 0), (1, 4), (2, 7), (3, 5), (4, 2), (5, 6), (6, 1), (7, 3)]
    for row, col in solution:
        assert game.place_queen(row, col) is True
    assert game.is_complete() is True
    assert game.queens_placed == 8

def test_queens_api_create_game(client):
    """Test creating a new game through the API."""
    response = client.post('/api/queens/games')
    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert 'board' in data
    assert 'queens_placed' in data
    assert data['queens_placed'] == 0

def test_queens_api_place_queen(client):
    """Test placing a queen through the API."""
    # First create a game
    response = client.post('/api/queens/games')
    game_id = response.get_json()['id']
    
    # Place a queen
    response = client.post(f'/api/queens/games/{game_id}/place',
                         json={'row': 0, 'col': 0})
    assert response.status_code == 200
    data = response.get_json()
    assert data['board'][0][0] == 1
    assert data['queens_placed'] == 1

def test_queens_api_invalid_placement(client):
    """Test placing a queen in an invalid position through the API."""
    # First create a game
    response = client.post('/api/queens/games')
    game_id = response.get_json()['id']
    
    # Place first queen
    client.post(f'/api/queens/games/{game_id}/place',
               json={'row': 0, 'col': 0})
    
    # Try to place in same row
    response = client.post(f'/api/queens/games/{game_id}/place',
                         json={'row': 0, 'col': 1})
    assert response.status_code == 400

def test_queens_api_get_game(client):
    """Test retrieving a game through the API."""
    # First create a game
    response = client.post('/api/queens/games')
    game_id = response.get_json()['id']
    
    # Get the game
    response = client.get(f'/api/queens/games/{game_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == game_id
    assert 'board' in data
    assert 'queens_placed' in data 