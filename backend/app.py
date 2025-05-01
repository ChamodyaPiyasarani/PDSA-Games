import sys
from os.path import dirname, abspath
from flask import Flask, render_template, request, jsonify
from .extensions import db
import os
import json
from datetime import datetime
import random

# Add project root to Python path
project_root = dirname(dirname(abspath(__file__)))
sys.path.insert(0, project_root)

# Import models
from backend.models.tic_tac_toe import TicTacToeGame, TicTacToeMove
from backend.models.tsp import TSPGame, TSPAlgorithmTime
from backend.models.hanoi import HanoiGame, HanoiAlgorithmTime
from backend.models.queens import QueensGame, QueensAlgorithmTime
from backend.models.knights_tour import KnightsTourGame, KnightsAlgorithmTime

def create_app():
    app = Flask(__name__)
    
    # Use absolute path for database
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'game_suite.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    # Register routes
    register_routes(app)
    
    return app

def register_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/tic-tac-toe')
    def tic_tac_toe():
        return render_template('tic_tac_toe.html')
    
    @app.route('/traveling-salesman')
    def traveling_salesman():
        return render_template('tsp.html')
    
    @app.route('/tower-of-hanoi')
    def tower_of_hanoi():
        return render_template('hanoi.html')
    
    @app.route('/eight-queens')
    def eight_queens():
        return render_template('queens.html')
    
    @app.route('/knights-tour')
    def knights_tour():
        return render_template('knights_tour.html')
    
    @app.route('/hanoi')
    def hanoi():
        return render_template('hanoi.html')
    
    # ========== TIC-TAC-TOE API ==========

    @app.route('/api/tic-tac-toe/games', methods=['GET', 'POST'])
    def tic_tac_toe_games():
        if request.method == 'POST':
            data = request.get_json()
            new_game = TicTacToeGame(
                player_name=data['player_name'],
                result='in_progress'
            )
            db.session.add(new_game)
            db.session.commit()
            return jsonify({'game_id': new_game.id}), 201
        else:
            games = TicTacToeGame.query.order_by(TicTacToeGame.date.desc()).limit(10).all()
            return jsonify([{
                'id': game.id,
                'player_name': game.player_name,
                'result': game.result,
                'date': game.date
            } for game in games])

    @app.route('/api/tic-tac-toe/games/<int:game_id>', methods=['PATCH'])
    def update_tic_tac_toe_game(game_id):
        game = TicTacToeGame.query.get_or_404(game_id)
        data = request.get_json()
        game.result = data['result']
        db.session.commit()
        return jsonify({'message': 'Game updated'})

    @app.route('/api/tic-tac-toe/moves', methods=['POST'])
    def add_tic_tac_toe_move():
        data = request.get_json()
        new_move = TicTacToeMove(
            game_id=data['game_id'],
            algorithm_used=data['algorithm_used'],
            time_taken=data['time_taken'],
            move_details=data['move_details']
        )
        db.session.add(new_move)
        db.session.commit()
        return jsonify({'message': 'Move recorded'}), 201

    # ========== TSP API ==========
    @app.route('/api/tsp/games', methods=['GET', 'POST'])
    def tsp_games():
        if request.method == 'POST':
            data = request.get_json()
            new_game = TSPGame(
                player_name=data['player_name'],
                home_city=data['home_city'],
                selected_cities=data['selected_cities'],
                shortest_route='',
                distance=0
            )
            db.session.add(new_game)
            db.session.commit()
            return jsonify({'game_id': new_game.id}), 201
        else:
            games = TSPGame.query.order_by(TSPGame.date.desc()).limit(10).all()
            return jsonify([{
                'id': game.id,
                'player_name': game.player_name,
                'home_city': game.home_city,
                'selected_cities': game.selected_cities,
                'shortest_route': game.shortest_route,
                'distance': game.distance,
                'date': game.date
            } for game in games])

    @app.route('/api/tsp/games/<int:game_id>', methods=['PATCH'])
    def update_tsp_game(game_id):
        game = TSPGame.query.get_or_404(game_id)
        data = request.get_json()
        game.selected_cities = data['selected_cities']
        game.shortest_route = data['shortest_route']
        game.distance = data['distance']
        if 'player_distance' in data:
            game.player_distance = data['player_distance']
        db.session.commit()
        return jsonify({'message': 'Game updated'})

    @app.route('/api/tsp/algorithm-times', methods=['POST'])
    def add_tsp_algorithm_time():
        data = request.get_json()
        new_time = TSPAlgorithmTime(
            game_id=data['game_id'],
            algorithm_used=data['algorithm_used'],
            time_taken=data['time_taken']
        )
        db.session.add(new_time)
        db.session.commit()
        return jsonify({'message': 'Algorithm time recorded'}), 201

    # ========== HANOI API ==========
    @app.route('/api/hanoi/games', methods=['GET', 'POST'])
    def hanoi_games():
        if request.method == 'POST':
            data = request.get_json()
            new_game = HanoiGame(
                player_name=data['player_name'],
                disk_count=random.randint(5, 10),
                move_count=0,
                is_solved=0
            )
            db.session.add(new_game)
            db.session.commit()
            return jsonify({
                'game_id': new_game.id,
                'disk_count': new_game.disk_count
            }), 201
        else:
            games = HanoiGame.query.order_by(HanoiGame.created_at.desc()).limit(10).all()
            return jsonify([{
                'id': game.id,
                'player_name': game.player_name,
                'disk_count': game.disk_count,
                'move_count': game.move_count,
                'is_solved': game.is_solved,
                'created_at': game.created_at.isoformat()
            } for game in games])

    @app.route('/api/hanoi/games/<int:game_id>', methods=['PATCH'])
    def update_hanoi_game(game_id):
        game = HanoiGame.query.get_or_404(game_id)
        data = request.get_json()
        game.move_count = data['move_count']
        game.is_solved = data['is_solved']
        if 'move_sequence' in data:
            game.move_sequence = data['move_sequence']
        db.session.commit()
        return jsonify({'message': 'Game updated'})

    @app.route('/api/hanoi/algorithm-times', methods=['POST'])
    def add_hanoi_algorithm_time():
        data = request.get_json()
        new_time = HanoiAlgorithmTime(
            game_id=data['game_id'],
            algorithm_used=data['algorithm_used'],
            pegs_used=data['pegs_used'],
            time_taken=data['time_taken']
        )
        db.session.add(new_time)
        db.session.commit()
        return jsonify({'message': 'Algorithm time recorded'}), 201

    @app.route('/api/hanoi/save', methods=['POST'])
    def save_hanoi_game():
        data = request.get_json()
        
        game = HanoiGame(
            player_name=data['player_name'],
            disk_count=data['disk_count'],
            move_count=data['move_count'],
            move_sequence=str(data['move_sequence']),
            is_complete=data['is_complete'],
            timestamp=datetime.utcnow()
        )
        
        try:
            db.session.add(game)
            db.session.commit()
            return jsonify({'success': True})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)})

    @app.route('/api/hanoi/history')
    def get_hanoi_history():
        try:
            games = HanoiGame.query.order_by(HanoiGame.timestamp.desc()).limit(10).all()
            return jsonify([{
                'player_name': game.player_name,
                'disk_count': game.disk_count,
                'move_count': game.move_count,
                'timestamp': game.timestamp.isoformat()
            } for game in games])
        except Exception as e:
            return jsonify({'error': str(e)})

    # ========== QUEENS API ==========
    # ========== QUEENS API ==========
    @app.route('/api/queens/games', methods=['GET', 'POST'])
    def queens_games():
        if request.method == 'POST':
            data = request.get_json()
            new_game = QueensGame(
                player_name=data['player_name'],
                solution_found='',
                solution_number=0
            )
            db.session.add(new_game)
            db.session.commit()
            return jsonify({'game_id': new_game.id}), 201
        else:
            games = QueensGame.query.order_by(QueensGame.date.desc()).limit(10).all()
            return jsonify([{
                'id': game.id,
                'player_name': game.player_name,
                'solution_found': game.solution_found,
                'solution_number': game.solution_number,
                'date': game.date
            } for game in games])

    @app.route('/api/queens/solutions/sequential')
    def get_sequential_solutions():
        try:
            # Import from the correct path relative to app.py
            from backend.algorithms.queens.sequential import find_queens_solutions_sequential
            solutions = find_queens_solutions_sequential()
            return jsonify({
                'solutions': solutions,
                'count': len(solutions)
            })
        except Exception as e:
            app.logger.error(f"Error in sequential solutions: {str(e)}")
            return jsonify({
                'error': 'Failed to find solutions',
                'details': str(e)
            }), 500

    @app.route('/api/queens/solutions/threaded')
    def get_threaded_solutions():
        try:
            # Import from the correct path relative to app.py
            from backend.algorithms.queens.threaded import find_queens_solutions_threaded
            solutions = find_queens_solutions_threaded()
            return jsonify({
                'solutions': solutions,
                'count': len(solutions)
            })
        except Exception as e:
            app.logger.error(f"Error in threaded solutions: {str(e)}")
            return jsonify({
                'error': 'Failed to find solutions',
                'details': str(e)
            }), 500

    @app.route('/api/queens/solutions', methods=['POST'])
    def add_queens_solution():
        try:
            data = request.get_json()
            if not data or 'solution' not in data or 'game_id' not in data:
                return jsonify({'error': 'Invalid request data'}), 400
            
            # Convert solution to JSON string for storage
            solution_str = json.dumps(data['solution'])
            
            # Check if solution already exists
            existing_solution = QueensGame.query.filter_by(solution_found=solution_str).first()
            if existing_solution:
                return jsonify({
                    'message': 'Solution already exists',
                    'solution_number': existing_solution.solution_number
                }), 200
            
            # Get next solution number
            max_solution = QueensGame.query.order_by(QueensGame.solution_number.desc()).first()
            next_number = max_solution.solution_number + 1 if max_solution else 1
            
            # Update the game with the solution
            game = QueensGame.query.get(data['game_id'])
            if not game:
                return jsonify({'error': 'Game not found'}), 404
                
            game.solution_found = solution_str
            game.solution_number = next_number
            db.session.commit()
            
            return jsonify({
                'message': 'Solution saved',
                'solution_number': next_number
            }), 201
            
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error saving queens solution: {str(e)}")
            return jsonify({
                'error': 'Failed to save solution',
                'details': str(e)
            }), 500

    @app.route('/api/queens/algorithm-times', methods=['POST'])
    def add_queens_algorithm_time():
        try:
            data = request.get_json()
            required_fields = ['algorithm_type', 'solutions_found', 'time_taken']
            if not all(field in data for field in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
                
            new_time = QueensAlgorithmTime(
                game_id=data.get('game_id'),
                algorithm_type=data['algorithm_type'],
                solutions_found=data['solutions_found'],
                time_taken=data['time_taken']
            )
            db.session.add(new_time)
            db.session.commit()
            
            return jsonify({'message': 'Algorithm time recorded'}), 201
            
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error saving algorithm time: {str(e)}")
            return jsonify({
                'error': 'Failed to record algorithm time',
                'details': str(e)
            }), 500

    # ========== KNIGHT'S TOUR API ==========

    @app.route('/api/knights-tour/games', methods=['GET', 'POST'])
    def knights_tour_games():
        if request.method == 'POST':
            data = request.get_json()
            new_game = KnightsTourGame(
                player_name=data['player_name'],
                start_position='',
                move_sequence='[]',
                is_complete=False
            )
            db.session.add(new_game)
            db.session.commit()
            return jsonify({
                'game_id': new_game.id,
                'message': 'New game created'
            }), 201
        else:
            games = KnightsTourGame.query.order_by(KnightsTourGame.date.desc()).limit(10).all()
            return jsonify([{
                'id': game.id,
                'player_name': game.player_name,
                'start_position': game.start_position,
                'move_count': len(json.loads(game.move_sequence)) if game.move_sequence else 0,
                'is_complete': game.is_complete,
                'date': game.date.strftime('%Y-%m-%d %H:%M:%S')
            } for game in games])

    @app.route('/api/knights-tour/games/<int:game_id>', methods=['PATCH'])
    def update_knights_tour_game(game_id):
        game = KnightsTourGame.query.get_or_404(game_id)
        data = request.get_json()
        
        if 'start_position' in data:
            game.start_position = data['start_position']
        if 'move_sequence' in data:
            game.move_sequence = json.dumps(data['move_sequence'])
        if 'is_complete' in data:
            game.is_complete = data['is_complete']
        
        db.session.commit()
        return jsonify({
            'message': 'Game updated successfully',
            'game_id': game.id
        })

    @app.route('/api/knights-tour/algorithm-times', methods=['POST'])
    def add_knights_algorithm_time():
        data = request.get_json()
        if not data or 'game_id' not in data or 'algorithm_used' not in data or 'time_taken' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        new_time = KnightsAlgorithmTime(
            game_id=data['game_id'],
            algorithm_used=data['algorithm_used'],
            time_taken=data['time_taken']
        )
        db.session.add(new_time)
        db.session.commit()
        return jsonify({
            'message': 'Algorithm time recorded',
            'record_id': new_time.id
        }), 201

    @app.route('/api/knights-tour/solve/warnsdorff', methods=['POST'])
    def solve_warnsdorff():
        try:
            from backend.algorithms.knights_tour.Warnsdorff import solve
            data = request.get_json()
            solution = solve(data['start_row'], data['start_col'])
            return jsonify({
                'success': True,
                'solution': solution,
                'move_count': len(solution)
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route('/api/knights-tour/solve/backtracking', methods=['POST'])
    def solve_backtracking():
        try:
            from backend.algorithms.knights_tour.Backtracking import solve
            data = request.get_json()
            solution = solve(data['start_row'], data['start_col'])
            return jsonify({
                'success': True,
                'solution': solution,
                'move_count': len(solution)
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True)