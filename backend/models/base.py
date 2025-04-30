from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..extensions import db

Base = declarative_base()

def init_db(app):
    Base.metadata.create_all(bind=db.engine)
    Session = sessionmaker(bind=db.engine)
    return Session() 