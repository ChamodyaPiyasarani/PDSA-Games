from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..extensions import db

class HanoiGame(db.Model):
    __tablename__ = 'hanoi_games'

    id = Column(Integer, primary_key=True)
    player_name = Column(String(100), nullable=False)
    disk_count = Column(Integer, nullable=False)
    move_count = Column(Integer, nullable=False)
    is_solved = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f'<HanoiGame {self.id}: {self.player_name} - {self.disk_count} disks>'

class HanoiAlgorithmTime(db.Model):
    __tablename__ = 'hanoi_algorithm_times'

    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey('hanoi_games.id'), nullable=False)
    algorithm_used = Column(String(50), nullable=False)  # recursive, iterative
    pegs_used = Column(Integer, nullable=False)  # 3 or 4
    time_taken = Column(Float, nullable=False)  # in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f'<HanoiAlgorithmTime {self.id}: {self.algorithm_used} - {self.time_taken}s>'