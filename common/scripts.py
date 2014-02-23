import tornado.ioloop
import tornado.autoreload

from common.application import make_app
from common.db import Base


def start_app(args):
    app = make_app()
    listener = app.get_listener()
    listener.listen(8888)
    ioloop = tornado.ioloop.IOLoop.instance()
    tornado.autoreload.start(ioloop)
    ioloop.start()


def syncdb(args):
    app = make_app()
    app.db.syncdb(Base)
