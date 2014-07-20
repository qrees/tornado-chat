///<reference path="../references.ts"/>

module TC.models {

    export class Contact extends TC.Model {
        private contact_id: string;
        private owner_id: string;

        public update(value: Mapping): void {
            super.update(value);
            this.contact_id = value['contact_id'];
            this.owner_id = value['owner_id'];
        }
    }

}
