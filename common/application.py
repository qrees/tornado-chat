import logging
import os
import importlib

import tornado.ioloop
import tornado.web
import tornado.autoreload
from common.db import Database
from common.msg_handler import MsgHandlerRegistry


logger = logging.getLogger(__name__)


def load_components(components, context_maker):
    factories = []
    for path in components:
        try:
            module, class_ = path.rsplit('.', 1)
        except ValueError:
            logger.error("Failed to load %s" % (path,))
            raise
        try:
            app_auto = importlib.import_module(module)
        except ImportError:
            logger.error("Failed to import %s" % (path,))
            raise
        factory = getattr(app_auto, class_)
        factory_instnace = factory(context_maker())
        factories.append(factory_instnace)
    return factories

current = os.path.abspath(__file__)
base = os.path.dirname(os.path.dirname(current))
static_path = os.path.join(base, 'static')


class Config(object):

    def __init__(self):
        self._config = {}

    def load(self):
        settings = importlib.import_module('settings')
        self._config.update(settings.__dict__)

    def __getitem__(self, item):
        return self._config[item]

    def get(self, item, default=None):
        return self._config.get(item, default)


class ComponentRegistry(object):

    def __init__(self, app):
        self._app = app
        self._factories = set()
        self._components = {}

    def add_factory(self, factory):
        self._factories.add(factory)

    def bootstrap(self):
        for factory in self._factories:
            component = factory.create()
            self._components[factory.name] = component


class AppHandlers(object):

    def __init__(self, app):
        self._app = app
        self._handlers = []

    def add_handler(self, handler):
        # route, handler_factory = handler
        # handler_instance = handler_factory(self._app)
        self._handlers.append(handler)

    def __iter__(self):
        for x in self._handlers:
            yield x


class Context(object):

    def __init__(self, app):
        self._app = app

    def get_app(self):
        return self._app


class Application(object):

    def __init__(self, config):
        self.component_registry = ComponentRegistry(self)
        self.app_handlers = AppHandlers(self)
        self.config = config
        self.msg_handler_registry = MsgHandlerRegistry(self)
        self.db = Database(self)

    def _load_settings(self):
        pass

    def _component_context(self):
        return Context(self)

    def _load_components(self):
        factories = load_components(self.config['COMPONENTS'], self._component_context)
        for factory in factories:
            self.component_registry.add_factory(factory)
        self.component_registry.bootstrap()

    def _create_application(self):
        self._tornado = tornado.web.Application(
            self.app_handlers,
            # debug=bool(args.debug),
            static_path=self.config.get('STATIC_PATH', static_path)
        )

    def bootstrap(self):
        self._load_settings()
        self._load_components()
        self._create_application()

    def get_listener(self):
        return self._tornado


def make_app():
    config = Config()
    config.load()
    app = Application(config)
    app.bootstrap()
    return app
