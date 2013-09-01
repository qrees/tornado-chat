(function () {
    "use strict";

    TC.CONNECTION_STATUS = {
        'OFFLINE': 'offline',
        'CONNECTING': 'connecting',
        'CONNECTED': 'connected',
        'AUTHENTICATING': 'authenticating',
        'AUTHENTICATED': 'authenticated'
    };

    TC.Connection = TC.Class(TC.Observable, {
        init: function ($ws) {
            this.super();
            this.$ws = $ws;
            this.$ws.on('open', this._onOpen.bind(this));
            this.$ws.on('close', this._onClose.bind(this));
            this.setStatus(TC.CONNECTION_STATUS.OFFLINE);
            this._sid = null;
        },
        _onClose: function() {
            console.log("Connection closed");
        },
        _onOpen: function() {
            console.log("Connection opened");
        },
        open: function (path) {
            this.$ws.open(path);
        },

        send: function(route, data, callback) {
            this.$ws.send(route, data, callback, this._sid);
        },

        setStatus: function(status){
            this._status = status;
            this.trigger('status', [this._status]);
        },

        login: function (username, password) {
            this.$ws.send('login', {
                "username": username,
                "password": password
            }, this._onLogin.bind(this));
            this.setStatus(TC.CONNECTION_STATUS.AUTHENTICATING);
        },
        register: function(username, password) {
            this.$ws.send('register', {
                'username': username,
                'password': password
            })
        },
        _onLogin: function(data) {
            if (data.sid) {
                this._sid = data.sid;
            }
            this.setStatus(TC.CONNECTION_STATUS.AUTHENTICATED);
            console.log("Login response", data);
        }
    });

})();
