from common.db import get_session


class Message(object):

    def __init__(self, id, request, message, handler):
        self.request = request
        self.message = message
        self.handler = handler
        self.id = id

    @staticmethod
    def from_json(json_message, handler):
        msg_body = json_message['body']
        msg_id = json_message['id']

        message = Message(
            id=msg_id,
            request=handler.request,
            message=msg_body,
            handler=handler)
        return message