from __future__ import absolute_import

from account.password import hash_password
from fixture import DataSet


class Users(DataSet):

    class bill:
        id = 0
        username = 'bill'
        password = hash_password('pass')

    class steve:
        id = 1
        username = 'steve'
        password = hash_password('pass')
