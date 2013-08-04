import json
import tornado.websocket
from common.message import Message
from common.router import route_to_handler


class WebSocketRouter(tornado.websocket.WebSocketHandler):
    def open(self):
        print "WebSocket opened"

    def on_message(self, message):
        """
        raw websocket message handler. Message should be in
        json formatted dictionary with the following keys::

            id - unique message id set by client. Response will be sent with the sama id
            route - messaeg route. Refers message handler that will be used
            body - message body that will be routed to handler.

        :param : raw message in json format
        """
        json_message = json.loads(message)
        msg_handlers = route_to_handler(json_message['route'])

        message = Message.from_json(json_message=json_message, handler=self)

        for msg_handler_cls in msg_handlers:
            msg_handler = msg_handler_cls()
            msg_handler(message=message)

    def on_close(self):
        print "WebSocket closed"
