from common.exceptions import HandlerNotFound
from common.msg_handler import get_registry


def route_to_handler(route):
    registry = get_registry()
    return registry.match(route)
