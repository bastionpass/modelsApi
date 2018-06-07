import 'reflect-metadata';
/**
 * Decorator (or decorator factory, if the first parameter is a string)
 * At first it should be applied to a class itself,
 *
 * @inject // all injects in this class should be taken from default namespace
 * class MyClass {
 *  @inject protected otherService: OtherService; // Inject OtherService from default namespace
 * }
 *
 * or
 *
 * @inject('myNamespace') // all injects will be done from 'myNamespace'
 * class MyClass {
 *  @inject protected otherService: OtherService; // Inject OtherService from myNamespace
 * }
 *
 * !injects in ctor will be taken from a namespace of a owner of injected object!
 *
 * @param target - If is a string, then it's a namespace to which injector will be boud to, if an object then
 * @param {string} propertyName
 * @param {number} parameterIndex
 * @return {any}
 */
export declare function inject(namespace: string): <T extends Object>(target: T) => void;
export declare function inject<T extends Object>(targetClass: T): void;
export declare function inject<T extends Object>(targetClass: T, propertyName: string): void;
export declare function inject<T extends Object>(targetClass: T, propertyName: string, parameterIndex: number): void;
export interface WithConstructor<T> {
    new (...args: any[]): T;
}
export declare class InjectionMap {
    protected map: Map<WithConstructor<any>, any>;
    constructor(initialInjections: [WithConstructor<any>, any][]);
    get<T>(injectionConstructor: WithConstructor<T>): any;
}
export declare const defaultInjectNamespace = "defaultInjectNamespace";
export declare function initializeInject(injectionMap: InjectionMap, namespace?: string): void;
/**
 * Manual getting injection
 * @param {string | Object} namespaceOrObject
 * @param {WithConstructor<T>} injectionConstructor
 * @return {T}
 */
export declare function getInjected<T>(namespaceOrObject: string | Object, injectionConstructor: WithConstructor<T>): T;
/**
 * Creating a new injection instance with resolving all @inject decorated dependencies till the very bottom
 * @param {WithConstructor<any>} injectionConstructor
 * @param {InjectionMap} injectionMap
 * @return {WithConstructor<any>}
 */
export declare function createInjectionWithDI(injectionConstructor: WithConstructor<any>, injectionMap: InjectionMap): any;
