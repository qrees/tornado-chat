from sqlalchemy.orm.exc import NoResultFound
from account.handlers import handlers
from account.business_logic import RegisterHandler, LoginHandler
from account.models import Session, User
from common.msg_handler import HandlerFactory


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

        self._app.msg_handler_registry.register(HandlerFactory(LoginHandler, self._app))
        self._app.msg_handler_registry.register(HandlerFactory(RegisterHandler, self._app))

    def user_from_sid(self, sid):
        session = self._app.db.session()
        session = session.query(Session).filter_by(sid=sid).first()
        return None if session is None else session.user

    def user_from_name(self, username):
        session = self._app.db.session()
        user = session.query(User).filter_by(username=username).one()
        return user

    def add_user(self, username):
        session = self._app.db.session()
        try:
            self.user_from_name(username)
        except NoResultFound:
            new_user = User(username=username)
            session.add(new_user)
            session.flush()
            return new_user
        else:
            raise UserAlreadyExists()

    def create(self):
        self._as_component()
        return self

    @property
    def name(self):
        return 'account'