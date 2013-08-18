(function () {
    "use strict";

    TC.CONNECTION_STATUS = {
        'OFFLINE': 'offline',
        'CONNECTING': 'connecting',
        'CONNECTED': 'connected',
        'AUTHENTICATING': 'authenticating',
        'AUTHENTICATED': 'authenticated'
    };

    TC.Connection = TC.Class(TC.Object, {
        init: function ($ws) {
            this.super();
            this.$ws = $ws;
            this.$ws.on('open', this._onOpen.bind(this));
            this.$ws.on('close', this._onClose.bind(this));
            this.status = TC.CONNECTION_STATUS.OFFLINE;
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
        login: function (username, password) {
            this.$ws.send('login', {
                "username": username,
                "password": password
            }, this._onLogin.bind(this));
        },
        register: function(username, password) {
            this.$ws.send('register', {
                'username': username,
                'password': password
            })
        },
        _onLogin: function(data) {

        }
    });

})();
