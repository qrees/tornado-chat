///<reference path="../references.ts"/>

module TC.utils {

    export interface Listener {
        (event: Event): void;
    }

    export class Event {
        constructor(){

        }
    }

    export class EventDispatcher {
        private _listeners: {[key: string]: Listener} = {};
        private _listener_id: number = 0;

        isRegistered(identifier: string): boolean{
            return identifier in this._listeners;
        }

        register(listener: Listener): string {
            var identifier: string = this._listener_id.toString(10);
            this._listeners[identifier] = listener;
            this._listener_id++;
            return identifier;
        }

        unregister(identifier: string): void {
            if(!(this.isRegistered(identifier))){
                console.error("Cannot unregister ", identifier);
                throw new Error("Cannot unregister " + identifier + " because it's not registered");
            }
            delete this._listeners[identifier];
        }

        trigger(event: Event): void {
            var key: string;
            for(key in this._listeners){
                if(this._listeners.hasOwnProperty(key))
                    this._listeners[key](event);
            }
        }
    }
}