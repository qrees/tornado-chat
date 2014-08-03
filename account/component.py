from account.handlers import handlers
from account.business_logic import LoginMethod, RegisterMethod
from account.models import Session, User
from common.simple import simple_rest_method_handler, simple_business_method


class UserAlreadyExists(BaseException):
    pass


class AccountComponent(object):

    def __init__(self, ctx):
        self._ctx = ctx
        self._app = ctx.get_app()
        """:type : common.application.Application"""

    def _as_component(self):
        for path, handler in handlers:
            self._app.app_handlers.add_handler((path, handler(self._app)))

        self.login = simple_business_method(LoginMethod, self._app)
        self.register = simple_business_method(RegisterMethod, self._app)

        self._app.msg_handler_registry.register(
            simple_rest_method_handler({'send': LoginMethod}, 'login', self._app))
        self._app.msg_handler_registry.register(
            simple_rest_method_handler({'send': RegisterMethod}, 'register', self._app))

    def user_from_sid(self, sid):
        session = self._app.db.session()
        session = session.query(Session).filter_by(sid=sid).first()
        return None if session is None else session.user

    def user_from_name(self, username):
        session = self._app.db.session()
        user = session.query(User).filter_by(username=username).one()
        return user

    def create(self):
        self._as_component()
        return self

    @property
    def name(self):
        return 'account'