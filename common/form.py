from wtforms import form


class Form(form.Form):

    def __init__(self, app, *args, **kwargs):
        self._app = app
        super(Form, self).__init__(*args, **kwargs)
