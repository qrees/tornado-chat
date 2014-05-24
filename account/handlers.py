import tornado.web
from common.websocket_handler import WebSocketRouterFactory
from common.template import FileTemplate


class MainHandlerFactory(object):

    def __init__(self, app):
        self._app = app

    def __call__(self, *args, **kwargs):
        return MainHandler(self._app, *args, **kwargs)


class MainHandler(tornado.web.RequestHandler):
    def __init__(self, app, *args, **kwargs):
        self._app = app
        super(MainHandler, self).__init__(*args, **kwargs)

    def get(self):
        template = self._app.template_environment.get_template("index.html")
        self.write(template.render())


handlers = [
    (r"/", MainHandlerFactory),
    (r"/websocket", WebSocketRouterFactory)]
