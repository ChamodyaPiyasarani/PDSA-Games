import sys
from os.path import dirname, abspath
from flask import Flask, render_template, request, jsonify
from .extensions import db
import os
import json
from datetime import datetime
import random
from .utils.validators import GameValidator, ValidationError
import re
import uuid

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
    
    # Register error handlers
    register_error_handlers(app)
    
    return app

def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({
            'error': str(error),
            'status': 'error'
        }), 400

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({
            'error': 'Resource not found',
            'status': 'error'
        }), 404

    @app.errorhandler(500)
    def handle_server_error(error):
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

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
            try:
                data = request.get_json()
                if not data:
                    raise ValidationError("No data provided")
                
                # Validate player name
                GameValidator.validate_player_name(data.get('player_name'))
                
                new_game = TicTacToeGame(
                    player_name=data['player_name'],
                    result='in_progress'
                )
                db.session.add(new_game)
                db.session.commit()
                return jsonify({'game_id': new_game.id}), 201
            except ValidationError as e:
                return jsonify({'error': str(e)}), 400
            except Exception as e:
                return jsonify({'error': 'Internal server error'}), 500
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
        try:
            game = TicTacToeGame.query.get_or_404(game_id)
            data = request.get_json()
            if not data:
                raise ValidationError("No data provided")
            
            if 'result' not in data:
                raise ValidationError("Result is required")
            
            valid_results = ['in_progress', 'win', 'lose', 'draw']
            if data['result'] not in valid_results:
                raise ValidationError(f"Result must be one of: {', '.join(valid_results)}")
            
            game.result = data['result']
            db.session.commit()
            return jsonify({'message': 'Game updated'})
        except ValidationError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/tic-tac-toe/moves', methods=['POST'])
    def add_tic_tac_toe_move():
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("No data provided")
            
            # Validate game ID
            GameValidator.validate_game_id(data.get('game_id'))
            
            # Validate move details
            if 'move_details' not in data:
                raise ValidationError("Move details are required")
            
            move_details = data['move_details']
            if not isinstance(move_details, dict):
                raise ValidationError("Move details must be an object")
            
            if 'position' not in move_details or 'board_state' not in move_details:
                raise ValidationError("Move details must include position and board_state")
            
            GameValidator.validate_move(move_details['position'], move_details['board_state'])
            
            new_move = TicTacToeMove(
                game_id=data['game_id'],
                algorithm_used=data.get('algorithm_used', 'manual'),
                time_taken=data.get('time_taken', 0),
                move_details=move_details
            )
            db.session.add(new_move)
            db.session.commit()
            return jsonify({'message': 'Move recorded'}), 201
        except ValidationError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': 'Internal server error'}), 500

    # ========== TSP API ==========
    @app.route('/api/tsp/games', methods=['GET', 'POST'])
    def create_tsp_game():
        if request.method == 'GET':
            try:
                games = TSPGame.query.order_by(TSPGame.date.desc()).all()
                return jsonify([game.to_dict() for game in games]), 200
            except Exception as e:
                return jsonify({'error': str(e)}), 500
            
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['player_name', 'home_city', 'selected_cities', 'shortest_route', 'distance']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        try:
            # Create new game
            game = TSPGame(
                player_name=data['player_name'],
                home_city=data['home_city'],
                selected_cities=data['selected_cities'],
                shortest_route=data['shortest_route'],
                distance=float(data['distance'])
            )
            
            db.session.add(game)
            db.session.commit()
            
            return jsonify(game.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

    @app.route('/api/tsp/games/<int:game_id>', methods=['PATCH'])
    def update_tsp_game(game_id):
        game = TSPGame.query.get_or_404(game_id)
        data = request.get_json()
        
        try:
            if 'selected_cities' in data:
                game.selected_cities = data['selected_cities']
            if 'shortest_route' in data:
                game.shortest_route = data['shortest_route']
            if 'distance' in data:
                game.distance = float(data['distance'])
            
            db.session.commit()
            return jsonify(game.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

    @app.route('/api/tsp/games/<int:game_id>', methods=['GET'])
    def get_tsp_game(game_id):
        game = TSPGame.query.get_or_404(game_id)
        return jsonify(game.to_dict()), 200

    @app.route('/api/tsp/algorithm-times', methods=['POST'])
    def save_tsp_algorithm_time():
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['game_id', 'algorithm_used', 'time_taken']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        try:
            # Create new algorithm time record
            algorithm_time = TSPAlgorithmTime(
                game_id=data['game_id'],
                algorithm_used=data['algorithm_used'],
                time_taken=float(data['time_taken'])
            )
            
            db.session.add(algorithm_time)
            db.session.commit()
            
            return jsonify({
                'id': algorithm_time.id,
                'game_id': algorithm_time.game_id,
                'algorithm_used': algorithm_time.algorithm_used,
                'time_taken': algorithm_time.time_taken
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

    # ========== HANOI API ==========
    @app.route('/api/hanoi/games', methods=['GET', 'POST'])
    def hanoi_games():
        if request.method == 'POST':
            try:
                data = request.get_json()
                if not data:
                    raise ValidationError("No data provided")
                
                if 'player_name' not in data:
                    raise ValidationError("Player name is required")
                
                player_name = data['player_name']
                if not player_name or not isinstance(player_name, str):
                    raise ValidationError("Player name must be a non-empty string")
                
                if len(player_name) < 2:
                    raise ValidationError("Player name must be at least 2 characters")
                
                if len(player_name) > 50:
                    raise ValidationError("Player name must be at most 50 characters")
                
                if not re.match(r'^[a-zA-Z0-9\s\-_]+$', player_name):
                    raise ValidationError("Player name can only contain letters, numbers, spaces, hyphens, and underscores")
                
                new_game = HanoiGame(
                    player_name=player_name,
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
            except ValidationError as e:
                return jsonify({'error': str(e)}), 400
            except Exception as e:
                return jsonify({'error': 'Internal server error'}), 500
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
        try:
            game = HanoiGame.query.get_or_404(game_id)
            data = request.get_json()
            if not data:
                raise ValidationError("No data provided")
            
            required_fields = ['move_count', 'is_solved']
            for field in required_fields:
                if field not in data:
                    raise ValidationError(f"{field} is required")
            
            if not isinstance(data['move_count'], int) or data['move_count'] < 0:
                raise ValidationError("move_count must be a non-negative integer")
            
            if not isinstance(data['is_solved'], (int, bool)):
                raise ValidationError("is_solved must be a boolean or integer")
            
            game.move_count = data['move_count']
            game.is_solved = int(data['is_solved'])
            
            if 'move_sequence' in data:
                if not isinstance(data['move_sequence'], list):
                    raise ValidationError("move_sequence must be a list")
                game.move_sequence = data['move_sequence']
            
            db.session.commit()
            return jsonify({'message': 'Game updated'})
        except ValidationError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/hanoi/algorithm-times', methods=['POST'])
    def add_hanoi_algorithm_time():
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("No data provided")
            
            required_fields = ['game_id', 'algorithm_used', 'time_taken']
            for field in required_fields:
                if field not in data:
                    raise ValidationError(f"{field} is required")
            
            GameValidator.validate_game_id(data['game_id'])
            
            if not isinstance(data['time_taken'], (int, float)) or data['time_taken'] < 0:
                raise ValidationError("time_taken must be a non-negative number")
            
            new_time = HanoiAlgorithmTime(
                game_id=data['game_id'],
                algorithm_used=data['algorithm_used'],
                time_taken=data['time_taken']
            )
            db.session.add(new_time)
            db.session.commit()
            return jsonify({'message': 'Algorithm time recorded'}), 201
        except ValidationError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/hanoi/save', methods=['POST'])
    def save_hanoi_game():
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("No data provided")
            
            # Validate player name
            GameValidator.validate_player_name(data.get('player_name'))
            
            game = HanoiGame(
                player_name=data['player_name'],
                disk_count=data['disk_count'],
                move_count=data['move_count'],
                move_sequence=str(data['move_sequence']),
                is_complete=data['is_complete'],
                timestamp=datetime.utcnow()
            )
            
            db.session.add(game)
            db.session.commit()
            return jsonify({'success': True})
        except ValidationError as e:
            return jsonify({'error': str(e)}), 400
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
    @app.route('/api/queens/games', methods=['GET', 'POST'])
    def queens_games():
        if request.method == 'POST':
            try:
                data = request.get_json()
                if not data:
                    raise ValidationError("No data provided")
                
                if 'player_name' not in data:
                    raise ValidationError("Player name is required")
                
                player_name = data['player_name']
                if not player_name or not isinstance(player_name, str):
                    raise ValidationError("Player name must be a non-empty string")
                
                if len(player_name) < 2:
                    raise ValidationError("Player name must be at least 2 characters")
                
                if len(player_name) > 50:
                    raise ValidationError("Player name must be at most 50 characters")
                
                if not re.match(r'^[a-zA-Z0-9\s\-_]+$', player_name):
                    raise ValidationError("Player name can only contain letters, numbers, spaces, hyphens, and underscores")
                
                new_game = QueensGame(
                    player_name=player_name,
                    solution_found='',
                    solution_number=0
                )
                db.session.add(new_game)
                db.session.commit()
                return jsonify({'game_id': new_game.id}), 201
            except ValidationError as e:
                return jsonify({'error': str(e)}), 400
            except Exception as e:
                return jsonify({'error': 'Internal server error'}), 500
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
            try:
                data = request.get_json()
                if not data:
                    raise ValidationError("No data provided")
                
                if 'player_name' not in data:
                    raise ValidationError("Player name is required")
                
                player_name = data['player_name']
                if not player_name or not isinstance(player_name, str):
                    raise ValidationError("Player name must be a non-empty string")
                
                if len(player_name) < 2:
                    raise ValidationError("Player name must be at least 2 characters")
                
                if len(player_name) > 50:
                    raise ValidationError("Player name must be at most 50 characters")
                
                if not re.match(r'^[a-zA-Z0-9\s\-_]+$', player_name):
                    raise ValidationError("Player name can only contain letters, numbers, spaces, hyphens, and underscores")
                
                new_game = KnightsTourGame(
                    player_name=player_name,
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
            except ValidationError as e:
                return jsonify({'error': str(e)}), 400
            except Exception as e:
                return jsonify({'error': 'Internal server error'}), 500
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