from account.handlers import handlers
from account import models
from account.msg_handlers import RegisterHandler, LoginHandler, HandlerFactory


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

    def create(self):
        self._as_component()
        return self

    @property
    def name(self):
        return 'account'