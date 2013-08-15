import logging


class Message(object):

    def __init__(self, id, request, body, handler):
        self._request = request
        self._body = body
        self._handler = handler
        self._id = id

    def get_body(self):
        return self._body

    @staticmethod
    def from_json(json_message, handler):
        msg_body = json_message['body']
        msg_id = json_message['id']

        message = Message(
            id=msg_id,
            request=handler.request,
            body=msg_body,
            handler=handler)
        return message

    def respond(self, response):
        data = response.get_data()
        envelope = {
            'id': self._id,
            'body': data,
            'status': response.get_status()
        }
        logging.debug("Writing message %r" % envelope)
        self._handler.write_message(envelope)