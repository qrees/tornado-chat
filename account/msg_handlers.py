from uuid import uuid4
from common import form
from wtforms import fields
from wtforms import validators

from account.models import User, Session
from common.business_logic import BusinessResponse, BusinessMethod
from common.msg_handler import BusinessMsgHandler


class LoginMethod(BusinessMethod):
    def _perform(self, username, password):
        session = self._app.db.session()
        user = session.query(User).filter_by(name=username).first()
        if user is not None and user.check_password(password):
            _id = uuid4().get_hex()
            user_session = Session(id=_id, user=user, data="{}", expire=None)
            session.add(user_session)
            return BusinessResponse.response_ok({'sid': _id})
        else:
            return BusinessResponse.response_invalid_data({'message': 'invalid username or password'})


class RegisterMethod(BusinessMethod):
    def _perform(self, username, password):
        session = self._app.db.session()
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


class HandlerFactory(object):

    def __init__(self, class_, app):
        self._app = app
        self._class = class_

    def __call__(self, *args, **kwargs):
        return self._class(self._app, *args, **kwargs)

    @property
    def route(self):
        return self._class.route


class LoginHandler(BusinessMsgHandler):
    route = "login"
    FORM_SEND = lambda self, app: lambda data: RegisterForm(app, data)
    METHOD_SEND = lambda self, app: LoginMethod(app)


class RegisterHandler(BusinessMsgHandler):
    route = "register"
    METHOD_SEND = lambda self, app: RegisterMethod(app)
    FORM_SEND = lambda self, app: lambda data: RegisterForm(app, data)
