import hashlib
import uuid
import logging

from sqlalchemy import Column, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from common.db import ModelBase

logger = logging.getLogger(__name__)



class User(ModelBase):
    __tablename__ = 'user'
    id = Column(String(256), primary_key=True)
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


class Session(ModelBase):
    __tablename__ = "session"
    id = Column(String(40),  primary_key=True)
    user_id = Column(String(255), ForeignKey('user.id'), nullable=False)
    user = relationship("User", backref="sessions")
    data = Column(Text(), nullable=False)
    expire = Column(DateTime())
