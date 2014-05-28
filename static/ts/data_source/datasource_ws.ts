/// <reference path="../references.ts"/>

module TC.data_source {

    interface ResponseHandler {
        (response: TC.rest.RestResponse): void;
    }

    class MessageHandler {
        constructor(
            public route: RegExp,
            public handler: ResponseHandler){

        }
    }

    export enum WebSocketStatus {
        CONNECTING,
        OPEN,
        CLOSING,
        CLOSED
    }

    export class WS implements TC.data_source.DataSource {
        private ws: ReconnectingWebSocket;

        private close_handlers: any[] = [];
        private open_handlers: any[] = [];
        private message_callbacks: {[ident: string]: ResponseHandler } = {};
        private message_handlers: MessageHandler[] = [];

        private status: WebSocketStatus;
        private $q: ng.IQService;
        private $rootScope: ng.IScope;
        private _queue: TC.rest.RestRequest[] = [];
        private _connectorRegistry: ConnectorRegistry;

        constructor(
            $rootScope: ng.IScope,
            $q: ng.IQService,
            connectorRegistry: ConnectorRegistry,
            ws: ReconnectingWebSocket){
            this.$rootScope = $rootScope;
            this.$q = $q;
            this._queue = [];
            this._connectorRegistry = connectorRegistry;
            if(ws === null || ws === undefined)
                throw Error("ws cannot be null or undefined");

            this.ws = ws;
            this.ws.onopen = angular.bind(this, this._onopen);
            this.ws.onclose = angular.bind(this, this._onclose);
            this.ws.onmessage = angular.bind(this, this._onmessage);
        }

        private _process_queue(): void {
            if(this.ws.readyState !== WebSocket.OPEN){
                console.warn("WebSocket is not open, skipping queue");
                return;
            }

            var processed: TC.rest.RestRequest[];
            var connectors: Connector[] = this._connectorRegistry.getItems();

            for (var i:number = 0; i < connectors.length; i++){
                var connector:Connector = connectors[i];
                processed = connector.handle(this._queue);
                this._queue = this._queue.filter(function(obj){
                    return processed.indexOf(obj) < 0;
                })
            }

            if (this._queue.length > 0){
                console.warn("Some messages have not been processed", this._queue);
            }
        }

        private _onopen(evt: Event): void {
            console.log("Web socket opened", evt);
            this.status = WebSocketStatus.OPEN;
            for (var i:number = 0; i < this.open_handlers.length; i += 1) {
                this.open_handlers[i](evt);
            }

            this._process_queue();
        }

        private _onclose(evt: CloseEvent): void {
            console.log("Web socket closed", evt);
            this.status = WebSocketStatus.CONNECTING;
        }

        private _responseFromString(data: string): TC.rest.RestResponse {
            var parsed_data: any = JSON.parse(data);
            var response: TC.rest.RestResponse = new TC.rest.RestResponse();
            response.setId(parsed_data['id']);
            response.setRoute(parsed_data['route']);
            response.setBody(parsed_data['body']);
            response.setStatus(parsed_data['status']);
            return response;
        }

        private _onmessage(evt: MessageEvent): void {
            var response: TC.rest.RestResponse = this._responseFromString(evt.data);
            console.debug("IN", response);
            var message_id: string = response.getId();
            var message_route: string = response.getRoute();
            if (message_id in this.message_callbacks) {
                this.message_callbacks[message_id](response);
                delete this.message_callbacks[message_id];
            }

            for (var i: number = 0; i < this.message_handlers.length; i += 1) {
                var regexp: RegExp = this.message_handlers[i].route;
                var handler: ResponseHandler = this.message_handlers[i].handler;
                if (regexp.test(message_route)) {
                    handler(response);
                }
            }
        }

        private _open(): void {
            console.log("Opening");
            this.ws.connect();
        }

        public open(): void {
            this._open();
            this.status = WebSocketStatus.CONNECTING;
        }

        public on(event_name: string, handler: Function, route?:string): void {
            if (route && (event_name !== "message")) {
                throw new Error("Route argument is only valid for 'message' events.");
            }


            if (event_name === "message") {
                var route_regexp: RegExp = RegExp(route);
                this.message_handlers.push(new MessageHandler(
                    route_regexp,
                    handler
                ));
                return;
            }

            if (event_name === "close") {
                this.close_handlers.push(handler);
                return;
            }

            if (event_name === "open") {
                this.open_handlers.push(handler);
                return;
            }

            throw new Error("Unknown event name: " + event_name);
        }

        public send(request: TC.rest.RestRequest): ng.IPromise<TC.rest.RestResponse> {
            request.setAction(TC.rest.RestActionType.SEND); // FIXME: make a copy of request?
            return this._send(request);
        }

        public get(request: TC.rest.RestRequest): ng.IPromise<TC.rest.RestResponse> {
            request.setAction(TC.rest.RestActionType.GET); // FIXME: make a copy of request?
            return this._send(request);
        }

        private _send(request: TC.rest.RestRequest): ng.IPromise<TC.rest.RestResponse>  {
            var deferred: ng.IDeferred<TC.rest.RestResponse> = this.$q.defer();

            var inner_callback: ResponseHandler = (parsed_data: TC.rest.RestResponse) => {
                this.$rootScope.$apply(function(){
                    deferred.resolve(parsed_data);
                });
                if (request.callback) {
                    request.callback(parsed_data);
                }
            };

            this.message_callbacks[request.getId()] = inner_callback;

            this._queue.push(request);
            this._process_queue();

            return deferred.promise;
        }

    }
}
