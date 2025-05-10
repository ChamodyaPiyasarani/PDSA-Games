from ..extensions import db
from datetime import datetime

class TSPGame(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(100), nullable=False)
    home_city = db.Column(db.String(1), nullable=False)  # A-J
    selected_cities = db.Column(db.String(50), nullable=False)  # comma-separated list
    shortest_route = db.Column(db.String(100), nullable=False)
    distance = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    algorithm_times = db.relationship('TSPAlgorithmTime', backref='game', lazy=True)

    def __init__(self, player_name, home_city, selected_cities, shortest_route, distance, **kwargs):
        super().__init__(**kwargs)
        self.player_name = player_name
        self.home_city = home_city
        self.selected_cities = selected_cities
        self.shortest_route = shortest_route
        self.distance = distance
        self.date = datetime.utcnow()

    def to_dict(self):
        """Convert game state to dictionary."""
        return {
            'game_id': self.id,
            'player_name': self.player_name,
            'home_city': self.home_city,
            'selected_cities': self.selected_cities,
            'shortest_route': self.shortest_route,
            'distance': self.distance,
            'date': self.date.isoformat() if self.date else None
        }

class TSPAlgorithmTime(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('tsp_game.id'), nullable=False)
    algorithm_used = db.Column(db.String(50), nullable=False)  # bruteforce, dynamic, genetic
    time_taken = db.Column(db.Float, nullable=False)  # in seconds