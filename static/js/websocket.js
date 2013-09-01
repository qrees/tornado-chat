(function(){
    function WS() {
        var ws = null;
        var initial_timeout = 1000;
        var max_timeout = 8000;
        var timeout = 1000;

        var close_handlers = [];
        var open_handlers = [];
        var message_callbacks = {};
        var message_handlers = [];

        var status = WebSocket.CLOSED;
        var path = null;

        var onopen = function(evt){
            timeout = initial_timeout;
            console.log("Web socket opened", evt);
            status = WebSocket.OPENED;
            for(var i = 0; i < open_handlers.length; i += 1){
                open_handlers[i](evt);
            }
        };

        var onclose = function(evt){
            console.log("Web socket closed", evt);
            status = WebSocket.CONNECTING;
            for(var i = 0; i < open_handlers.length; i += 1){
                close_handlers[i](evt);
            }
            console.log("Reconnecting in ", timeout);
            setTimeout(angular.bind(this, _open, path), timeout);
            if(timeout * 2 < max_timeout)
                timeout = timeout * 2;
        };

        var onmessage = function(evt){
            var parsed_data = JSON.parse(evt.data);
            console.debug("IN", parsed_data);
            var message_id = parsed_data.id;
            var message_route = parsed_data.route;

            if (message_id in message_callbacks) {
                message_callbacks[message_id](parsed_data);
                delete message_callbacks[message_id];
            }

            for (var i = 0; i < message_handlers.length; i += 1) {
                var regexp = message_handlers[i].route;
                var handler = message_handlers[i].handler;
                if (regexp.test(message_route)) {
                    handler(parsed_data);
                }
            }
        };

        var _open = function(_path){
            console.log("Opening");
            path = _path;
            ws = new WebSocket(path);
            ws.onopen = angular.bind(this, onopen);
            ws.onclose = angular.bind(this, onclose);
            ws.onmessage = angular.bind(this, onmessage);
        };

        this.open = function(path){
            _open("ws://"+location.host+"/" + path);
            status = WebSocket.CONNECTING;
        };

        this.on = function(event_name, handler, route) {
            if (route && (event_name !== "message")) {
                throw new Error("Route argument is only valid for 'message' events.");
            }

            if(event_name === "message"){
                message_handlers.push({
                    'route': route,
                    'handler': handler
                });
                return;
            };

            if (event_name === "close") {
                close_handlers.push(handler);
                return;
            };

            if (event_name === "open") {
                open_handlers.push(handler);
                return;
            };

            throw new Error("Unknown event name: " + event_name);
        };

        this.send = function(route, data, callback, sid) {
            var id = Math.random().toString();

            if(callback) {
                message_callbacks[id] = callback;
            }

            var message = {
               id: id,
               route: route,
               body: data,
               sid: sid
            };

            console.debug("OUT", message);
            ws.send(JSON.stringify(message));
        }
    }

    TC.WS = WS;
})();
