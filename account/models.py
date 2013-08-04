import hashlib
import uuid

from sqlalchemy import Column, Integer, String, Sequence
from common.db import ModelBase


class User(ModelBase):
    __tablename__ = 'user'
    id = Column(Integer, Sequence('user_id_seq'), primary_key=True)
    name = Column(String(50))
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
