from __future__ import absolute_import

from account.models import User
from account.fixture import Users
from common.test.testcase import ApplicationTestCase, Any


class AccountTest(ApplicationTestCase):
    datasets = [Users]
    env = {
        'Users': User
    }

    def test_add_contact(self):
        self.assertTrue(self.login('bill', 'pass'))
        self.wait_for_open()
        self.send({
            'body': {
                'username': 'steve',
            },
            'meta': {
                'id': '1'
            },
            'action': 'send',
            'route': 'resource.contact'
        })
        deserialized_response = self.wait_for_message()
        self.assertEquals(deserialized_response['route'], 'resource.contact')
        self.assertEquals(deserialized_response['id'], '1')
        self.assertEquals(deserialized_response['status'], 'ok')
        print deserialized_response
