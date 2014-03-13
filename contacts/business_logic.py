import json
from contacts.forms import ContactForm
from contacts.models import Contact
from common.business_logic import BusinessResponse, BusinessMethod, simple_business_method_factory
from common.msg_handler import BusinessMsgHandler


class ContactsMethod(BusinessMethod):
    def _perform(self):
        session = self._app.db.session()
        account = self._app.component_registry['account']
        user = account.user_from_sid(self._sid)
        if user is None:
            return BusinessResponse.response_unauthorized({'message': 'You are not logged in'})

        contacts = session.query(Contact).filter_by(owner_id=user.id).all()
        return BusinessResponse.response_ok(json.dumps(contacts))


class CreateContactMethod(BusinessMethod):
    FORM = ContactForm

    def _perform(self, **kwargs):
        session = self._app.db.session()
        account = self._app.component_registry['account']
        user = account.user_from_sid(self._sid)


class ContactsHandler(BusinessMsgHandler):
    route = "resource.contact"
    ACTIONS = {
        'get': simple_business_method_factory(ContactsMethod),
        'post': simple_business_method_factory(CreateContactMethod)
    }
