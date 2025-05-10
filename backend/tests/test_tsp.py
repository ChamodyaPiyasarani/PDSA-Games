import pytest
from backend.models.tsp import TSPGame, TSPAlgorithmTime
from datetime import datetime

def test_tsp_game_creation():
    """Test creating a new TSP game."""
    game = TSPGame(
        player_name="Test Player",
        home_city="A",
        selected_cities="[]",
        shortest_route="[]",
        distance=0
    )
    assert game.player_name == "Test Player"
    assert game.home_city == "A"
    assert game.selected_cities == "[]"
    assert game.shortest_route == "[]"
    assert game.distance == 0
    assert isinstance(game.date, datetime)

def test_tsp_game_to_dict():
    """Test converting game to dictionary."""
    game = TSPGame(
        player_name="Test Player",
        home_city="A",
        selected_cities="[]",
        shortest_route="[]",
        distance=0
    )
    game_dict = game.to_dict()
    assert game_dict['player_name'] == "Test Player"
    assert game_dict['home_city'] == "A"
    assert game_dict['selected_cities'] == "[]"
    assert game_dict['shortest_route'] == "[]"
    assert game_dict['distance'] == 0
    assert 'date' in game_dict

def test_tsp_algorithm_time():
    """Test creating algorithm time record."""
    game = TSPGame(
        player_name="Test Player",
        home_city="A",
        selected_cities="[]",
        shortest_route="[]",
        distance=0
    )
    algorithm_time = TSPAlgorithmTime(
        game=game,
        algorithm_used="bruteforce",
        time_taken=1.5
    )
    assert algorithm_time.algorithm_used == "bruteforce"
    assert algorithm_time.time_taken == 1.5
    assert algorithm_time.game == game

def test_tsp_api_create_game(client):
    """Test creating a new game through the API."""
    response = client.post('/api/tsp/games', json={
        'player_name': 'Test Player',
        'home_city': 'A',
        'selected_cities': '[]',
        'shortest_route': '[]',
        'distance': 0
    })
    assert response.status_code == 201
    data = response.get_json()
    assert 'game_id' in data
    assert data['player_name'] == 'Test Player'
    assert data['home_city'] == 'A'

def test_tsp_api_update_game(client):
    """Test updating a game through the API."""
    # First create a game
    response = client.post('/api/tsp/games', json={
        'player_name': 'Test Player',
        'home_city': 'A',
        'selected_cities': '[]',
        'shortest_route': '[]',
        'distance': 0
    })
    game_id = response.get_json()['game_id']
    
    # Update the game
    response = client.patch(f'/api/tsp/games/{game_id}', json={
        'selected_cities': '["B", "C"]',
        'shortest_route': '["A", "B", "C", "A"]',
        'distance': 150.5,
        'player_distance': 160.0
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data['selected_cities'] == '["B", "C"]'
    assert data['shortest_route'] == '["A", "B", "C", "A"]'
    assert data['distance'] == 150.5

def test_tsp_api_get_game(client):
    """Test retrieving a game through the API."""
    # First create a game
    response = client.post('/api/tsp/games', json={
        'player_name': 'Test Player',
        'home_city': 'A',
        'selected_cities': '[]',
        'shortest_route': '[]',
        'distance': 0
    })
    game_id = response.get_json()['game_id']
    
    # Get the game
    response = client.get(f'/api/tsp/games/{game_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['player_name'] == 'Test Player'
    assert data['home_city'] == 'A'
    assert data['selected_cities'] == '[]'
    assert data['shortest_route'] == '[]'
    assert data['distance'] == 0

def test_tsp_api_save_algorithm_time(client):
    """Test saving algorithm time through the API."""
    # First create a game
    response = client.post('/api/tsp/games', json={
        'player_name': 'Test Player',
        'home_city': 'A',
        'selected_cities': '[]',
        'shortest_route': '[]',
        'distance': 0
    })
    game_id = response.get_json()['game_id']
    
    # Save algorithm time
    response = client.post('/api/tsp/algorithm-times', json={
        'game_id': game_id,
        'algorithm_used': 'bruteforce',
        'time_taken': 1.5
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['algorithm_used'] == 'bruteforce'
    assert data['time_taken'] == 1.5 