import abc
import logging
import six

import tornado.stack_context
from tornado import gen

from common.business_logic import BusinessResponse
from common.exceptions import HandlerNotFound

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
        self.validate(cls)
        route = cls.route
        logger.debug("Registering route '%s' with %r" % (route, cls))
        if isinstance(route, six.string_types):
            self.basic_routes[route] = cls
        elif six.callable(route):
            self.routes.append(cls)
        else:
            raise Exception("'route' attribute should be string or callable")

    def match(self, route):
        try:
            return [self.basic_routes[route]]
        except KeyError as e:
            raise HandlerNotFound("Could not find handler for route %r" % (route,))


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


class HandlerFactory(object):

    def __init__(self, class_, app):
        self._app = app
        self._class = class_

    def __call__(self, *args, **kwargs):
        return self._class(self._app, *args, **kwargs)

    @property
    def route(self):
        return self._class.route


class BusinessMsgHandler(MsgHandler):
    __abstract__ = True
    ACTIONS = {}
    ALLOWED_ACTIONS = ('SEND', 'GET', 'DELETE')

    def __init__(self, app):
        super(BusinessMsgHandler, self).__init__(app)
        self._actions = {}

        # actions are BusnessMethodFactory from common.business_logic
        for action, handler in self.ACTIONS.items():
            self._actions[action] = handler(self._app)

    def do_call(self, message):
        action = message.get_action().lower()

        if action not in self.ACTIONS:
            return BusinessResponse.response_invalid_action(action)

        method_factory = self._actions[action]
        return method_factory(message)
