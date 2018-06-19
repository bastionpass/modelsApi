import { initializeInject, inject, InjectionMap, getInjected } from '..';

class TestInjectedClass {
}

class TestClass {
  @inject
  public testInjectedClass: TestInjectedClass;
}

describe('@inject test', () => {

  it('shouldInject', () => {
    initializeInject(new InjectionMap([]));
    const testClass = getInjected(null, TestClass);
    expect(testClass.testInjectedClass).toBeInstanceOf(TestInjectedClass);
  });
});
