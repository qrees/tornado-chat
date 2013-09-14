(function () {
    "use strict";

    TC.CONNECTION_STATUS = {
        'OFFLINE': 'offline',
        'CONNECTING': 'connecting',
        'CONNECTED': 'connected',
        'AUTHENTICATING': 'authenticating',
        'AUTHENTICATED': 'authenticated'
    };

    TC.SessionStorage = TC.Class(TC.Object, {
        _sid: null,
        setSid: function(sid){
            this._sid = sid;
        },
        getSid: function(){
            return  this._sid;
        }
    });

    TC.SidDataSource = TC.Class(TC.DataSource, {
        init: function($ds, $sid) {
            this.$ds = $ds;
            this.$sid = $sid;
        },

        open: function(path) {
            return this.$ds.open(path);
        },

        get: function(args) {
            var copied = angular.copy(args);
            copied.sid = this.$sid.getSid();
            copied.action = 'get';
            return this.$ds.send(copied);
        },

        send: function(args) {
            var copied = angular.copy(args);
            copied.sid = this.$sid.getSid();
            return this.$ds.send(copied);
        }
    });

    TC.Connection = TC.Class(TC.Observable, {
        init: function ($ds, $sid) {
            this.super();
            this.$ds = $ds;
            this.setStatus(TC.CONNECTION_STATUS.OFFLINE);
            this.$sid = $sid;
        },

        get: function(route, data, callback) {
            return this.$ds.get({
                route:route,
                data: data,
                callback: callback
            });
        },

        send: function(route, data, callback) {
            return this.$ds.send({
                route:route,
                data: data,
                callback: callback
            });
        },

        setStatus: function(status){
            this._status = status;
            this.trigger('status', [this._status]);
        },

        login: function (username, password) {
            this.send('login', {
                "username": username,
                "password": password
            }, this._onLogin.bind(this));
            this.setStatus(TC.CONNECTION_STATUS.AUTHENTICATING);
        },
        register: function(username, password) {
            this.send('register', {
                'username': username,
                'password': password
            })
        },
        _onLogin: function(data) {
            if (data.sid) {
                this.$sid.setSid(data.sid);
            }
            this.setStatus(TC.CONNECTION_STATUS.AUTHENTICATED);
            console.log("Login response", data);
        }
    });



})();
