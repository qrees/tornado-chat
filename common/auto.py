import os
import importlib
import sys
import tornado.ioloop
import tornado.web
import tornado.autoreload

import common.db
from common.argument_parser import get_parser
import settings

app_handlers = []
for app in settings.INSTALLED_APPS:
    app_handler_path = app + "." + "handlers"
    try:
        app_handler = importlib.import_module(app_handler_path)
    except ImportError:
        continue
    app_handlers += app_handler.handlers

current = os.path.abspath(__file__)
base = os.path.dirname(os.path.dirname(current))
static_path = os.path.join(base, 'static')

def runserver(args):
    if args.debug:
        sys.stderr.write("Running in debug mode\n")
    application = tornado.web.Application(
        app_handlers,
        debug=bool(args.debug),
        static_path=getattr(settings, 'STATIC_PATH', static_path)
    )

    application.listen(8888)
    ioloop = tornado.ioloop.IOLoop.instance()
    tornado.autoreload.start(ioloop)
    ioloop.start()


def syncdb(args):
    common.db.syncdb()


parser = get_parser()

subparsers = parser.add_subparsers(help="SyncDB command")

parser_syncdb = subparsers.add_parser("syncdb", help="Syncdb parser")
parser_syncdb.set_defaults(func=syncdb)

parser_runserver = subparsers.add_parser("runserver", help="runserver parser")
parser_runserver.add_argument("--debug", help="Run in debug mode.", action="store_true")
parser_runserver.set_defaults(func=runserver)
