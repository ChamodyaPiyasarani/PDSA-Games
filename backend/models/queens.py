from ..extensions import db
from datetime import datetime

class QueensGame(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(100), nullable=False)
    solution_found = db.Column(db.String(100), nullable=False)  # positions as JSON
    solution_number = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)

class QueensAlgorithmTime(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('queens_game.id'), nullable=False)
    algorithm_type = db.Column(db.String(50), nullable=False)  # sequential or threaded
    solutions_found = db.Column(db.Integer, nullable=False)
    time_taken = db.Column(db.Float, nullable=False)  # in seconds
    date = db.Column(db.DateTime, default=datetime.utcnow)