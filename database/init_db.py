from backend.app import create_app, db
from backend.models.tic_tac_toe import TicTacToeGame, TicTacToeMove
from backend.models.tsp import TSPGame, TSPAlgorithmTime
from backend.models.hanoi import HanoiGame, HanoiAlgorithmTime
from backend.models.queens import QueensGame, QueensAlgorithmTime
from backend.models.knights_tour import KnightsTourGame, KnightsAlgorithmTime

def init_db():
    app = create_app()
    with app.app_context():
        # Create all database tables
        db.create_all()
        
        print("Database tables created successfully.")

if __name__ == '__main__':
    init_db()