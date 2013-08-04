from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

import settings

_db = None


class Database(object):

    def __init__(self):
        self.session_factory = sessionmaker()
        self.engine = create_engine(settings.DATABASE_URL)
        self.session_factory.configure(bind=self.engine)

    def session(self):
        return scoped_session(self.session_factory)

    def close_session(self):
        session = self.session()
        session.commit()
        session.remove()

    def rollback_session(self):
        session = self.session()
        session.rollback()
        session.remove()

    def syncdb(self, base):
        base.metadata.create_all(self.engine)


def get_db():
    global _db
    if _db is None:
        _db = Database()
    return _db


def get_session():
    return get_db().session()


class SessionScope(object):

    def __enter__(self):
        return get_session()

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            get_db().close_session()
        else:
            get_db().rollback_session()


Base = declarative_base()


class ModelBase(Base):
    __abstract__ = True

    def save(self):
        pass


def syncdb():
    get_db().syncdb(Base)
