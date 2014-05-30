///<reference path="../references.ts"/>

module TC.rest {

    export class RestResponse {
        private _id: string;
        private _route: string;
        private _body: any;
        private _status: string;

        public setStatus(status: string): void {
            this._status = status;
        }

        public getStatus(): string {
            return this._status;
        }

        public getId(): string {
            return this._id;
        }

        public setId(id: string){
            this._id = id;
        }
        public getRoute(): string {
            return this._route;
        }

        public setRoute(route: string){
            this._route = route;
        }

        public setBody(data: any){
            this._body = data;
        }
        public getBody(): any {
            return this._body;
        }
    }

    export enum RestActionType {
        SEND,
        GET
    }

    export class RestRequest {
        private _action: RestActionType;
        private _data: any = {};
        private _route: string;
        private _meta: {[key: string]: string} = {};
        private _callback: Function;

        constructor(route: string, data: any, action?: RestActionType){
            TC.utils.assert(data !== undefined);
            if (action === undefined)
                action = RestActionType.GET;
            this._action = action;
            this._data = data;
            this._route = route;
            this._meta['id'] = Math.random().toString();
            this._callback = function(){};
        }

        public getId(): string {
            return this._meta['id'];
        }

        public getMeta(key: string): string {
            return this._meta[key];
        }

        public setMeta(key: string, value: string) {
            this._meta[key] = value;
        }

        public callback(data: RestResponse): void {
            this._callback(data);
        }

        public setCallback(callback: Function): void {
            this._callback = callback;
        }

        public getAction(): RestActionType{
            return this._action;
        }

        public setAction(action: RestActionType): void {
            this._action = action
        }

        public actionName(): string {
            return RestActionType[this._action];
        }

        stringify(): string{
            return JSON.stringify({
                'action': this.actionName(),
                'body': this._data,
                'route': this._route,
                'id': this._meta['id'],
                'meta': this._meta
            });
        }
    }
}