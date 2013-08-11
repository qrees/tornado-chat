import functools
from uuid import uuid4

from account.models import User, Session
from common.db import get_session
from common.msg_handler import MsgHandler


def business_method(method):

    @functools.wraps(method)
    def wrapped(*args, **kwargs):
        return method(*args, **kwargs)
    return wrapped


@business_method
def login(username, password):
    session = get_session()
    user = session.query(User).filter_by(name=username).first()
    if user.check_password(password):
        id = uuid4()
        user_session = Session(id=id, user=user, data="{}", expire=None)
        session.add(user_session)



class LoginHandler(MsgHandler):
    route = "login"

    def __call__(self, message, **kwargs):
        print message.message
        message.message.get('username', '')
        message.message.get('password', '')

        message.respond()