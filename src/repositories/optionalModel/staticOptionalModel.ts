import { computed } from 'mobx';
import {
  OptionalModel,
  OptionalModelWithOnFull,
  OptionalModelWithOnEmptyOnFull,
  OptionalModelWithOnEmpty, BaseOptionalModel,
} from '../../internals';
import { ModelWithId, isObject } from 'swagger-ts-types';

type BaseStaticOptionalModel<T extends ModelWithId> = BaseOptionalModel<T>;

export function isBaseStaticOptionalModel(arg: any): arg is BaseStaticOptionalModel<any> {
  return arg instanceof StaticOptionalModel || arg instanceof StaticOptionalModelWithOnEmpty ||
    arg instanceof StaticOptionalModelWithOnFull || arg instanceof StaticOptionalModelWithOnEmptyOnFull;
}

/**
 * Stub for dummy models, to work with them the same way as with ObservableModel
 */
export class StaticOptionalModel<T extends ModelWithId> implements OptionalModel<T>{

  constructor(protected model: T | ModelWithId | undefined | null) {}

  public onFull<FR>(onFullCallback: ((model: T) => FR)): StaticOptionalModelWithOnFull<T, FR> {
    return new StaticOptionalModelWithOnFull<T, FR>(
      this.model,
      onFullCallback,
    );
  }

  public onEmpty<ER>(onEmptyCallback: (model: ModelWithId | undefined | null) => ER):
    StaticOptionalModelWithOnEmpty<T, ER> {
    return new StaticOptionalModelWithOnEmpty<T, ER>(
      this.model,
      onEmptyCallback,
    );
  }

  public getModel(): T | ModelWithId | undefined | null {
    return this.model;
  }
}

export class StaticOptionalModelWithOnEmpty<T extends ModelWithId, ER> implements OptionalModelWithOnEmpty<T, ER>{

  constructor(protected model: T | ModelWithId | undefined | null,
              protected onEmptyCallback: (model: ModelWithId | undefined | null) => ER) {}

  public onFull<FR>(onFullCallback: ((model: T) => FR)): StaticOptionalModelWithOnEmptyOnFull<T, ER, FR> {
    return new StaticOptionalModelWithOnEmptyOnFull<T, ER, FR>(
      this.model,
      this.onEmptyCallback,
      onFullCallback,
    );
  }

  @computed
  public get result(): ER | undefined {
    return isStaticFullModel(this.model)
      ? void 0
      : this.onEmptyCallback(this.model);
  }

  public getModel(): T | ModelWithId | undefined | null {
    return this.model;
  }
}

export class StaticOptionalModelWithOnFull<T extends ModelWithId, FR> implements OptionalModelWithOnFull<T, FR> {

  constructor(protected model: T | ModelWithId | undefined | null,
              protected onFullCallback: (model: T) => FR) {}

  public onEmpty<ER>(onEmptyCallback: ((model: ModelWithId | undefined | null) => ER)):
    StaticOptionalModelWithOnEmptyOnFull<T, ER, FR> {

    return new StaticOptionalModelWithOnEmptyOnFull<T, ER, FR>(
      this.model,
      onEmptyCallback,
      this.onFullCallback,
    );
  }

  @computed
  public get result(): FR | undefined {
    return isStaticFullModel<T>(this.model)
      ? this.onFullCallback(this.model)
      : void 0;
  }

  public getModel(): T | ModelWithId | undefined | null {
    return this.model;
  }
}

export class StaticOptionalModelWithOnEmptyOnFull<T extends ModelWithId, ER, FR> implements
  OptionalModelWithOnEmptyOnFull<T, ER, FR> {
  constructor(protected model: T | ModelWithId | undefined | null,
              protected onEmptyCallback: (model: ModelWithId | undefined | null) => ER,
              protected onFullCallback: (model: T) => FR) {}

  @computed
  public get result(): ER | FR {
    return isStaticFullModel<T>(this.model)
      ? this.onFullCallback(this.model)
      : this.onEmptyCallback(this.model);
  }

  public getModel(): T | ModelWithId | undefined | null {
    return this.model;
  }
}


/**
 * Return true if object contains another attributes, other than id and internal like _loasState
 * @param {ModelWithId | T} arg
 * @return {arg is T}
 */
export function isStaticFullModel<T>(arg: T | ModelWithId | undefined | null): arg is T {
  return isObject(arg) &&
    Object.getOwnPropertyNames(arg).filter(propName => propName !== 'id' && propName[0] !== '_').length > 0;
}
