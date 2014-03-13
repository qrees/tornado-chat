from common import form
from wtforms import fields, validators


class ContactForm(form.Form):
    contact_id = fields.TextField(
        u"Contact",
        [
            validators.required(),
            validators.regexp('[-a-zA-Z0-9]+'),
            validators.length(max=256)
        ])
