import sys
from os.path import dirname, abspath

# Add project root to Python path
project_root = dirname(dirname(abspath(__file__)))
sys.path.insert(0, project_root)

from backend.app import create_app
from backend.extensions import db
import os

def init_db():
    app = create_app()
    with app.app_context():
        # Drop all tables
        db.drop_all()
        # Create all tables
        db.create_all()
        print("Database initialized successfully!")

if __name__ == '__main__':
    init_db() 