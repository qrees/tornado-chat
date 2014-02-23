import abc
import logging
import six

import tornado.stack_context
from tornado import gen

from common.business_logic import BusinessResponse
from common.exceptions import HandlerNotFound
from common.hacks import MultiDict

logger = logging.getLogger(__name__)


class MsgHandlerRegistry(object):
    basic_routes = None
    routes = None

    def __init__(self, app):
        self.basic_routes = {}
        self.routes = []
        self._app = app

    def validate(self, cls):
        if isinstance(cls.route, abc.abstractproperty):
            raise Exception("%r has no 'route' attribute defined" % cls)

    def register(self, cls):
        route = cls.route
        logger.debug("Registering route '%s' with %r" % (route, cls))
        self.validate(cls)
        if isinstance(route, six.string_types):
            self.basic_routes[route] = cls
        elif six.callable(route):
            self.routes.append(cls)
        else:
            raise Exception("'route' attribute should be string or callable")

    def match(self, route):
        try:
            return [self.basic_routes[route]]
        except KeyError:
            raise HandlerNotFound()

        
class MsgHandler(object):
    __metaclass__ = abc.ABCMeta
    __abstract__ = True

    def __init__(self, app):
        self._app = app

    @abc.abstractproperty
    def route(self):
        pass

    @abc.abstractmethod
    def do_call(self, message):
        pass

    @gen.coroutine
    def call(self, message):
        try:
            def wrap(callback):
                try:
                    result = self.do_call(message=message)
                    callback(result)
                except Exception as e:
                    logger.exception("Exception when calling message handler in %r" % (self,))
                    raise
            logger.debug("Start task")
            response = yield gen.Task(tornado.stack_context.wrap(wrap),)
            logger.debug("end task")
            message.respond(response)
        except Exception, e:
            logger.exception("Failure in coroutine")

    def result(self, future):
        pass


class BusinessMsgHandler(MsgHandler):
    __abstract__ = True
    ALLOWED_ACTIONS = ('SEND', 'GET', 'DELETE')
    FORM_SEND = None
    METHOD_SEND = None
    FORM_GET = None
    METHOD_GET = None
    FORM_DELETE = None
    METHOD_DELETE = None

    def __init__(self, app):
        super(BusinessMsgHandler, self).__init__(app)
        if self.FORM_SEND:
            self._form_send = self.FORM_SEND(self._app)
        if self.FORM_GET:
            self._form_get = self.FORM_GET(self._app)
        if self.FORM_DELETE:
            self._form_delete = self.FORM_DELETE(self._app)

        if self.METHOD_SEND:
            self._method_send = self.METHOD_SEND(self._app)
        if self.METHOD_GET:
            self._method_get = self.METHOD_GET(self._app)
        if self.METHOD_DELETE:
            self._method_delete = self.METHOD_DELETE(self._app)

    def do_call(self, message):
        action = message.get_action().upper()

        if action not in self.ALLOWED_ACTIONS:
            return BusinessResponse.response_invalid_action(action)

        FORM = getattr(self, '_form_' + action.lower())
        METHOD = getattr(self, '_method_' + action.lower())

        assert FORM is not None
        assert METHOD is not None

        form = FORM(MultiDict(message.get_body()))
        if form.validate():
            data = form.data
            return METHOD(**data)
        else:
            return BusinessResponse.response_invalid_data(form.errors)
