import logging


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


class BusinessMethod(object):
    RESPONSE_CLASS = BusinessResponse

    def __init__(self, app):
        self._app = app

    def _perform(self, **kwargs):
        raise NotImplemented("_perform of %r has to be implemented" % (self,))

    def __call__(self, **kwargs):
        db = self._app.db
        # session = get_session()
        # noinspection PyBroadException
        try:
            response = self._perform(**kwargs)
            db.commit_session()
        except Exception, e:
            logging.exception("Exception when calling business method")
            response = self.RESPONSE_CLASS.response_exception(e)
            db.rollback_session()
        finally:
            pass
        return response
