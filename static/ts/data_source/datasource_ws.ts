/// <reference path="../references.ts"/>

module TC.data_source {

    export class MessageHandler {
        constructor(
            public route: RegExp,
            public handler: Function) {

        }
    }

    export class WebSocketWrapper {
        private _url: string;
        onopen: Function;
        onclose: Function;
        onmessage: Function;

        constructor(url: string){
            this._url = url;
        }

        reopen(){

        }
    }

    export enum WebSocketStatus {
        CONNECTING,
        OPEN,
        CLOSING,
        CLOSED
    }

    export class RawMessage {
        constructor(
            public id: string,
            public route: string,
            public body: any,
            public sid: string,
            public action: string){

        }
    }

    export class ConnectorRegistry extends TC.utils.ListRegistry<Connector> { }

    export interface Connector {
        handle(queue:RawMessage[]): RawMessage[];
    }

    export class WSConnector implements Connector {
        constructor(private ws: ReconnectingWebSocket){
            if(ws === null || ws === undefined)
                throw Error("ws cannot be null or undefined");
        }

        private matches(message:RawMessage): boolean {
            return true;
        }

        handle(queue: RawMessage[]): RawMessage[] {
            var processed: RawMessage[] = [];

            if(this.ws.readyState === WebSocket.OPEN){
                for (var i:number = 0; i < queue.length; i++){
                    var message: RawMessage = queue[i];
                    if(!this.matches(message))
                        continue;
                    this.send(message);
                    processed.push(message);
                }
            }else{
                console.warn("WebSocket is not open, skipping queue");
            }
            return processed;
        }

        private send(message:RawMessage) {
            console.log("OUT", message);
            this.ws.send(JSON.stringify(message));
        }
    }

    export class WS extends TC.data_source.DataSource {
        private ws: ReconnectingWebSocket;

        private close_handlers: any[] = [];
        private open_handlers: any[] = [];
        private message_callbacks: {[ident: string]: Function } = {};
        private message_handlers: MessageHandler[] = [];

        private status: WebSocketStatus;
        private $q: ng.IQService;
        private _queue: RawMessage[] = [];
        private _connectorRegistry: ConnectorRegistry;

        constructor(
            $q: ng.IQService,
            connectorRegistry: ConnectorRegistry,
            ws: ReconnectingWebSocket){
            super();
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

        private _process_queue(){
            if(this.ws.readyState !== WebSocket.OPEN){
                console.warn("WebSocket is not open, skipping queue");
                return;
            }

            var processed: RawMessage[];
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

        private _onopen(evt) {
            console.log("Web socket opened", evt);
            this.status = WebSocketStatus.OPEN;
            for (var i:number = 0; i < this.open_handlers.length; i += 1) {
                this.open_handlers[i](evt);
            }

            this._process_queue();
        }

        private _onclose(evt) {
            console.log("Web socket closed", evt);
            this.status = WebSocketStatus.CONNECTING;
        }

        private _onmessage(evt) {
            var parsed_data = JSON.parse(evt.data);
            console.debug("IN", parsed_data);
            var message_id:string = parsed_data.id;
            var message_route:string = parsed_data.route;

            if (message_id in this.message_callbacks) {
                this.message_callbacks[message_id](parsed_data);
                delete this.message_callbacks[message_id];
            }

            for (var i = 0; i < this.message_handlers.length; i += 1) {
                var regexp = this.message_handlers[i].route;
                var handler = this.message_handlers[i].handler;
                if (regexp.test(message_route)) {
                    handler(parsed_data);
                }
            }
        }

        _open() {
            console.log("Opening");
            this.ws.connect();
        }

        open() {
            this._open();
            this.status = WebSocketStatus.CONNECTING;
        }

        on(event_name: string, handler: Function, route?:string) {
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

        send(args) {
            return this._send(args);
        }

        _send(args) {
            var route: string = args.route;
            var data: any = args.data;
            var sid: string = args.sid;
            var action: string;
            if (args.action !== undefined) {
                action = args.action;
            } else {
                action = 'send';
            }
            var id: string = Math.random().toString();

            var deferred = this.$q.defer();

            var inner_callback = function inner_callback(parsed_data) {
                deferred.resolve(parsed_data);
                if (args.callback) {
                    args.callback(parsed_data);
                }
            };

            console.log("new message handler", id, args.callback);
            this.message_callbacks[id] = inner_callback;

            var message = new RawMessage(
                id, route, data, sid, action
            );

            this._queue.push(message);
            this._process_queue();

            return deferred.promise;
        }

    }
}
