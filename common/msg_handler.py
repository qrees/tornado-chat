import abc
import six
from common.exceptions import HandlerNotFound


class MsgHandlerRegistry(object):
    basic_routes = None
    routes = None

    def __init__(self):
        self.basic_routes = {}
        self.routes = []

    def validate(self, cls):
        if isinstance(cls.route, abc.abstractproperty):
            raise Exception("%r has no 'route' attribute defined")

    def register(self, cls):
        route = cls.route
        print "Registering route '%s' with %r" % (route, cls)
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

    def __call__(self, *args, **kwargs):
        pass
