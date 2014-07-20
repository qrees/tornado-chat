from collections import deque
import json
import logging
from tornado import testing
from tornado.concurrent import Future
from common.application import Config, Application
from common.db import Base

from common.test import websocket


class WSClient(websocket.WebSocket):
    def __init__(self, *args, **kwargs):
        super(WSClient, self).__init__(*args, **kwargs)
        self._on_open_future = None
        self._msg_buffer = deque()
        self._msg_futures = deque()

    def process_messages(self):
        while True:
            if len(self._msg_buffer) and len(self._msg_futures):
                future = self._msg_futures.popleft()
                message = self._msg_buffer.popleft()
                future.set_result(message)
            else:
                break

    def wait_for_message(self, future):
        self._msg_futures.append(future)
        self.process_messages()
        assert len(self._msg_futures) < 2

    def wait_for_open(self, future):
        if self.is_open():
            future.set_result(True)
        else:
            self._on_open_future = future

    def on_open(self):
        if self._on_open_future:
            self._on_open_future.set_result(True)
            self._on_open_future = None

    def on_message(self, data):
        self._msg_buffer.append(data)
        self.process_messages()


class AccountTest(testing.AsyncHTTPTestCase):

    def setUp(self):
        super(AccountTest, self).setUp()
        self.client = WSClient(self.get_url('/websocket'), self.io_loop)

    def get_app(self):
        logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
        config = Config()
        config.load()
        config.set('DATABASE_URL', "sqlite://")
        app = Application(config)
        app.bootstrap()
        app.db.syncdb(Base)
        return app.get_listener()

    def wait_for_open(self):
        future = Future()
        self.client.wait_for_open(future)
        self.io_loop.add_future(future, self.stop)
        self.wait()
        return future.result()

    def send(self, message):
        self.client.write_message(message)

    def wait_for_message(self):
        future = Future()
        self.client.wait_for_message(future)
        self.io_loop.add_future(future, self.stop)
        self.wait()
        return future.result()

    def test_register(self):
        self.wait_for_open()
        self.send(json.dumps({
            'body': {
                'username': 'test',
                'password': 'password'
            },
            'meta': {
                'id': '1'
            },
            'action': 'send',
            'route': 'register'
        }))
        response = self.wait_for_message()
        deserialized_response = json.loads(response)
        self.assertEquals(deserialized_response['route'], 'register')
        self.assertEquals(deserialized_response['id'], '1')
        self.assertEquals(deserialized_response['status'], 'ok')
        self.assertDictContainsSubset({
            "username": "test", "$model": "user", "id": 1
        }, deserialized_response['body'][0])
        self.assertNotIn('password', deserialized_response['body'][0])
