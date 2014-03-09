/// <reference path="../references.ts"/>

module TC.data_source {
    declare var WebSocket;

    export class MessageHandler {
        constructor(
            public route: RegExp,
            public handler: Function) {

        }
    }

    export enum WebSocketStatus {
        CONNECTING,
        OPEN,
        CLOSING,
        CLOSED
    }

    class RawMessage {
        constructor(
            public id: string,
            public route: string,
            public body: any,
            public sid: string,
            public action: string){

        }
    }

    export interface Connector {

    }

    export class WS extends TC.data_source.DataSource {
        private ws: any;  // TODO: websocket;
        private initial_timeout: number = 1000;
        private max_timeout: number = 8000;
        private timeout: number = 1000;

        private close_handlers: any[] = [];
        private open_handlers: any[] = [];
        private message_callbacks: {[ident: string]: Function } = {};
        private message_handlers: MessageHandler[] = [];

        private status: WebSocketStatus;
        private path: string;
        private $q: ng.IQService;
        private _queue: RawMessage[] = [];
        private _connectorRegistry: Connector[] = [];

        constructor($q: ng.IQService, connectorRegistry){
            super();
            this.$q = $q;
            this._queue = [];
            this._connectorRegistry = connectorRegistry;
        }

        private _process_queue(){
            if(this.ws.readyState === WebSocket.OPEN){
                // TODO : handle partial success
                for (var i:number = 0; i < this._queue.length; i++){
                    var message = this._queue[i];
                    console.log("OUT", message);
                    this.ws.send(JSON.stringify(message));
                }
                this._queue = [];
            }else{
                console.warn("WebSocket is not open, skipping queue");
            }
        }

        private _onopen(evt) {
            this.timeout = this.initial_timeout;
            console.log("Web socket opened", evt);
            this.status = WebSocketStatus.OPEN;
            for (var i = 0; i < this.open_handlers.length; i += 1) {
                this.open_handlers[i](evt);
            }

            this._process_queue();
        }

        private _onclose(evt) {
            console.log("Web socket closed", evt);
            this.status = WebSocketStatus.CONNECTING;
            for (var i:number = 0; i < this.close_handlers.length; i += 1) {
                this.close_handlers[i](evt);
            }
            console.log("Reconnecting in ", this.timeout);
            setTimeout(angular.bind(this, this._open, this.path), this.timeout);
            if (this.timeout * 2 < this.max_timeout)
                this.timeout = this.timeout * 2;
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

        _open(path: string) {
            console.log("Opening");
            this.path = path;
            this.ws = new WebSocket(this.path);
            this.ws.onopen = angular.bind(this, this._onopen);
            this.ws.onclose = angular.bind(this, this._onclose);
            this.ws.onmessage = angular.bind(this, this._onmessage);
        }

        open(path: string) {
            this._open("ws://" + location.host + "/" + path);
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
