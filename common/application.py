from copy import deepcopy
import logging
import re
import jinja2
import jinja2.ext
import jinja2.nodes
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
        logger.info("Loading component %s" % (path,))
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

    def __init__(self, default=None):
        if default is None:
            self._config = {}
        else:
            self._config = deepcopy(default)

    def load(self):
        settings = importlib.import_module('settings')
        self._config.update(settings.__dict__)

    def __getitem__(self, item):
        return self._config[item]

    def get(self, item, default=None):
        return self._config.get(item, default)

    def set(self, item, value):
        self._config[item] = value


class ComponentRegistry(object):

    def __init__(self, app):
        self._app = app
        self._factories = set()
        self._components = {}

    def __getitem__(self, item):
        return self._components[item]

    def add_factory(self, factory):
        self._factories.add(factory)

    def get_component(self, name):
        return self._components[name]

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


REFERENCE = r'^///\s*<reference\s*path="(.*)"/>\s*$'
REFERENCE_COMP = re.compile(REFERENCE)


def parse(path):
    with open(path, 'r') as plik:
        for line in plik:
            matched = REFERENCE_COMP.match(line)
            if matched:
                print matched.groups()
            else:
                print line


def TypeScriptExtensionFactory(app):

    class TypeScriptExtension(jinja2.ext.Extension):
        tags = {'asset'}

        def __init__(self, environment):
            super(TypeScriptExtension, self).__init__(environment)
            self._app = app

        def parse_attrs(self, parser, add_id=True, with_context=False):
            attrs = {}
            while parser.stream.current.type != 'block_end':
                node = parser.parse_assign_target(with_tuple=False)

                if parser.stream.skip_if('assign'):
                    attrs[node.name] = parser.parse_expression()
                else:
                    attrs[node.name] = jinja2.nodes.Const(node.name)
            if with_context:
                attrs['ctx'] = jinja2.nodes.ContextReference()
            return jinja2.nodes.Dict([jinja2.nodes.Pair(jinja2.nodes.Const(k), v) for k,v in attrs.items()])

        def parse(self, parser):
            tag = parser.stream.next()

            attrs = self.parse_attrs(parser)
            return jinja2.nodes.Output([self.call_method('_assets', args=[attrs])]).set_lineno(10)

        def _assets(self, args):
            assert 'path' in args
            path = args['path']
            path = os.path.join(self._app.config['STATICS_PATH'], path)
            parse(path)
            return str(args)
    return TypeScriptExtension


class Application(object):

    def __init__(self, config):
        self._tornado = None
        self.component_registry = ComponentRegistry(self)
        self.app_handlers = AppHandlers(self)
        self.config = config
        self.msg_handler_registry = MsgHandlerRegistry(self)
        self.db = Database(self)
        self.loader = jinja2.FileSystemLoader(config['TEMPLATES_DIRECTORY'])
        self.template_environment = jinja2.Environment(
            loader=self.loader,
            extensions=[TypeScriptExtensionFactory(self)])

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
