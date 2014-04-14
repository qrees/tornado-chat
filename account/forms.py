from wtforms import fields, validators
from common import form


UserNameField = lambda: fields.TextField(u"Username",
        [validators.required(), validators.regexp('[-a-zA-Z0-9]+'), validators.length(max=256)])


class RegisterForm(form.Form):
    username = UserNameField()
    password = fields.PasswordField(u"Password", [validators.required()])