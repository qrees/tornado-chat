from sqlalchemy import create_engine, Column, Integer, ForeignKey
from sqlalchemy.orm import scoped_session
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

_db = None


class Database(object):

    def __init__(self, app):
        self.session_factory = sessionmaker()
        self.engine = create_engine(app.config['DATABASE_URL'])
        self.session_factory.configure(bind=self.engine)
        self.scoped_session = scoped_session(self.session_factory)

    def session(self):
        return self.scoped_session()

    def commit_session(self):
        self.session().commit()
        self.scoped_session.remove()

    def rollback_session(self):
        self.session().rollback()
        self.scoped_session.remove()

    def syncdb(self, base):
        base.metadata.create_all(self.engine)

    def drop_all(self, base):
        base.metadata.drop_all(self.engine)

Base = declarative_base()


def primaryKey():
    return Column(Integer,  primary_key=True)


def foreignKey(rel, **kwargs):
    return Column(Integer, ForeignKey(rel), **kwargs)


class ModelBase(Base):
    __abstract__ = True

    def save(self):
        pass

