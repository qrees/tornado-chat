import tornado.web
from common.websocket_handler import WebSocketRouterFactory
from common.template import FileTemplate


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        template = FileTemplate("index.html")
        self.write(template.render())


handlers = [
    (r"/", lambda app: MainHandler),
    (r"/websocket", WebSocketRouterFactory)]
