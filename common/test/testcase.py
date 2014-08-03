from __future__ import absolute_import
from copy import deepcopy
import json

from tornado import testing
from tornado.concurrent import Future
from collections import deque

from account.models import User
from account.fixture import Users
from common.fixture import DataTestCase
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


class Any(object):

    def __eq__(self, other):
        return True

    def __ne__(self, other):
        return False


class ApplicationTestCase(DataTestCase, testing.AsyncHTTPTestCase):

    @property
    def datasets(self):
        raise NotImplementedError("'datasets' of %r is not implemented or set" % (self,))

    @property
    def env(self):
        raise NotImplementedError("'env' of %r is not implemented or set" % (self,))

    def setUp(self):
        super(ApplicationTestCase, self).setUp()
        self.setUpFixture()
        self.sid = None
        self.client = WSClient(self.get_url('/websocket'), self.io_loop)

    def tearDown(self):
        self.app.db.drop_all(Base)
        super(ApplicationTestCase, self).tearDown()

    def get_app(self):
        if hasattr(self, 'app'):
            raise Exception("get_app was called more than once during one test case")

        config = Config()
        config.load()
        config.set('DATABASE_URL', "sqlite://")

        self.app = Application(config)
        self.app.bootstrap()
        self.app.db.syncdb(Base)

        self.fixture = self.app.dbfixture()
        self.fixture.env = deepcopy(self.env)

        return self.app.get_listener()

    def wait_for_open(self):
        future = Future()
        self.client.wait_for_open(future)
        self.io_loop.add_future(future, self.stop)
        self.wait()
        return future.result()

    def send(self, message):
        if isinstance(message, dict):
            message = deepcopy(message)
            message['meta']['sid'] = self.sid
        if not isinstance(message, basestring):
            message = json.dumps(message)
        self.client.write_message(message)

    def wait_for_message(self):
        future = Future()
        self.client.wait_for_message(future)
        self.io_loop.add_future(future, self.stop)
        self.wait()
        resp = future.result()
        return json.loads(resp)

    def login(self, username, password):
        account_component = self.app.get_component('account')
        res = account_component.login(username=username, password=password)
        self.sid = res[0].sid
        return res
