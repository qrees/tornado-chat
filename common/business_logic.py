import logging
from common.hacks import MultiDict
from common.simplifier import Simplifier, SimpleObject


class BusinessResponse(object):

    STATUS_OK = 'ok'
    STATUS_EXCEPTION = 'exception'
    STATUS_INVALID = 'invalid'
    STATUS_UNSUPPORTED = 'unsupported'
    STATUS_UNAUTHORIZED = 'unauthorized'
    STATUS_NOT_FOUND = 'not_found'

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

    @classmethod
    def response_invalid_action(cls, data):
        return BusinessResponse(status=BusinessResponse.STATUS_UNSUPPORTED, data=data)

    @classmethod
    def response_unauthorized(cls, data):
        return BusinessResponse(status=BusinessResponse.STATUS_UNAUTHORIZED, data=data)

    @classmethod
    def response_not_found(cls, data):
        return BusinessResponse(status=BusinessResponse.STATUS_NOT_FOUND, data=data)


class BusinessMethodException(BaseException):
    def __init__(self, data=None, message=None):
        super(BusinessMethodException, self).__init__(message)
        self._data = data

    @property
    def data(self):
        return self._data


class InvalidData(BusinessMethodException, SimpleObject):

    def as_simple_object(self):
        return self._data


class Unauthorized(BusinessMethodException, SimpleObject):

    def as_simple_object(self):
        return self._data


class ValidationError(BaseException):

    def __init__(self, response):
        self.response = response


def simple_business_method_factory(method):
    class BusnessMethodFactory(object):
        def __init__(self, app):
            self._app = app

        def __call__(self, message):
            return method(self._app, message)()

    return BusnessMethodFactory


class BusinessMethod(object):
    RESPONSE_CLASS = BusinessResponse
    SIMPLIFIER_CLASS = Simplifier
    FORM = None

    def get_user(self):
        account = self._app.component_registry['account']
        if self._sid is None:
            raise Unauthorized()
        return account.user_from_sid(self._sid)

    def __init__(self, app, message):
        self._app = app
        self._message = message
        self._sid = self._message.get_sid()

    def _simplify(self, data):
        serializer = self.SIMPLIFIER_CLASS(self)
        return serializer.simplify(data)

    def _response_ok(self, serialized):
        return self.RESPONSE_CLASS.response_ok(serialized)

    def _response_invalid_data(self, serialized):
        return self.RESPONSE_CLASS.response_invalid_data(serialized)

    def _response_unauthorized(self, serialized):
        return self.RESPONSE_CLASS.response_unauthorized(serialized)

    def _perform_internal(self, **kwargs):
        try:
            data = self._perform(**kwargs)
        except InvalidData as e:
            serialized = self._simplify(e)
            return self._response_invalid_data(serialized)
        except Unauthorized as e:
            serialized = self._simplify(e)
            return self._response_unauthorized(serialized)
        else:
            serialized = self._simplify(data)
            return self._response_ok(serialized)

    def _perform(self, **kwargs):
        raise NotImplemented("_perform of %r has to be implemented" % (self,))

    def _validate(self, data):
        if self.FORM is None:
            return data

        form = self.FORM(self._app, MultiDict(data))
        if not form.validate():
            raise ValidationError(BusinessResponse.response_invalid_data(form.errors))
        return form.data

    def __call__(self):
        db = self._app.db
        body = self._message.get_body()
        try:
            data = self._validate(body)
        except ValidationError as e:
            return e.response

        try:
            response = self._perform_internal(**data)
            db.commit_session()
        except Exception, e:
            logging.exception("Exception when calling business method")
            response = self.RESPONSE_CLASS.response_exception(e)
            db.rollback_session()
        finally:
            pass
        return response
