from flask import Blueprint, render_template, request, jsonify, session
from ..models.hanoi import HanoiGame, HanoiAlgorithmTime
from ..extensions import db
import time

hanoi_bp = Blueprint('hanoi', __name__)

@hanoi_bp.route('/hanoi')
def hanoi():
    return render_template('hanoi.html')

@hanoi_bp.route('/api/hanoi/games', methods=['GET'])
def get_games():
    games = HanoiGame.query.order_by(HanoiGame.created_at.desc()).limit(10).all()
    return jsonify([{
        'id': game.id,
        'player_name': game.player_name,
        'disk_count': game.disk_count,
        'move_count': game.move_count,
        'is_solved': game.is_solved,
        'created_at': game.created_at.isoformat()
    } for game in games])

@hanoi_bp.route('/api/hanoi/games', methods=['POST'])
def create_game():
    data = request.get_json()
    player_name = data.get('player_name')
    disk_count = int(data.get('disk_count', 3))
    
    if not player_name or disk_count < 3 or disk_count > 8:
        return jsonify({'error': 'Invalid input'}), 400
    
    game = HanoiGame(
        player_name=player_name,
        disk_count=disk_count,
        move_count=0,
        is_solved=0
    )
    
    db.session.add(game)
    db.session.commit()
    
    return jsonify({
        'game_id': game.id,
        'disk_count': game.disk_count
    })

@hanoi_bp.route('/api/hanoi/games/<int:game_id>', methods=['PATCH'])
def update_game(game_id):
    game = HanoiGame.query.get_or_404(game_id)
    data = request.get_json()
    
    if 'move_count' in data:
        game.move_count = data['move_count']
    if 'is_solved' in data:
        game.is_solved = data['is_solved']
    
    db.session.commit()
    return jsonify({'message': 'Game updated successfully'})

@hanoi_bp.route('/api/hanoi/algorithm-times', methods=['POST'])
def save_algorithm_time():
    data = request.get_json()
    game_id = data.get('game_id')
    algorithm_used = data.get('algorithm_used')
    pegs_used = data.get('pegs_used')
    time_taken = data.get('time_taken')
    
    if not all([game_id, algorithm_used, pegs_used, time_taken]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    time_record = HanoiAlgorithmTime(
        game_id=game_id,
        algorithm_used=algorithm_used,
        pegs_used=pegs_used,
        time_taken=time_taken
    )
    
    db.session.add(time_record)
    db.session.commit()
    
    return jsonify({'message': 'Algorithm time saved successfully'}) 