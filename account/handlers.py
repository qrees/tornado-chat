
import tornado.websocket
from common.websocket_handler import WebSocketRouter
from common.template import FileTemplate


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        template = FileTemplate("index.html")
        self.write(template.render())

handlers = [
    (r"/", MainHandler),
    (r"/websocket", WebSocketRouter)]