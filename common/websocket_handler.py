import json
from tornado.ioloop import IOLoop
import tornado.websocket
from common.message import Message

import logging
logger = logging.getLogger(__name__)


class WebSocketRouterFactory(object):

    def __init__(self, app):
        self._app = app

    def __call__(self, *args, **kwargs):
        router = WebSocketRouter(self._app, *args, **kwargs)
        return router


class WebSocketRouter(tornado.websocket.WebSocketHandler):

    def __init__(self, app, *args, **kwargs):
        self._app = app
        super(WebSocketRouter, self).__init__(*args, **kwargs)

    def open(self):
        logger.info("Websocket opened")

    def on_message(self, message):
        """
        raw websocket message handler. Message should be in
        json formatted dictionary with the following keys::

            id - unique message id set by client. Response will be sent with the sama id
            route - messaeg route. Refers message handler that will be used
            body - message body that will be routed to handler.

        :param : raw message in json format
        """
        try:
            json_message = json.loads(message)
        except ValueError:
            self.write_message({"status": "invalid", "error": "Cannot deserialize request"})
            return

        try:
            message = Message.from_json(json_message=json_message, handler=self)
        except KeyError as e:
            self.write_message({"status": "invalid", "error": "Missing key in message: " + e.message})
            return

        msg_handlers = self._app.msg_handler_registry.match(message.get_route())
        ioloop = IOLoop.current()

        for msg_handler_cls in msg_handlers:
            msg_handler = msg_handler_cls()
            future = msg_handler.call(message=message)

            def callback(future):
                msg_handler.result(future)

            if future.done():
                pass
            else:
                ioloop.add_future(future, callback)

    def on_close(self):
        logger.info("Websocket closed")
