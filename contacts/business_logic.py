from account.forms import UserNameField
from common import form
from contacts.models import Contact
from common.business_logic import BusinessResponse, BusinessMethod, simple_business_method_factory
from common.msg_handler import BusinessMsgHandler


class ContactsMethod(BusinessMethod):
    def _perform(self):
        session = self._app.db.session()
        user = self.get_user()
        if user is None:
            return BusinessResponse.response_unauthorized({'message': 'You are not logged in'})

        contacts = session.query(Contact).filter_by(owner_id=user.id).all()
        return BusinessResponse.response_ok(contacts)


class ContactAddForm(form.Form):
    username = UserNameField()


class ContactAddMethod(BusinessMethod):
    FORM = ContactAddForm
    def _perform(self, **kwargs):
        session = self._app.db.session()
        user = self.get_user()
        if user is None:
            return BusinessResponse.response_unauthorized({'message': 'You are not logged in'})

        contact_name = kwargs['username']

        account = self._app.component_registry['account']
        contact_user = account.user_from_name(contact_name)
        if contact_user is None:
            return BusinessResponse.response_not_found({'message': 'Contact not found'})

        contact = Contact(
            user_id=user.id,
            contact_id=contact_user.id
        )
        session.add(contact)
        return BusinessResponse.response_ok([contact])


class ContactsHandler(BusinessMsgHandler):
    route = "resource.contact"
    ACTIONS = {
        'get': simple_business_method_factory(ContactsMethod),
        'send': simple_business_method_factory(ContactAddMethod)
    }
