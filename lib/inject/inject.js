"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInjectionWithDI = exports.getInjected = exports.initializeInject = exports.defaultInjectNamespace = exports.InjectionMap = exports.inject = void 0;
require("reflect-metadata");
const internals_1 = require("../internals");
const swagger_ts_types_1 = require("swagger-ts-types");
function inject(targetOrNamespace, propertyName, parameterIndex) {
    // If it was called as a factory, then bind namespace to the real decorator
    if (swagger_ts_types_1.isString(targetOrNamespace)) {
        return internals_1.bindArgs(classDecorator, targetOrNamespace);
    }
    // If it called as a decorator, then apply it with default namespace
    realInject(exports.defaultInjectNamespace, targetOrNamespace, propertyName, parameterIndex);
}
exports.inject = inject;
class InjectionMap {
    constructor(initialInjections) {
        this.map = new Map(initialInjections);
    }
    get(injectionConstructor) {
        if (!this.map.has(injectionConstructor)) {
            this.map.set(injectionConstructor, createInjectionWithDI(injectionConstructor, this));
        }
        return this.map.get(injectionConstructor);
    }
}
exports.InjectionMap = InjectionMap;
exports.defaultInjectNamespace = 'defaultInjectNamespace';
const injections = {};
function initializeInject(injectionMap, namespace = exports.defaultInjectNamespace) {
    injections[namespace] = injectionMap;
}
exports.initializeInject = initializeInject;
function realInject(namespace, target, propertyName, parameterIndex) {
    if (propertyName && parameterIndex === void 0) {
        return propertyDecorator(target, propertyName);
    }
    if (!propertyName && parameterIndex !== void 0) {
        return parameterDecorator(target, parameterIndex);
    }
    if (!propertyName && !parameterIndex) {
        return classDecorator(namespace, target);
    }
    throw new internals_1.CoreError(`Inject decorator must be applied to a class, a property, ` +
        `or to a constructor parameter only ${target}`);
}
function classDecorator(namespace, target) {
    if (!swagger_ts_types_1.isObject(target) || !target.constructor) {
        throw new internals_1.CoreError(`@inject decorator should be applied to a class only. ${target}`);
    }
    target.prototype.injectionNamespace = namespace;
}
// React.Component property decorator
function propertyDecorator(target, propertyName) {
    if (!swagger_ts_types_1.isObject(target) || !target.constructor) {
        throw new internals_1.CoreError(`Injection must be applied to a class property only ${target}`);
    }
    const targetConstructor = target.constructor;
    const injectionConstructor = Reflect.getMetadata('design:type', target, propertyName);
    checkInjectionType(target, injectionConstructor, propertyName);
    Object.defineProperty(target, propertyName, {
        get() {
            const injectionNamespace = target.injectionNamespace || exports.defaultInjectNamespace;
            if (!(injections[injectionNamespace] instanceof InjectionMap)) {
                throw new internals_1.CoreError(`Please, initialize injections with initializeInject()` +
                    ` for ${injectionNamespace} namespace. ${target.constructor.name}`);
            }
            return injections[injectionNamespace].get(injectionConstructor);
        },
    });
}
/**
 * Manual getting injection
 * @param {string | Object} namespaceOrObject
 * @param {WithConstructor<T>} injectionConstructor
 * @return {T}
 */
function getInjected(namespaceOrObject, injectionConstructor) {
    let injectionNamespace;
    if (swagger_ts_types_1.isObject(namespaceOrObject)) {
        if (!namespaceOrObject.injectionNamespace) {
            injectionNamespace = exports.defaultInjectNamespace;
        }
        else {
            injectionNamespace = namespaceOrObject.injectionNamespace;
        }
    }
    else {
        injectionNamespace = namespaceOrObject ? String(namespaceOrObject) : exports.defaultInjectNamespace;
    }
    if (!(injections[injectionNamespace] instanceof InjectionMap)) {
        throw new internals_1.CoreError(`Please, initialize injections with initializeInject()` +
            ` for ${injectionNamespace} namespace.`);
    }
    return injections[injectionNamespace].get(injectionConstructor);
}
exports.getInjected = getInjected;
// Name of metadata (to obtain via Reflect.getMetadata) that contained indices of all injected parameters for a method
const injectedParameterMetadataName = 'injectedParameterMetadataName';
// Class constructor decorator
function parameterDecorator(target, parameterIndex) {
    // Get all previously injected to the method parameters if has any
    const injectedParameters = Reflect.getMetadata(injectedParameterMetadataName, target) || [];
    // Get all the method parameters types
    const parametersTypes = Reflect.getMetadata('design:paramtypes', target);
    // Check, whether we can inject parameter of this type
    checkInjectionType(target, parametersTypes[parameterIndex], parameterIndex);
    injectedParameters.push(parameterIndex);
    // Define metadata of special name, which later will be created
    // and sent to target constructor (via resolveDependencies)
    Reflect.defineMetadata(injectedParameterMetadataName, injectedParameters, target);
}
/**
 * Creating a new injection instance with resolving all @inject decorated dependencies till the very bottom
 * @param {WithConstructor<any>} injectionConstructor
 * @param {InjectionMap} injectionMap
 * @return {WithConstructor<any>}
 */
function createInjectionWithDI(injectionConstructor, injectionMap) {
    const resolvedDependencies = resolveDependencies(injectionConstructor, injectionMap)
        .map(dependency => injectionMap.get(dependency));
    return new injectionConstructor(...resolvedDependencies);
}
exports.createInjectionWithDI = createInjectionWithDI;
/**
 * Return array of all injected dependensies of injectionConstructor
 * @param {WithConstructor<any>} injectionConstructor
 * @param {InjectionMap} injectionMap
 * @return {WithConstructor<any>[]}
 */
function resolveDependencies(injectionConstructor, injectionMap, visitedInjections = new Set()) {
    const injectedCtorParameters = Reflect.getMetadata(injectedParameterMetadataName, injectionConstructor) || [];
    const constructorParameters = Reflect.getMetadata('design:paramtypes', injectionConstructor);
    if (injectedCtorParameters.length === 0) {
        return [];
    }
    const resolvedDependencies = [];
    visitedInjections.add(injectionConstructor);
    injectedCtorParameters.sort().forEach((parameter) => {
        const constructorParameter = constructorParameters[parameter];
        // Before creating an inhection, we must check that there are no circular dependencies
        if (!injectionMap.get(constructorParameter)) {
            if (visitedInjections.has(injectionConstructor)) {
                const chains = Array.from(visitedInjections.values()).map(dependency => dependency.name).join(' -> ');
                throw new internals_1.CoreError(`Cyclic dependencies are found: "${chains}"`);
            }
            resolveDependencies(constructorParameter, injectionMap, visitedInjections);
        }
        resolvedDependencies.push(constructorParameter);
    });
    visitedInjections.delete(injectionConstructor);
    return resolvedDependencies;
}
function checkInjectionType(target, injectedType, propName) {
    const targetName = target.name || (target.constructor && target.constructor.name);
    if (!(injectedType && 'constructor' in injectedType)) {
        throw new internals_1.CoreError(`Injected type should be a class, but \'${injectedType}\' on ${targetName} ${propName}. ` +
            'Check if you have a circular injection.');
    }
    if (/\{\s*\[native code\]\s*\}/.test(`${injectedType}`)) {
        throw new internals_1.CoreError(`Cannot inject native objects ${injectedType} on ${targetName} ${propName}`);
    }
    return true;
}
