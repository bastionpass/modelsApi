import { action } from 'mobx';

const refsStorage = new WeakMap<Object, Map<string, RefHandler>>();

type RefHandler = (instance: React.ReactInstance) => any;

/**
 * Creates React.Component ref handler and memoize it
 * E.g. <input ref={makeRefHandler(this, "inputRef")}/>
 * @param {T} source
 * @param {keyof T} bindProperty
 * @return {V | undefined}
 */
export function makeRefHandler<T>(source: T, bindProperty: keyof T) {
  let refBindPropertyMap = refsStorage.get(source);

  if (!refBindPropertyMap) {
    refBindPropertyMap = new Map<string, RefHandler>()
    refsStorage.set(source, refBindPropertyMap);
  }

  if (!refBindPropertyMap.has(bindProperty as string)) {
    refBindPropertyMap.set(bindProperty as string, action((instance: React.ReactInstance) => {
      (source as any)[bindProperty] = instance;
    }));
  }

  return refBindPropertyMap.get(bindProperty as string);
}
