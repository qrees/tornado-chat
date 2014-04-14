///<reference path="../references.ts"/>

module TC {

    export interface Mapping {[key: string]: any}

    export class DataSource {
        open(){
            throw Error("Not implemented");
        }

        get(payload: Mapping): any{
            throw Error("Not implemented");
        }

        send(payload: Mapping){
            throw Error("Not implemented");
        }
    }

    export class DB {
        public dataSource: TC.DataSource;
        private modelRegistry: TC.ModelRegistry;
        public onChangedEvent: TC.utils.EventDispatcher = new TC.utils.EventDispatcher();

        constructor(dataSource: TC.DataSource, modelRegistry: TC.ModelRegistry){
            this.dataSource = dataSource;
            this.modelRegistry = modelRegistry;
        }

        stream(model_name): TC.Stream{
            var model_factory = this.modelRegistry.getModel(model_name);
            return new TC.Stream(this, model_factory);
        }
    }

    export class ModelRegistry {
        private factory_registry: {[model_name: string]: TC.ModelFactory};
        constructor(){
            this.factory_registry = {};
        }

        getModel(model_name: string) {
            if (!(model_name in this.factory_registry)) {
                throw new Error(model_name + " was not registered as model");
            }

            return this.factory_registry[model_name];
        }

        registerModel(model_class: TC.ModelFactory) {
            var model_name = model_class.name;
            if (model_name in this.factory_registry) {
                throw new Error(model_name + " was already registered as model");
            }

            this.factory_registry[model_name] = model_class;
        }
    }

    export class ModelFactory {
        name: string;
        private type: new(value: Mapping) => TC.Model;

        constructor(name: string, type: new() => TC.Model){
            if (type === null || type === undefined){
                throw Error("ModelFactory type argument cannot be null or undefined");
            }

            this.type = type;
            this.name = name;
        }

        create(value: Mapping): TC.Model {
            return new this.type(value);
        }
    }

    export class Model {
        constructor(value: Mapping){
            // TODO: copy values
        }
    }

    export class Stream {
        private _db: TC.DB;
        private _factory: TC.ModelFactory;
        objects: TC.Model[];

        constructor(db: TC.DB, factory: TC.ModelFactory){
            this._db = db;
            this._factory = factory;
        }

        load(){
            this.runQuery();
        }

        runQuery(){
            var ws_deferred = this._db.dataSource.get({
                'route': 'resource.' + this._factory.name,
                'data': this.getParams()
            });
            console.log("runQuery", ws_deferred);
            ws_deferred.then(this._handleQueryResult);
            return ws_deferred;
        }

        pushObject(object: TC.Model){
            this.objects.push(object);
        }

        getParams(): Mapping{
            return {};
        }

        private _handleQueryResult(value: Mapping){
            var data = value['body'];
            console.log(value);
            if (!angular.isArray(data)) {
                throw new Error("Expected array in response");
            }

            angular.forEach(data, (value) => {
                var entity = this._factory.create(value);
                this.pushObject(entity);
            });
        }
    }
}