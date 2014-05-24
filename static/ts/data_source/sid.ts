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
            copied.setMeta('sid', this._sid.getSid());
            copied.setAction(TC.rest.RestActionType.GET);
            return this._ws.get(copied);
        }

        send(request: TC.rest.RestRequest): ng.IPromise<TC.rest.RestResponse> {
            var copied: TC.rest.RestRequest = angular.copy(request);
            copied.setMeta('sid', this._sid.getSid());
            copied.setAction(TC.rest.RestActionType.SEND);
            return this._ws.send(copied);
        }
    }
}