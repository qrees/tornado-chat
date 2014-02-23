(function() {


    TC.Table = TC.Class(TC.Object, {
        name: null,
        init: function($ds) {
            this.super();
            if (this.name === null) {
                throw new Error("You need to privade name for a table.");
            }
            this.$dataSource = $ds;
        },
        query: function() {
            return TC.Query.create(this);
        },
        _handleQueryResult: function(query, value) {
            var data = value.data;
            if (!angular.isArray(data)) {
                throw new Error("Expected array in response");
            }


            angular.forEach(data, function(value) {
                var entity = this.getEntity(value);
                query.pushEntity(entity);
            }, this);
        },
        getEntity: function(data) {
            // TODO: return existing entity if it's available or new one.
            return TC.Entity.create();
        },
        runQuery: function(query) {
            var ws_deferred = this.$dataSource.get({
                'route': 'resource.' + this.name,
                'data': query.getParams()
            });

            ws_deferred.then(this._handleQueryResult.bind(this).curry(query));
            return query;
        }
    });

    TC.Entity = TC.Class(TC.Object, {

    });

    var _table_factory_registry = {

    };

    var _table_factory_cache = {

    };

    TC.TableFactory = TC.Class(TC.Object, {
        getTable: function(model_name) {
            if (!(model_name in _table_factory_registry)) {
                throw new Error(model_name + " was not registered as model");
            }

            if (!(model_name in _table_factory_cache)) {
                _table_factory_cache[model_name] = _table_factory_registry[model_name].create();
            }

            return _table_factory_cache[model_name];
        },
        registerTable: function(model_name, model_class) {
            if (model_name in _table_factory_registry) {
                throw new Error(model_name + " was already registered as model");
            }

            _table_factory_registry[model_name] = model_class;
        }
    });

    TC.Query = TC.Class(TC.Object, {
        init: function(table) {
            this.super();
            this._table = table;
            this._params = {};
            this._entities = [];
        },
        load: function() {
            return this._table.runQuery(this);
        },
        items: function() {
//            return this._table.runQuery(this);
            return this._entities;
        },
        getParams: function() {
            return this._params;
        },
        pushEntity: function(entity) {
            this._entities.push(entity);
        }
    });

})();