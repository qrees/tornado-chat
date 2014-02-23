import logging


class Message(object):

    def __init__(self, id, request, body, handler, route, action, sid=None):
        self._request = request
        self._body = body
        self._handler = handler
        self._id = id
        self._route = route
        self._action = action
        self._sid = sid

    def get_sid(self):
        return self._sid

    def get_body(self):
        return self._body

    def get_route(self):
        return self._route

    def get_action(self):
        return self._action

    @staticmethod
    def from_json(json_message, handler):
        msg_body = json_message['body']
        msg_id = json_message['id']
        msg_route = json_message['route']
        msg_action = json_message.get('action', 'get')
        msg_sid = json_message.get('sid', None)

        message = Message(
            id=msg_id,
            request=handler.request,
            body=msg_body,
            handler=handler,
            route=msg_route,
            action=msg_action,
            sid=msg_sid)
        return message

    def respond(self, response):
        data = response.get_data()
        envelope = {
            'id': self._id,
            'body': data,
            'status': response.get_status(),
            'route': self._route,
            'action': self._action
        }
        logging.debug("Writing message %r" % envelope)
        self._handler.write_message(envelope)