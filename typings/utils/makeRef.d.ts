/// <reference types="react" />
declare type RefHandler = (instance: React.ReactInstance) => any;
/**
 * Creates React.Component ref handler and memoize it
 * E.g. <input ref={makeRefHandler(this, "inputRef")}/>
 * @param {T} source
 * @param {keyof T} bindProperty
 * @return {V | undefined}
 */
export declare function makeRefHandler<T>(source: T, bindProperty: keyof T): RefHandler | undefined;
export {};
