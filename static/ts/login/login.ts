module TC.login {

    class StatusEvent extends TC.utils.Event {
        private _status: ConnectionStatus;

        getStatus(): ConnectionStatus {
            return this._status;
        }

        constructor(status: ConnectionStatus){
            this._status = status;
            super();
        }
    }

    export enum ConnectionStatus {
        OFFLINE,
        CONNECTING,
        CONNECTED,
        AUTHENTICATING,
        AUTHENTICATED
    }

    export class Connection {
        public event_status: TC.utils.EventDispatcher = new TC.utils.EventDispatcher();
        private _ds: TC.data_source.DataSource;
        private _sid: TC.session.SessionStorage;
        private _rootScope: ng.IScope;
        private _status: ConnectionStatus;

        constructor($ds: TC.data_source.DataSource,
                    $sid: TC.session.SessionStorage,
                    $rootScope: ng.IScope) {
            this._ds = $ds;
            this.setStatus(ConnectionStatus.OFFLINE);
            this._sid = $sid;
            this._rootScope = $rootScope;
        }

        get(route: string, data: any, callback?: Function): ng.IPromise<TC.rest.RestResponse> {
            var request: TC.rest.RestRequest = new TC.rest.RestRequest(route, data);
            var response: ng.IPromise<TC.rest.RestResponse> = this._ds.get(request);
            if(callback)
                response.then(callback);
            return response;
        }

        send(route: string, data: any, callback?: Function): ng.IPromise<TC.rest.RestResponse> {
            var request: TC.rest.RestRequest = new TC.rest.RestRequest(route, data);
            var response: ng.IPromise<TC.rest.RestResponse> = this._ds.send(request);
            if(callback)
                response.then(callback);
            return response;
        }

        setStatus(status: ConnectionStatus): void {
            this._status = status;
            this.event_status.trigger(new StatusEvent(status));
        }

        login(username: string, password: string): ng.IPromise<TC.rest.RestResponse> {
            var response: ng.IPromise<TC.rest.RestResponse> = this.send('login', {
                "username": username,
                "password": password
            }, this._onLogin.bind(this));
            this.setStatus(ConnectionStatus.AUTHENTICATING);
            return response;
        }

        register(username: string, password: string): ng.IPromise<TC.rest.RestResponse> {
            return this.send('register', {
                "username": username,
                "password": password
            });
        }

        private _onLogin(data: TC.rest.RestResponse): void {
            var body: any = data.getBody();
            if (body.sid) {
                this._sid.setSid(body.sid);
                this.setStatus(ConnectionStatus.AUTHENTICATED);
            }else{
                this.setStatus(ConnectionStatus.OFFLINE);
            }
        }
    }
}