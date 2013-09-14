(function() {

    TC.WS = TC.Class(TC.DataSource, {
        ws: null,
        initial_timeout: 1000,
        max_timeout: 8000,
        timeout: 1000,

        close_handlers: [],
        open_handlers: [],
        message_callbacks: {},
        message_handlers: [],

        status: WebSocket.CLOSED,
        path: null,

        init: function($q) {
            this.super();
            this.$q = $q;
        },

        onopen: function(evt) {
            this.timeout = this.initial_timeout;
            console.log("Web socket opened", evt);
            this.status = WebSocket.OPENED;
            for (var i = 0; i < this.open_handlers.length; i += 1) {
                this.open_handlers[i](evt);
            }
        },

        onclose: function(evt) {
            console.log("Web socket closed", evt);
            this.status = WebSocket.CONNECTING;
            for (var i = 0; i < this.close_handlers.length; i += 1) {
                this.close_handlers[i](evt);
            }
            console.log("Reconnecting in ", timeout);
            setTimeout(angular.bind(this, _open, path), timeout);
            if (this.timeout * 2 < max_timeout)
                this.timeout = this.timeout * 2;
        },

        onmessage: function(evt) {
            var parsed_data = JSON.parse(evt.data);
            console.debug("IN", parsed_data);
            var message_id = parsed_data.id;
            var message_route = parsed_data.route;

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
        },

        _open: function(_path) {
            console.log("Opening");
            this.path = _path;
            this.ws = new WebSocket(this.path);
            this.ws.onopen = angular.bind(this, this.onopen);
            this.ws.onclose = angular.bind(this, this.onclose);
            this.ws.onmessage = angular.bind(this, this.onmessage);
        },

        open: function(path) {
            this._open("ws://" + location.host + "/" + path);
            this.status = WebSocket.CONNECTING;
        },

        on: function(event_name, handler, route) {
            if (route && (event_name !== "message")) {
                throw new Error("Route argument is only valid for 'message' events.");
            }

            if (event_name === "message") {
                this.message_handlers.push({
                    'route': route,
                    'handler': handler
                });
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
        },

        send: function(args) {
            return this._send(args);
        },

        _send: function(args) {
            var route = args.route;
            var data = args.data;
            var sid = args.sid;
            var action;
            if (args.action !== undefined) {
                action = args.action;
            } else {
                action = 'send';
            }
            var id = Math.random().toString();

            var deferred = this.$q.defer();
//            var promise = deferred.promise;

            var inner_callback = function inner_callback(parsed_data) {
                deferred.resolve(parsed_data);
                if (args.callback) {
                    args.callback(parsed_data);
                }
            }
            this.message_callbacks[id] = inner_callback();

            var message = {
                id: id,
                route: route,
                body: data,
                sid: sid,
                action: action
            };

            console.debug("OUT", message);
            this.ws.send(JSON.stringify(message));
            return deferred;
        }
    });



})();
