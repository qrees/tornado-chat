from common.business_logic import RestBusinessMethod
from common.msg_handler import BusinessMsgHandler, HandlerFactory

from logging import getLogger
logger = getLogger(__name__)


def simple_business_method(business_method, app):

    def inner(**kwargs):
        return business_method(app)(**kwargs)

    return inner


def simple_rest_business_method(business_method):
    logger.info("Creating new RestBusinessMethod with method %r" % (business_method,))
    new_class = type(
        'Rest' + business_method.__name__,
        (RestBusinessMethod,),
        {
            'BUSINES_METHOD': business_method
        }
    )
    return new_class


def simple_rest_method_handler(methodActions, routeArg, app):
    ACTIONS_ARG = {}
    for action, method in methodActions.items():
        ACTIONS_ARG[action] = simple_rest_business_method(method)

    class Handler(BusinessMsgHandler):
        route = routeArg
        ACTIONS = ACTIONS_ARG

    return HandlerFactory(Handler, app)
