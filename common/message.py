import logging


class Message(object):

    def __init__(self, id, request, body, handler, route, action, meta):
        self._request = request
        self._body = body
        self._handler = handler
        self._id = id
        self._route = route
        self._action = action
        self._sid = meta.get('sid', None)
        self._meta = meta

    def get_sid(self):
        return self._sid

    def get_body(self):
        return self._body

    def get_route(self):
        return self._route

    def get_action(self):
        return self._action

    @staticmethod
    def empty(handler):
        return Message(
            id=None,
            request=handler.request,
            body=None,
            handler=handler,
            route=None,
            action=None,
            meta=None
        )

    @staticmethod
    def from_json(json_message, handler):
        msg_meta = json_message['meta']
        msg_body = json_message['body']
        msg_id = msg_meta['id']
        msg_route = json_message['route']
        msg_action = json_message.get('action', 'get')

        message = Message(
            id=msg_id,
            request=handler.request,
            body=msg_body,
            handler=handler,
            route=msg_route,
            action=msg_action,
            meta=msg_meta)
        return message

    def respond(self, response):
        envelope = {
            'id': self._id,
            'body': response.get_data(),
            'status': response.get_status(),
            'route': self._route,
            'action': self._action
        }
        logging.debug("Writing message %r" % envelope)
        self._handler.write_message(envelope)