
from sqlalchemy import Column, Integer, String, Sequence
from common.db import ModelBase
from common.simplifier import SimpleObject


class Contact(ModelBase, SimpleObject):
    __tablename__ = 'contact'
    MODEL_NAME = 'contact'
    id = Column(Integer, Sequence('contact_id_seq'), primary_key=True)
    owner_id = Column(String(256), nullable=False)
    contact_id = Column(String(256))

    def as_simple_object(self):
        return {
            "$resource": self.MODEL_NAME,
            "$id": self.id,
            "owner_id": self.owner_id,
            "contact_id": self.contact_id
        }
