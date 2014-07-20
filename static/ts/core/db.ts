///<reference path="../references.ts"/>

module TC {

    export interface Mapping {[key: string]: any}
    export class Filters {
        asDict():Mapping {
            return {};
        }
    }

    export class DB {
        private dataSource: TC.data_source.DataSource;
        public events: {[key: string]: TC.utils.EventDispatcher} = {};
        private _objCache: {
            [resource: string]: {
                [id: string]: Model
            }
        }
        private modelRegistry: TC.ModelRegistry;
        public onChangedEvent: TC.utils.EventDispatcher = new TC.utils.EventDispatcher();

        constructor(dataSource: TC.data_source.DataSource, modelRegistry: TC.ModelRegistry){
            this.dataSource = dataSource;
            this.modelRegistry = modelRegistry;
            this.events['unauthorized'] = new TC.utils.EventDispatcher();
            this._objCache = {};
        }

        stream(resource: string): TC.Stream{
            var model_factory: TC.ModelFactory = this.modelRegistry.getModel(resource);
            return new TC.Stream(this, model_factory);
        }

        addItem(resource: string, data: Mapping): ng.IPromise<TC.rest.RestResponse> {
            TC.utils.assert(data !== undefined, "'data' cannot be undefined");
            var request: TC.rest.RestRequest = new TC.rest.RestRequest(
                resource, data, TC.rest.RestActionType.SEND
            );
            var ws_deferred: ng.IPromise<TC.rest.RestResponse> = this.dataSource.send(request);

            ws_deferred.then(this._handleAddResult.bind(this));
            return ws_deferred;
        }

        private _handleAddResult(response: TC.rest.RestResponse) {
            // TODO
            throw new Error("Not yet implemented");
        }

        runQuery(resource: string, filters: Filters): ng.IPromise<TC.rest.RestResponse>  {
            var request: TC.rest.RestRequest = new TC.rest.RestRequest(
                resource,
                filters.asDict(),
                TC.rest.RestActionType.GET
            );
            var ws_deferred: ng.IPromise<TC.rest.RestResponse> = this.dataSource.get(request);
            console.log("runQuery", ws_deferred);
            ws_deferred.then(this._handleQueryResult.bind(this));
            return ws_deferred;
        }

        public getModel(resource: string, id: string): Model {
            var resources: { [id: string]: Model };
            var model: Model;
            if (!(resource in this._objCache)) {
                throw new Error("Missing resource: " + resource);
            } else {
                resources = this._objCache[resource];
            }

            if (!(id in resources)) {
                throw new Error("Missing model in resource: " + resource + " " + id);
            } else {
                model = resources[id];
            }
            return model;
        }

        public getOrCreateModel(resource: string, id: string, value: Mapping): Model {
            var resources: { [id: string]: Model };
            var model: Model;
            if (!(resource in this._objCache)) {
                resources = {};
                this._objCache[resource] = resources;
            } else {
                resources = this._objCache[resource];
            }

            if (!(id in resources)) {
                var model_factory: TC.ModelFactory = this.modelRegistry.getModel(resource);
                model = model_factory.create(value);
                resources[model.getId()] = model;
            } else {
                model = resources[id];
                model.update(value);
            }
            return model;
        }

        private _handleQueryResult(value: TC.rest.RestResponse){

            if (value.getStatus() === TC.rest.ResponseStatus.STATUS_UNAUTHORIZED){
                console.warn("Received response with not ok status", value);
                this.events['unauthorized'].trigger(new TC.utils.Event());
                return;
            }

            if (value.getStatus() === TC.rest.ResponseStatus.STATUS_OK){
                var data: any[] = value.getBody(); // FIXME : 'any' type

                if (!angular.isArray(data)) {
                    throw new Error("Expected array in response");
                }

                angular.forEach(data, (value: any) => { // FIXME : 'any' type
                    var id = value.$id;
                    var resource = value.$resource;
                    if (id === undefined || resource === undefined){
                        console.error("missing $id or $resource from data", value);
                        throw new Error("missing $id or $resource from data");
                    }
                    var model: TC.Model = this.getOrCreateModel(resource, id, value);
                });
                return;
            }

            throw new Error("Unsupported status: " + value.getStatus());
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
        private type: new(value: Mapping, factory: ModelFactory) => TC.Model;

        constructor(name: string, type: new() => TC.Model){
            if (type === null || type === undefined){
                throw Error("ModelFactory type argument cannot be null or undefined");
            }

            this.type = type;
            this.name = name;
        }

        create(value: Mapping): TC.Model {
            return new this.type(value, this);
        }
    }

    export class Model {
        private resource: string;
        private id: string;
        private $factory: ModelFactory;

        constructor(value: Mapping, factory: ModelFactory){ // FIXME : Mapping type is almost the as 'any'
            this.$factory = factory;
            this.update(value);
        }

        public update(value: Mapping): void {
            if(value['$resource'] != this.$factory.name) {
                throw new Error("Invalid resource for factory: " + value['$resource'] + " expected: " + this.$factory.name);
            }
            this.id = value['$id'];
            this.resource = value['$resource'];
        }

        public getId(): string {
            return this.id;
        }

    }

    export class Stream {
        private _db: TC.DB;
        private _factory: TC.ModelFactory;
        private _filters: Filters;
        public events: {
            [key: string]: TC.utils.EventDispatcher
        } = {};
        objects: TC.Model[];

        constructor(db: TC.DB, factory: TC.ModelFactory){
            this._db = db;
            this._factory = factory;
            this._filters = new Filters();
            this.events['unauthorized'] = new TC.utils.EventDispatcher();
            this.objects = [];
        }

        load():void{
            this._db.runQuery(
                this.resourceName(),
                this.getFilters()
            ).then(this._handleQueryResult.bind(this));
        }

        addItem(data: Mapping): ng.IPromise<TC.rest.RestResponse> {
            TC.utils.assert(data !== undefined, "'data' cannot be undefined");
            var ws_deferred: ng.IPromise<TC.rest.RestResponse> = this._db.addItem('resource.' + this._factory.name, data);
            ws_deferred.then(this._handleAddResult.bind(this));
            return ws_deferred;
        }

        resourceName(): string {
            return 'resource.' + this._factory.name;
        }

        pushObject(object: TC.Model): void {
            this.objects.push(object);
        }

        getFilters(): Filters {
            return this._filters;
        }

        private _handleAddResult(value: TC.rest.RestResponse){
            // TODO
        }

        private _handleQueryResult(value: TC.rest.RestResponse){

            if (value.getStatus() === TC.rest.ResponseStatus.STATUS_UNAUTHORIZED){
                console.warn("Received response with not ok status", value);
                this.events['unauthorized'].trigger(new TC.utils.Event());
                return;
            }

            if (value.getStatus() === TC.rest.ResponseStatus.STATUS_OK){
                var data: any[] = value.getBody(); // FIXME : 'any' type
                console.info("Received stream", data);

                if (!angular.isArray(data)) {
                    throw new Error("Expected array in response");
                }

                angular.forEach(data, (value: any) => { // FIXME : 'any' type
                    var id = value.$id;
                    var resource = value.$resource;
                    if (id === undefined || resource === undefined){
                        console.error("missing $id or $resource from data", value);
                        throw new Error("missing $id or $resource from data");
                    }
                    var model: TC.Model = this._db.getModel(resource, id);
                    this.pushObject(model);
                });
                return;
            }

            throw new Error("Unsupported status: " + value.getStatus());
        }
    }
}