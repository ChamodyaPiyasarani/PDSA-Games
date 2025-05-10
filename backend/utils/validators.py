from typing import Any, Dict, List, Optional
from datetime import datetime

class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass

class GameValidator:
    @staticmethod
    def validate_player_name(name: str) -> None:
        """Validate player name"""
        if not name or not isinstance(name, str):
            raise ValidationError("Player name must be a non-empty string")
        if len(name.strip()) < 2:
            raise ValidationError("Player name must be at least 2 characters")
        if len(name) > 50:
            raise ValidationError("Player name must not exceed 50 characters")
        if not all(c.isalnum() or c.isspace() for c in name):
            raise ValidationError("Player name can only contain letters, numbers, and spaces")

    @staticmethod
    def validate_game_id(game_id: int) -> None:
        """Validate game ID"""
        if not isinstance(game_id, int) or game_id < 1:
            raise ValidationError("Invalid game ID")

    @staticmethod
    def validate_board_state(board: List[str], size: int = 5) -> None:
        """Validate board state"""
        if not isinstance(board, list):
            raise ValidationError("Board must be a list")
        if len(board) != size * size:
            raise ValidationError(f"Board must be {size}x{size}")
        if not all(isinstance(cell, str) for cell in board):
            raise ValidationError("All board cells must be strings")
        if not all(cell in ['', 'X', 'O'] for cell in board):
            raise ValidationError("Board cells must be empty, 'X', or 'O'")

    @staticmethod
    def validate_move(move: int, board: List[str]) -> None:
        """Validate move position"""
        if not isinstance(move, int):
            raise ValidationError("Move must be an integer")
        if move < 0 or move >= len(board):
            raise ValidationError("Invalid move position")
        if board[move] != '':
            raise ValidationError("Position already occupied")

    @staticmethod
    def validate_tsp_data(data: Dict[str, Any]) -> None:
        """Validate TSP game data"""
        required_fields = ['player_name', 'home_city', 'selected_cities']
        for field in required_fields:
            if field not in data:
                raise ValidationError(f"{field} is required")
        
        if not isinstance(data['selected_cities'], list):
            raise ValidationError("selected_cities must be a list")
        if len(data['selected_cities']) < 2:
            raise ValidationError("At least 2 cities must be selected")
        if not all(isinstance(city, str) for city in data['selected_cities']):
            raise ValidationError("All cities must be strings")

    @staticmethod
    def validate_hanoi_data(data: Dict[str, Any]) -> None:
        """Validate Tower of Hanoi data"""
        if 'disk_count' in data:
            if not isinstance(data['disk_count'], int):
                raise ValidationError("Disk count must be an integer")
            if data['disk_count'] < 3 or data['disk_count'] > 10:
                raise ValidationError("Disk count must be between 3 and 10") 