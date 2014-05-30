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
        private _listeners: Listener[] = [];

        isRegistered(listener: Listener): boolean{
            for (var i: number = 0; i < this._listeners.length; i++) {
                if (this._listeners[i] === listener) {
                    return true;
                }
            }
            return false;
        }

        register(listener: Listener): void {
            if (this.isRegistered(listener))
                return;

            this._listeners.push(listener);
        }

        unregister(listener: Listener): void {
            for (var i: number = 0; i < this._listeners.length; i++) {
                if (this._listeners[i] === listener) {
                    this._listeners.splice(i, 1);
                    break;
                }
            }
        }

        trigger(event: Event): void {
            for(var i: number = 0; i < this._listeners.length; i++){
                this._listeners[i](event);
            }
        }
    }
}