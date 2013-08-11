import hashlib
import uuid

from sqlalchemy import Column, Integer, String, Sequence, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from common.db import ModelBase


class User(ModelBase):
    __tablename__ = 'user'
    id = Column(Integer, Sequence('user_id_seq'), primary_key=True)
    name = Column(String(50), nullable=False)
    password = Column(String(255))

    def set_password(self, password):
        salt = uuid.uuid4().hex
        hashed_password = hashlib.sha512(password + salt).hexdigest()
        db_password = "sha512$%s$%s" % (salt, hashed_password)
        self.password = db_password

    def check_password(self, password):
        alg, salt, hash = self.password.split("$")
        hashed_password = hashlib.sha512(password + salt).hexdigest()
        return hash == hashed_password


class Session(ModelBase):
    __tablename__ = "session"
    id = Column(String(40),  primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    user = relationship("User", backref="sessions")
    data = Column(Text(), nullable=False)
    expire = Column(DateTime())
