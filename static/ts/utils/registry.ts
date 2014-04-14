///<reference path="../references.ts"/>

module TC.utils {

    export class ListRegistry<T> {
        private items: T[] = [];

        register(item: T){
            if (this.items.indexOf(item) >= 0){
                throw Error("Item"+ item + "already exists in " + this);
            }
            this.items.push(item);
        }

        getItems(): T[] {
            return this.items.slice(0);
        }
    }
}