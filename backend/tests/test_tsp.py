import pytest
from backend.models.tsp import TSPGame

def test_tsp_game_creation():
    """Test creating a new TSP game."""
    game = TSPGame()
    assert len(game.cities) > 0
    assert len(game.distances) == len(game.cities)
    assert game.current_path == []
    assert game.total_distance == 0
    assert game.is_complete() is False

def test_tsp_valid_move():
    """Test making a valid move in TSP."""
    game = TSPGame()
    # Visit first city
    assert game.visit_city(0) is True
    assert game.current_path == [0]
    assert game.total_distance == 0
    # Visit second city
    assert game.visit_city(1) is True
    assert game.current_path == [0, 1]
    assert game.total_distance > 0

def test_tsp_invalid_move():
    """Test making an invalid move in TSP."""
    game = TSPGame()
    # Visit first city
    game.visit_city(0)
    # Try to visit same city again
    assert game.visit_city(0) is False
    # Try to visit invalid city index
    assert game.visit_city(len(game.cities)) is False
    assert game.visit_city(-1) is False

def test_tsp_win_condition():
    """Test win condition in TSP."""
    game = TSPGame()
    # Visit all cities
    for i in range(len(game.cities)):
        assert game.visit_city(i) is True
    assert game.is_complete() is True
    assert len(game.current_path) == len(game.cities)
    assert game.total_distance > 0

def test_tsp_api_create_game(client):
    """Test creating a new game through the API."""
    response = client.post('/api/tsp/games')
    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data
    assert 'cities' in data
    assert 'current_path' in data
    assert 'total_distance' in data
    assert data['current_path'] == []
    assert data['total_distance'] == 0

def test_tsp_api_visit_city(client):
    """Test visiting a city through the API."""
    # First create a game
    response = client.post('/api/tsp/games')
    game_id = response.get_json()['id']
    
    # Visit a city
    response = client.post(f'/api/tsp/games/{game_id}/visit',
                         json={'city_index': 0})
    assert response.status_code == 200
    data = response.get_json()
    assert data['current_path'] == [0]
    assert data['total_distance'] == 0

def test_tsp_api_invalid_visit(client):
    """Test visiting an invalid city through the API."""
    # First create a game
    response = client.post('/api/tsp/games')
    game_id = response.get_json()['id']
    
    # Visit first city
    client.post(f'/api/tsp/games/{game_id}/visit',
               json={'city_index': 0})
    
    # Try to visit same city again
    response = client.post(f'/api/tsp/games/{game_id}/visit',
                         json={'city_index': 0})
    assert response.status_code == 400

def test_tsp_api_get_game(client):
    """Test retrieving a game through the API."""
    # First create a game
    response = client.post('/api/tsp/games')
    game_id = response.get_json()['id']
    
    # Get the game
    response = client.get(f'/api/tsp/games/{game_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == game_id
    assert 'cities' in data
    assert 'current_path' in data
    assert 'total_distance' in data 