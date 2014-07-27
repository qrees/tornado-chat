from __future__ import absolute_import

from account.models import User
from account.fixture import Users
from common.test.testcase import ApplicationTestCase, Any


class AccountTest(ApplicationTestCase):
    datasets = [Users]
    env = {
        'Users': User
    }

    def test_register(self):
        self.wait_for_open()
        self.send({
            'body': {
                'username': 'test',
                'password': 'password'
            },
            'meta': {
                'id': '1'
            },
            'action': 'send',
            'route': 'register'
        })
        deserialized_response = self.wait_for_message()
        self.assertEquals(deserialized_response['route'], 'register')
        self.assertEquals(deserialized_response['id'], '1')
        self.assertEquals(deserialized_response['status'], 'ok')
        self.assertDictContainsSubset({
            "username": "test", "$resource": "user", "$id": Any()
        }, deserialized_response['body'][0])
        self.assertNotIn('password', deserialized_response['body'][0])

    def test_login(self):
        self.wait_for_open()
        self.send({
            'body': {
                'username': 'bill',
                'password': 'pass'
            },
            'meta': {
                'id': '1'
            },
            'action': 'send',
            'route': 'login'
        })
        deserialized_response = self.wait_for_message()
        self.assertEquals(deserialized_response['route'], 'login')
        self.assertEquals(deserialized_response['status'], 'ok')
        self.assertIsInstance(deserialized_response['body'][0], dict)
        self.assertDictContainsSubset({
            "user_id": self.data.Users.bill.id, "$resource": "session", "sid": Any()
        }, deserialized_response['body'][0])
        self.assertNotIn('password', deserialized_response['body'][0])
