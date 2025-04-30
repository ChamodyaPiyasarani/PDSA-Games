import pytest
from backend.models.hanoi import HanoiGame

def test_hanoi_game_creation():
    """Test creating a new Tower of Hanoi game."""
    game = HanoiGame()
    assert len(game.towers) == 3
    assert game.towers[0] == [3, 2, 1]  # Initial state
    assert game.towers[1] == []
    assert game.towers[2] == []
    assert game.moves == 0

def test_hanoi_valid_move():
    """Test making a valid move in Tower of Hanoi."""
    game = HanoiGame()
    assert game.make_move(0, 2) is True  # Move from tower 0 to tower 2
    assert game.towers[0] == [3, 2]
    assert game.towers[2] == [1]
    assert game.moves == 1

def test_hanoi_invalid_move():
    """Test making an invalid move in Tower of Hanoi."""
    game = HanoiGame()
    # Try to move larger disk onto smaller disk
    game.make_move(0, 2)  # Move disk 1 to tower 2
    assert game.make_move(0, 2) is False  # Try to move disk 2 onto disk 1
    # Try to move from empty tower
    assert game.make_move(1, 2) is False
    # Try to move to same tower
    assert game.make_move(0, 0) is False

def test_hanoi_win_condition():
    """Test win condition in Tower of Hanoi."""
    game = HanoiGame()
    # Move all disks to tower 2
    moves = [(0, 2), (0, 1), (2, 1), (0, 2), (1, 0), (1, 2), (0, 2)]
    for move in moves:
        game.make_move(*move)
    assert game.is_complete() is True
    assert game.towers[2] == [3, 2, 1]

def test_hanoi_api_create_game(client):
    """Test creating a new game through the API."""
    response = client.post('/api/hanoi/games')
    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert 'towers' in data
    assert data['towers'][0] == [3, 2, 1]
    assert data['moves'] == 0

def test_hanoi_api_make_move(client):
    """Test making a move through the API."""
    # First create a game
    response = client.post('/api/hanoi/games')
    game_id = response.get_json()['id']
    
    # Make a valid move
    response = client.post(f'/api/hanoi/games/{game_id}/move',
                         json={'from_tower': 0, 'to_tower': 2})
    assert response.status_code == 200
    data = response.get_json()
    assert data['towers'][0] == [3, 2]
    assert data['towers'][2] == [1]
    assert data['moves'] == 1

def test_hanoi_api_invalid_move(client):
    """Test making an invalid move through the API."""
    # First create a game
    response = client.post('/api/hanoi/games')
    game_id = response.get_json()['id']
    
    # Make an invalid move
    response = client.post(f'/api/hanoi/games/{game_id}/move',
                         json={'from_tower': 1, 'to_tower': 2})
    assert response.status_code == 400

def test_hanoi_api_get_game(client):
    """Test retrieving a game through the API."""
    # First create a game
    response = client.post('/api/hanoi/games')
    game_id = response.get_json()['id']
    
    # Get the game
    response = client.get(f'/api/hanoi/games/{game_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == game_id
    assert 'towers' in data
    assert 'moves' in data 