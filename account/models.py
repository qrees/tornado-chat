import logging

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from account.password import hash_password, check_password
from common.db import ModelBase, primaryKey, foreignKey
from common.simplifier import SimpleObject

logger = logging.getLogger(__name__)


class User(ModelBase, SimpleObject):
    __tablename__ = 'user'
    MODEL_NAME = 'user'
    id = primaryKey()
    username = Column(String(256), unique=True)
    password = Column(String(255))

    def set_password(self, password):
        self.password = hash_password(password)

    def check_password(self, password):
        ret = check_password(password, self.password)
        return ret

    def as_simple_object(self):
        return {
            '$model': self.MODEL_NAME,
            'id': self.id,
            'username': self.username.encode('utf-8')
        }


class Session(ModelBase, SimpleObject):
    __tablename__ = "session"
    MODEL_NAME = 'session'
    id = primaryKey()
    user_id = foreignKey('user.id', nullable=False)
    sid = Column(String(40), unique=True)
    user = relationship("User", backref="sessions")
    data = Column(Text(), nullable=False)
    expire = Column(DateTime())

    def as_simple_object(self):
        return {
            '$model': self.MODEL_NAME,
            'sid': self.sid,
            'user_id': self.user_id
        }
