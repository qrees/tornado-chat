from sqlalchemy.orm.exc import NoResultFound
from account.component import UserAlreadyExists
from account.forms import UserNameField
from common import form
from contacts.models import Contact
from common.business_logic import BusinessResponse, BusinessMethod, simple_business_method_factory, Unauthorized, \
    InvalidData
from common.msg_handler import BusinessMsgHandler


class ContactsMethod(BusinessMethod):
    def _perform(self):
        session = self._app.db.session()
        user = self.get_user()
        if user is None:
            return BusinessResponse.response_unauthorized({'message': 'You are not logged in'})

        contacts = session.query(Contact).filter_by(owner_id=user.id).all()
        return contacts


class ContactAddForm(form.Form):
    username = UserNameField()


class ContactAddMethod(BusinessMethod):
    FORM = ContactAddForm

    def _perform(self, **kwargs):
        session = self._app.db.session()
        user = self.get_user()
        if user is None:
            raise Unauthorized({'message': 'You are not logged in'})

        contact_name = kwargs['username']

        account = self._app.component_registry['account']
        try:
            contact_user = account.user_from_name(contact_name)
        except NoResultFound:
            try:
                contact_user = account.add_user(contact_name)
            except UserAlreadyExists:
                raise InvalidData({'message': 'Contact already exists'})

        assert user.id is not None
        assert contact_user.id is not None
        contact = Contact(
            owner_id=user.id,
            contact_id=contact_user.id
        )
        session.add(contact)
        session.flush()
        assert contact.id is not None
        return [contact]


class ContactsHandler(BusinessMsgHandler):
    route = "resource.contact"
    ACTIONS = {
        'get': simple_business_method_factory(ContactsMethod),
        'send': simple_business_method_factory(ContactAddMethod)
    }
