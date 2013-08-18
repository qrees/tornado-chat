import logging


class Message(object):

    def __init__(self, id, request, body, handler, route):
        self._request = request
        self._body = body
        self._handler = handler
        self._id = id
        self._route = route

    def get_body(self):
        return self._body

    @staticmethod
    def from_json(json_message, handler):
        msg_body = json_message['body']
        msg_id = json_message['id']
        msg_route = json_message['route']

        message = Message(
            id=msg_id,
            request=handler.request,
            body=msg_body,
            handler=handler,
            route=msg_route)
        return message

    def respond(self, response):
        data = response.get_data()
        envelope = {
            'id': self._id,
            'body': data,
            'status': response.get_status(),
            'route': self._route
        }
        logging.debug("Writing message %r" % envelope)
        self._handler.write_message(envelope)