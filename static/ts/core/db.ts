///<reference path="../references.ts"/>

module TC {

    export interface Mapping {[key: string]: any}
    export class Filters {
        asDict():Mapping {
            return {};
        }
    }

    export class DB {
        public dataSource: TC.data_source.DataSource;
        private modelRegistry: TC.ModelRegistry;
        public onChangedEvent: TC.utils.EventDispatcher = new TC.utils.EventDispatcher();

        constructor(dataSource: TC.data_source.DataSource, modelRegistry: TC.ModelRegistry){
            this.dataSource = dataSource;
            this.modelRegistry = modelRegistry;
        }

        stream(model_name: string): TC.Stream{
            var model_factory: TC.ModelFactory = this.modelRegistry.getModel(model_name);
            return new TC.Stream(this, model_factory);
        }
    }

    export class ModelRegistry {
        private factory_registry: {[model_name: string]: TC.ModelFactory} = {};

        getModel(model_name: string): TC.ModelFactory {
            if (!(model_name in this.factory_registry)) {
                throw new Error(model_name + " was not registered as model");
            }

            return this.factory_registry[model_name];
        }

        registerModel(model_class: TC.ModelFactory) {
            var model_name: string = model_class.name;
            if (model_name in this.factory_registry) {
                throw new Error(model_name + " was already registered as model");
            }

            this.factory_registry[model_name] = model_class;
        }
    }

    export class ModelFactory {
        public name: string;
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
        constructor(value: Mapping){ // FIXME : Mapping type is almost the as 'any'
            // TODO: copy values
        }
    }

    export class Stream {
        private _db: TC.DB;
        private _factory: TC.ModelFactory;
        private _filters: Filters;
        objects: TC.Model[];

        constructor(db: TC.DB, factory: TC.ModelFactory){
            this._db = db;
            this._factory = factory;
            this._filters = new Filters();
        }

        load():void{
            this.runQuery();
        }

        addItem(data: Mapping): ng.IPromise<TC.rest.RestResponse> {
            TC.utils.assert(data !== undefined, "'data' cannot be undefined");
            var request: TC.rest.RestRequest = new TC.rest.RestRequest(
                'resource.' + this._factory.name,
                data,
                TC.rest.RestActionType.SEND
            );
            var ws_deferred: ng.IPromise<TC.rest.RestResponse> = this._db.dataSource.send(request);

            ws_deferred.then(this._handleAddResult);
            return ws_deferred;
        }

        runQuery(): ng.IPromise<TC.rest.RestResponse> {
            var request: TC.rest.RestRequest = new TC.rest.RestRequest(
                'resource.' + this._factory.name,
                this.getFilters().asDict(),
                TC.rest.RestActionType.GET
            );
            var ws_deferred: ng.IPromise<TC.rest.RestResponse> = this._db.dataSource.get(request);
            console.log("runQuery", ws_deferred);
            ws_deferred.then(this._handleQueryResult);
            return ws_deferred;
        }

        pushObject(object: TC.Model){
            this.objects.push(object);
        }

        getFilters(): Filters{
            return this._filters;
        }

        private _handleAddResult(value: TC.rest.RestResponse){

        }

        private _handleQueryResult(value: TC.rest.RestResponse){
            var data: any[] = value.getBody(); // FIXME : 'any' type
            console.log(value);
            // TODO : handle invalid reposnse

            if (!angular.isArray(data)) {
                throw new Error("Expected array in response");
            }

            angular.forEach(data, (value: any) => { // FIXME : 'any' type
                var entity: TC.Model = this._factory.create(value);
                this.pushObject(entity);
            });
        }
    }
}