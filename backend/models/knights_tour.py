from ..extensions import db
from datetime import datetime

class KnightsTourGame(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(100), nullable=False)
    start_position = db.Column(db.String(5), nullable=False)  # e.g., "A1"
    move_sequence = db.Column(db.String(500), nullable=False)  # comma-separated positions
    is_complete = db.Column(db.Boolean, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    algorithm_times = db.relationship('KnightsAlgorithmTime', backref='game', lazy=True)

class KnightsAlgorithmTime(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('knights_tour_game.id'), nullable=False)
    algorithm_used = db.Column(db.String(50), nullable=False)  # warnsdorff or backtracking
    time_taken = db.Column(db.Float, nullable=False)  # in seconds