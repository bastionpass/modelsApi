import * as React from 'react';
import 'reflect-metadata';
import { CoreError, bindArgs } from '../internals';
import { isObject, isString } from 'swagger-ts-types';

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
export function inject(namespace: string): <T extends Object>(target: T) => void;
export function inject<T extends Object>(targetClass: T): void;
export function inject<T extends Object>(targetClass: T, propertyName: string): void;
export function inject<T extends Object>(targetClass: T, propertyName: string, parameterIndex: number): void;
export function inject(targetOrNamespace: any, propertyName?: string | any, parameterIndex?: number):
  void | (<T extends Object>(target: T) => void) {
  // If it was called as a factory, then bind namespace to the real decorator
  if (isString(targetOrNamespace)) {
    return bindArgs(classDecorator, targetOrNamespace);
  }
  // If it called as a decorator, then apply it with default namespace
  realInject(defaultInjectNamespace, targetOrNamespace, propertyName, parameterIndex);
}

export interface WithConstructor<T> {
  new(...args: any[]): T;
}

export class InjectionMap {
  protected map: Map<WithConstructor<any>, any>;

  constructor(initialInjections: [WithConstructor<any>, any][]) {
    this.map = new Map(initialInjections);
  }

  public get<T>(injectionConstructor: WithConstructor<T>): any {
    if (!this.map.has(injectionConstructor)) {
      this.map.set(injectionConstructor, createInjectionWithDI(injectionConstructor, this));
    }
    return this.map.get(injectionConstructor);
  }
}

export const defaultInjectNamespace = 'defaultInjectNamespace';
const injections: {[key: string]: InjectionMap} = {};

export function initializeInject(injectionMap: InjectionMap, namespace: string = defaultInjectNamespace) {
  injections[namespace] = injectionMap;
}

interface DecoratedClass {
  injectionNamespace: string;
}

function realInject(namespace: string, target: any, propertyName: string, parameterIndex?: number) {

  if (propertyName && parameterIndex === void 0) {
    return propertyDecorator(target, propertyName);
  }

  if (!propertyName && parameterIndex !== void 0) {
    return parameterDecorator(target, parameterIndex);
  }

  if (!propertyName && !parameterIndex) {
    return classDecorator(namespace, target);
  }

  throw new CoreError(`Inject decorator must be applied to a class, a property, ` +
    `or to a constructor parameter only ${target}`);
}

function classDecorator(namespace: string, target: any): void {
  if (!isObject(target) || !target.constructor) {
    throw new CoreError(`@inject decorator should be applied to a class only. ${target}`);
  }

  target.prototype.injectionNamespace = namespace;
}

// React.Component property decorator
function propertyDecorator(target: any, propertyName: string) {
  if (!isObject(target) || !target.constructor) {
    throw new CoreError(`Injection must be applied to a class property only ${target}`);
  }
  const targetConstructor = target.constructor;
  const injectionConstructor = Reflect.getMetadata('design:type', target, propertyName);

  checkInjectionType(target, injectionConstructor);

  Object.defineProperty(target, propertyName, {
    get() {
      const injectionNamespace = target.injectionNamespace || defaultInjectNamespace;
      if (!(injections[injectionNamespace] instanceof InjectionMap)) {
        throw new CoreError(`Please, initialize injections with initializeInject()` +
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
export function getInjected<T>(namespaceOrObject: string | Object | null | undefined, injectionConstructor: WithConstructor<T>): T {
  let injectionNamespace: string;

  if (isObject(namespaceOrObject)) {
    if (!(namespaceOrObject as any).injectionNamespace) {
      injectionNamespace = defaultInjectNamespace;
    } else {
      injectionNamespace = (namespaceOrObject as any).injectionNamespace;
    }
  } else {
    injectionNamespace = namespaceOrObject ? String(namespaceOrObject) : defaultInjectNamespace;
  }

  if (!(injections[injectionNamespace] instanceof InjectionMap)) {
    throw new CoreError(`Please, initialize injections with initializeInject()` +
      ` for ${injectionNamespace} namespace.`);
  }
  return injections[injectionNamespace].get(injectionConstructor);
}

// Name of metadata (to obtain via Reflect.getMetadata) that contained indices of all injected parameters for a method
const injectedParameterMetadataName = 'injectedParameterMetadataName';

// Class constructor decorator
function parameterDecorator(target: any, parameterIndex: number) {

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
export function createInjectionWithDI(injectionConstructor: WithConstructor<any>, injectionMap: InjectionMap) {
  const resolvedDependencies = resolveDependencies(injectionConstructor, injectionMap)
    .map(dependency => injectionMap.get(dependency));
  return new injectionConstructor(...resolvedDependencies);
}

/**
 * Return array of all injected dependensies of injectionConstructor
 * @param {WithConstructor<any>} injectionConstructor
 * @param {InjectionMap} injectionMap
 * @return {WithConstructor<any>[]}
 */
function resolveDependencies(injectionConstructor: WithConstructor<any>,
                             injectionMap: InjectionMap,
                             visitedInjections: Set<WithConstructor<any>> = new Set()): WithConstructor<any>[] {

  const injectedCtorParameters: number[] =
    Reflect.getMetadata(injectedParameterMetadataName, injectionConstructor) || [];
  const constructorParameters: any[] = Reflect.getMetadata('design:paramtypes', injectionConstructor);

  if (injectedCtorParameters.length === 0) {
    return [];
  }

  const resolvedDependencies: WithConstructor<any>[] = [];

  visitedInjections.add(injectionConstructor);

  injectedCtorParameters.sort().forEach((parameter) => {
    const constructorParameter = constructorParameters[parameter];

    // Before creating an inhection, we must check that there are no circular dependencies
    if (!injectionMap.get(constructorParameter)) {
      if (visitedInjections.has(injectionConstructor)) {
        const chains = Array.from(visitedInjections.values()).map(dependency => dependency.name).join(' -> ');
        throw new CoreError(`Cyclic dependencies are found: "${chains}"`);
      }
      resolveDependencies(constructorParameter, injectionMap, visitedInjections);
    }
    resolvedDependencies.push(constructorParameter);
  });

  visitedInjections.delete(injectionConstructor);

  return resolvedDependencies;
}

function checkInjectionType(target: any, injectedType: any): injectedType is React.Component {
  if (!(injectedType && 'constructor' in injectedType)) {
    throw new CoreError(`Injected type should be a class, but \'${injectedType}\' on ${target.name}. ` +
    'Check if you have a circular injection.');
  }
  if (/\{\s*\[native code\]\s*\}/.test(`${injectedType}`)) {
    throw new CoreError(`Cannot inject native objects ${injectedType} on ${target}`);
  }

  return true;
}
