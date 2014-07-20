import hashlib
import uuid

import logging
logger = logging.getLogger(__name__)


def hash_password(password):
    salt = uuid.uuid4().hex
    hashed_password = hashlib.sha512(password + salt).hexdigest()
    db_password = "sha512$%s$%s" % (salt, hashed_password)
    return db_password


def check_password(raw_password, dbstruct):
    alg, salt, hash = dbstruct.split("$")
    assert alg == 'sha512'
    hashed_password = hashlib.sha512(raw_password + salt).hexdigest()
    return hash == hashed_password
