import functools
import logging
from common.db import get_session


class BusinessResponse(object):

    STATUS_OK = 'ok'
    STATUS_EXCEPTION = 'exception'
    STATUS_INVALID = 'invalid'

    def __init__(self, status=STATUS_OK, data=None, exception=None):
        self._status = status
        self._data = data
        self._exception = exception

    def get_data(self):
        return self._data

    def get_status(self):
        return self._status

    @staticmethod
    def response_ok(data):
        return BusinessResponse(data=data)

    @staticmethod
    def response_exception(exception):
        return BusinessResponse(status=BusinessResponse.STATUS_EXCEPTION, exception=exception)

    @classmethod
    def response_invalid_data(cls, data):
        return BusinessResponse(status=BusinessResponse.STATUS_INVALID, data=data)
        pass


def business_method(method):

    @functools.wraps(method)
    def wrapped(*args, **kwargs):
        print "Called %r with %r %r" % (method, args, kwargs)
        session = get_session()
        # noinspection PyBroadException
        try:
            response = method(*args, **kwargs)
            session.commit()
        except Exception, e:
            logging.exception("Exception when calling business method")
            response = BusinessResponse.response_exception(e)
            session.rollback()
        finally:
            session.close()
        return response

    return wrapped
