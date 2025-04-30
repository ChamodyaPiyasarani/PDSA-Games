from ..extensions import db
from datetime import datetime

class TicTacToeGame(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(100), nullable=False)
    result = db.Column(db.String(10), nullable=False)  # win, lose, draw
    date = db.Column(db.DateTime, default=datetime.utcnow)
    moves = db.relationship('TicTacToeMove', backref='game', lazy=True)

class TicTacToeMove(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('tic_tac_toe_game.id'), nullable=False)
    algorithm_used = db.Column(db.String(50), nullable=False, default='minimax')  # Only minimax for now
    time_taken = db.Column(db.Float, nullable=False)  # in seconds
    move_details = db.Column(db.JSON, nullable=False)  # {row: x, col: y, player: 'X' or 'O'}

class Algorithm:
    MINIMAX = "minimax"
    # ALPHABETA = "alphabeta"  # Commented out for now