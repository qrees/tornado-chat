from uuid import uuid4
from wtforms import form
from wtforms import fields
from wtforms import validators

from account.models import User, Session
from common.business_logic import business_method, BusinessResponse
from common.db import get_session
from common.msg_handler import MsgHandler, BusinessMsgHandler


@business_method
def login(username, password):
    session = get_session()
    user = session.query(User).filter_by(name=username).first()
    if user is not None and user.check_password(password):
        _id = uuid4().get_hex()
        user_session = Session(id=_id, user=user, data="{}", expire=None)
        session.add(user_session)
        return BusinessResponse.response_ok({'sid': _id})
    else:
        return BusinessResponse.response_invalid_data({'message': 'invalid username or password'})


@business_method
def register(username, password):
    session = get_session()
    user = session.query(User).filter_by(name=username).first()
    if user is None:
        new_user = User(name=username)
        new_user.set_password(password)
        session.add(new_user)
        return BusinessResponse.response_ok({})
    else:
        return BusinessResponse.response_invalid_data({'message': 'User with this name already exists'})


class RegisterForm(form.Form):
    username = fields.TextField(u"Username",
        [validators.required(), validators.regexp('[-a-zA-Z0-9]+'), validators.length(max=50)])
    password = fields.PasswordField(u"Password", [validators.required()])


class LoginHandler(BusinessMsgHandler):
    route = "login"
    FORM_SEND = RegisterForm
    METHOD_SEND = login


class RegisterHandler(BusinessMsgHandler):
    route = "register"
    METHOD_SEND = register
    FORM_SEND = RegisterForm
