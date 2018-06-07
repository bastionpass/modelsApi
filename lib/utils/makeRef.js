"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mobx_1 = require("mobx");
const refsStorage = new WeakMap();
/**
 * Creates React.Component ref handler and memoize it
 * E.g. <input ref={makeRefHandler(this, "inputRef")}/>
 * @param {T} source
 * @param {keyof T} bindProperty
 * @return {V | undefined}
 */
function makeRefHandler(source, bindProperty) {
    let refBindPropertyMap = refsStorage.get(source);
    if (!refBindPropertyMap) {
        refBindPropertyMap = new Map();
        refsStorage.set(source, refBindPropertyMap);
    }
    if (!refBindPropertyMap.has(bindProperty)) {
        refBindPropertyMap.set(bindProperty, mobx_1.action((instance) => {
            source[bindProperty] = instance;
        }));
    }
    return refBindPropertyMap.get(bindProperty);
}
exports.makeRefHandler = makeRefHandler;
