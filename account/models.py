import hashlib
import uuid
import logging

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
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
        salt = uuid.uuid4().hex
        hashed_password = hashlib.sha512(password + salt).hexdigest()
        db_password = "sha512$%s$%s" % (salt, hashed_password)
        self.password = db_password

    def check_password(self, password):
        alg, salt, hash = self.password.split("$")
        hashed_password = hashlib.sha512(password + salt).hexdigest()
        logger.info("Comparing %s with %s" % (hash, hashed_password))
        return hash == hashed_password

    def as_simple_object(self):
        return {
            '$model': self.MODEL_NAME,
            'id': self.id,
            'username': self.username.encode('utf-8')
        }


class Session(ModelBase):
    __tablename__ = "session"
    id = primaryKey()
    user_id = foreignKey('user.id', nullable=False)
    sid = Column(String(40), unique=True)
    user = relationship("User", backref="sessions")
    data = Column(Text(), nullable=False)
    expire = Column(DateTime())
