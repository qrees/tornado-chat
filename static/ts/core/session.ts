module TC.session {

    export class SessionStorage {
        private _sid: string;

        constructor(){
           this._sid = localStorage.getItem('sid');
        }

        public setSid(sid: string){
            localStorage.setItem('sid', sid);
            this._sid = sid;
        }

        public getSid(): string {
            return this._sid;
        }
    }

}