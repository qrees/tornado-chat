from common.msg_handler import HandlerFactory
from contacts.business_logic import ContactsHandler


class ContactsComponent(object):

    def __init__(self, ctx):
        self._ctx = ctx
        self._app = ctx.get_app()
        """:type : common.application.Application"""

    def _as_component(self):
        self._app.msg_handler_registry.register(HandlerFactory(ContactsHandler, self._app))

    def create(self):
        self._as_component()
        return self

    @property
    def name(self):
        return 'contacts'