from common.simple import simple_rest_method_handler
from contacts.business_logic import ContactAddMethod, ContactsMethod


class ContactsComponent(object):

    def __init__(self, ctx):
        self._ctx = ctx
        self._app = ctx.get_app()
        """:type : common.application.Application"""

    def _as_component(self):
        self._app.msg_handler_registry.register(
            simple_rest_method_handler({
                'send': ContactAddMethod,
                'get': ContactsMethod
            }, 'resource.contact', self._app))

    def create(self):
        self._as_component()
        return self

    @property
    def name(self):
        return 'contacts'