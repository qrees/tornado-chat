from common.db import get_session


class Message(object):

    def __init__(self, id, request, message, db_session, handler):
        self.request = request
        self.message = message
        self.db_session = db_session
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
            db_session=get_session(),
            handler=handler)
        return message