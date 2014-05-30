from uuid import uuid4
from account.forms import RegisterForm

from account.models import User, Session
from common.business_logic import BusinessResponse, BusinessMethod, simple_business_method_factory
from common.msg_handler import BusinessMsgHandler


class LoginMethod(BusinessMethod):
    FORM = RegisterForm

    def _perform(self, username, password):
        session = self._app.db.session()
        user = session.query(User).filter_by(username=username).first()
        if user is not None and user.check_password(password):
            _id = uuid4().get_hex()
            user_session = Session(sid=_id, user=user, data="{}", expire=None)
            session.add(user_session)
            return BusinessResponse.response_ok({'sid': _id})
        else:
            return BusinessResponse.response_invalid_data({'message': 'invalid username or password'})


class RegisterMethod(BusinessMethod):
    FORM = RegisterForm

    def _perform(self, username, password):
        session = self._app.db.session()
        user = session.query(User).filter_by(username=username).first()
        if user is None:
            new_user = User(username=username)
            new_user.set_password(password)
            session.add(new_user)
            return BusinessResponse.response_ok({})
        else:
            return BusinessResponse.response_invalid_data({'message': 'User with this name already exists'})


class LoginHandler(BusinessMsgHandler):
    route = "login"
    ACTIONS = {'send': simple_business_method_factory(LoginMethod)}


class RegisterHandler(BusinessMsgHandler):
    route = "register"
    ACTIONS = {'send': simple_business_method_factory(RegisterMethod)}
