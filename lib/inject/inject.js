"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const coreError_1 = require("../coreError");
const isObject = require("lodash/fp/isObject");
const isString = require("lodash/fp/isString");
const bindFunc_1 = require("../utils/bindFunc");
function inject(targetOrNamespace, propertyName, parameterIndex) {
    // If it was called as a factory, then bind namespace to the real decorator
    if (isString(targetOrNamespace)) {
        return bindFunc_1.bindArgs(classDecorator, targetOrNamespace);
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
    throw new coreError_1.CoreError(`Inject decorator must be applied to a class, a property, ` +
        `or to a constructor parameter only ${target}`);
}
function classDecorator(namespace, target) {
    if (!isObject(target) || !target.constructor) {
        throw new coreError_1.CoreError(`@inject decorator should be applied to a class only. ${target}`);
    }
    target.prototype.injectionNamespace = namespace;
}
// React.Component property decorator
function propertyDecorator(target, propertyName) {
    if (!isObject(target) || !target.constructor) {
        throw new coreError_1.CoreError(`Injection must be applied to a class property only ${target}`);
    }
    const targetConstructor = target.constructor;
    const injectionConstructor = Reflect.getMetadata('design:type', target, propertyName);
    checkInjectionType(target, injectionConstructor);
    Object.defineProperty(target, propertyName, {
        get() {
            if (!target.injectionNamespace) {
                throw new coreError_1.CoreError(`Please decorate a class with @inject before decorating a property` +
                    ` or a ctor parameter ${target.constructor.name}`);
            }
            if (!(injections[target.injectionNamespace] instanceof InjectionMap)) {
                throw new coreError_1.CoreError(`Please, initialize injections with initializeInject()` +
                    ` for ${target.injectionNamespace} namespace. ${target.constructor.name}`);
            }
            return injections[target.injectionNamespace].get(injectionConstructor);
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
    if (isObject(namespaceOrObject)) {
        if (!namespaceOrObject.injectionNamespace) {
            throw new coreError_1.CoreError(`Cannot determine namespace for ${namespaceOrObject.constructor.name}.`);
        }
        injectionNamespace = namespaceOrObject.injectionNamespace;
    }
    else {
        injectionNamespace = String(namespaceOrObject);
    }
    if (!(injections[injectionNamespace] instanceof InjectionMap)) {
        throw new coreError_1.CoreError(`Please, initialize injections with initializeInject()` +
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
    checkInjectionType(target, parametersTypes[parameterIndex]);
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
                throw new coreError_1.CoreError(`Cyclic dependencies are found: "${chains}"`);
            }
            resolveDependencies(constructorParameter, injectionMap, visitedInjections);
        }
        resolvedDependencies.push(constructorParameter);
    });
    visitedInjections.delete(injectionConstructor);
    return resolvedDependencies;
}
function checkInjectionType(target, injectedType) {
    if (!(injectedType && 'constructor' in injectedType)) {
        throw new coreError_1.CoreError(`Injected type should be a class, but \'${injectedType}\' on ${target.name}. ` +
            'Check if you have a circular injection.');
    }
    if (/\{\s*\[native code\]\s*\}/.test(`${injectedType}`)) {
        throw new coreError_1.CoreError(`Cannot inject native objects ${injectedType} on ${target}`);
    }
    return true;
}
