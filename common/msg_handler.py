import abc
import logging
import six

import tornado.stack_context
from tornado import gen

from common.business_logic import BusinessResponse
from common.exceptions import HandlerNotFound
from common.hacks import MultiDict


class MsgHandlerRegistry(object):
    basic_routes = None
    routes = None

    def __init__(self):
        self.basic_routes = {}
        self.routes = []

    def validate(self, cls):
        if isinstance(cls.route, abc.abstractproperty):
            raise Exception("%r has no 'route' attribute defined" % cls)

    def register(self, cls):
        route = cls.route
        logging.debug("Registering route '%s' with %r" % (route, cls))
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

_registry = None


def get_registry():
    global _registry
    if _registry is None:
        _registry = MsgHandlerRegistry()
    return _registry


class MetaMsgHandler(abc.ABCMeta):

    def __new__(mcs, name, bases, attributes):
        if attributes.get('__abstract__', False):
            is_abstract = True
            del attributes['__abstract__']
        else:
            is_abstract = False

        cls = super(MetaMsgHandler, mcs).__new__(mcs, name, bases, attributes)

        if not is_abstract:
            get_registry().register(cls)

        return cls


class MsgHandler(object):
    __metaclass__ = MetaMsgHandler
    __abstract__ = True

    @abc.abstractproperty
    def route(self):
        pass

    def do_call(self, message):
        return None

    @gen.coroutine
    def call(self, message):
        try:
            def wrap(callback):
                try:
                    result = self.do_call(message=message)
                    callback(result)
                except Exception, e:
                    logging.exception("Exception when calling message handler in %r" % (self,))
                    raise
            logging.debug("Start task")
            response = yield gen.Task(tornado.stack_context.wrap(wrap),)
            logging.debug("end task")
            message.respond(response)
        except Exception, e:
            logging.exception("Failure in coroutine")

    def result(self, future):
        pass


class BusinessMsgHandler(MsgHandler):
    __abstract__ = True
    FORM = None
    METHOD = None

    def do_call(self, message):
        form = self.FORM(MultiDict(message.get_body()))
        if form.validate():
            data = form.data
            return self.METHOD(**data)
        else:
            return BusinessResponse.response_invalid_data(form.errors)
