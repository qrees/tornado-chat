from account.handlers import handlers
from account.business_logic import RegisterHandler, LoginHandler
from account.models import Session
from common.msg_handler import HandlerFactory


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

    def user_from_name(self, name):
        raise NotImplemented("")

    def create(self):
        self._as_component()
        return self

    @property
    def name(self):
        return 'account'