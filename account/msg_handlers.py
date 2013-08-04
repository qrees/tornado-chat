from common.msg_handler import MsgHandler


class LoginHandler(MsgHandler):
    route = "login"

    def __call__(self, message, **kwargs):
        print message.message