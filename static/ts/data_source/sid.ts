///<reference path="../references.ts"/>

module TC.data_source {

    export class Sid implements DataSource {
        private _ws: DataSource;
        private _sid: TC.session.SessionStorage;

        constructor($ws: DataSource, $sid: TC.session.SessionStorage) {
            this._ws = $ws;
            this._sid = $sid;
        }

        open(): void {
            this._ws.open();
        }

        get(request: TC.rest.RestRequest): ng.IPromise<TC.rest.RestResponse> {
            var copied: TC.rest.RestRequest = angular.copy(request);
            var sid = this._sid.getSid();
            copied.setMeta('sid', this._sid.getSid());
            copied.setAction(TC.rest.RestActionType.GET);
            console.debug("call get on ", this._ws, "with", copied);
            return this._ws.get(copied);
        }

        send(request: TC.rest.RestRequest): ng.IPromise<TC.rest.RestResponse> {
            var copied: TC.rest.RestRequest = angular.copy(request);
            var sid = this._sid.getSid();
            if(sid === undefined || sid === null){
                throw new Error("sid is not set");
            }
            copied.setMeta('sid', sid);
            copied.setAction(TC.rest.RestActionType.SEND);
            console.debug("call get on ", this._ws, "with", copied);
            return this._ws.send(copied);
        }
    }
}