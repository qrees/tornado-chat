from uuid import uuid4

from account.models import User, Session
from common.business_logic import business_method, BusinessResponse
from common.db import get_session
from common.msg_handler import MsgHandler



@business_method
def login(username, password):
    session = get_session()
    user = session.query(User).filter_by(name=username).first()
    if user is not None and user.check_password(password):
        _id = uuid4()
        user_session = Session(id=_id, user=user, data="{}", expire=None)
        session.add(user_session)
        return BusinessResponse.response_ok({'sid':_id})
    else:
        return BusinessResponse.response_invalid_data({'message': 'invalid username or password'})


class LoginHandler(MsgHandler):
    route = "login"

    def do_call(self, message):
        body = message.get_body()
        username = body.get('username', '')
        password = body.get('password', '')
        return login(username=username, password=password)
