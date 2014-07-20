
from sqlalchemy import Column, Integer, String, Sequence
from common.db import ModelBase


class Contact(ModelBase):
    __tablename__ = 'contact'
    id = Column(Integer, Sequence('contact_id_seq'), primary_key=True)
    owner_id = Column(String(256), nullable=False)
    contact_id = Column(String(256))


