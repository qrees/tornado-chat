(function () {
    "use strict";

    TC.CONNECTION_STATUS = {
        'OFFLINE': 'offline',
        'CONNECTING': 'connecting',
        'CONNECTED': 'connected',
        'AUTHENTICATING': 'authenticating',
        'AUTHENTICATED': 'authenticated'
    };
//
//    TC.SessionStorage = TC.Class(TC.Object, {
//        _sid: null,
//        init: function(){
//           this._sid = localStorage.getItem('sid');
//        },
//        setSid: function(sid){
//            localStorage.setItem('sid', sid);
//            this._sid = sid;
//        },
//        getSid: function(){
//            return  this._sid;
//        }
//    });
//
//    TC.SidDataSource = TC.Class(TC.DataSource, {
//        init: function($ws, $sid) {
//            this.$ws = $ws;
//            this.$sid = $sid;
//        },
//
//        open: function(path) {
//            return this.$ws.open(path);
//        },
//
//        get: function(args) {
//            var copied = angular.copy(args);
//            copied.sid = this.$sid.getSid();
//            copied.action = 'get';
//            return this.$ws.send(copied);
//        },
//
//        send: function(args) {
//            var copied = angular.copy(args);
//            copied.sid = this.$sid.getSid();
//            copied.action = 'send';
//            return this.$ws.send(copied);
//        }
//    });

    TC.Connection = TC.Class(TC.Observable, {
        init: function ($ds, $sid, $rootScope) {
            this.super();
            this.$ds = $ds;
            this.setStatus(TC.CONNECTION_STATUS.OFFLINE);
            this.$sid = $sid;
            this.$rootScope = $rootScope;
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
            var that = this;
            this.send('login', {
                "username": username,
                "password": password
            }, function(){
                var args = arguments;
                that.$rootScope.$apply(function(){
                    that._onLogin.apply(that, args);
                });
            });
            this.setStatus(TC.CONNECTION_STATUS.AUTHENTICATING);
        },
        register: function(username, password) {
            this.send('register', {
                'username': username,
                'password': password
            })
        },
        _onLogin: function(data) {
            if (data.body.sid) {
                this.$sid.setSid(data.body.sid);
                this.setStatus(TC.CONNECTION_STATUS.AUTHENTICATED);
            }else{
                this.setStatus(TC.CONNECTION_STATUS.OFFLINE);
            }
            console.log("Login response", data);
        }
    });



})();
