import {
  isBaseStaticOptionalModel,
  StaticOptionalModel,
  isBaseObservableOptionType,
  ObservableOptionalModel,
  defaultInjectNamespace,
  getInjected,
  isObservableModel,
  ObservableModel,
  IMainRepository,
  MainRepository,
} from '../../internals';
import { ModelWithId } from 'swagger-ts-types';

export interface BaseOptionalModel<T extends ModelWithId> {
  getModel: () => T | ModelWithId | undefined | null;
}

export interface OptionalModel<T extends ModelWithId> extends BaseOptionalModel<T> {
  onEmpty: <ER>(callback: (model: ModelWithId | undefined | null) => ER) => OptionalModelWithOnEmpty<T, ER>;
  onFull: <FR>(callback: (model: T) => FR) => OptionalModelWithOnFull<T, FR>;
}

export interface OptionalModelWithOnEmpty<T extends ModelWithId, ER> extends BaseOptionalModel<T> {
  onFull: <FR>(callback: (model: T) => FR) => OptionalModelWithOnEmptyOnFull<T, ER, FR>;
}

export interface OptionalModelWithOnFull<T extends ModelWithId, FR> extends BaseOptionalModel<T> {
  onEmpty: <ER>(callback: (model: ModelWithId | undefined | null) => ER) => OptionalModelWithOnEmptyOnFull<T, ER, FR>;
}

export interface OptionalModelWithOnEmptyOnFull<T extends ModelWithId, ER, FR> extends BaseOptionalModel<T> {
  result: ER | FR;
}

export module OptionalModel {
  export const from = <TT extends ModelWithId, ER, FR, ModelType extends string>(
      src: OptionalModel<TT> | OptionalModelWithOnEmpty<TT, ER> |
    OptionalModelWithOnFull<TT, any> | OptionalModelWithOnEmptyOnFull<TT, ER, FR> |
    ObservableModel<TT, ModelType> | TT | undefined | null,
  ): OptionalModel<TT> => {

    if (isBaseObservableOptionType<ModelType>(src)) {
      return new ObservableOptionalModel<TT, ModelType>(
          src.getModel(),
          src.getModelType(),
          src.getMainRepository(),
      );
    } else if (isObservableModel(src)) {
      const mainRepository = getInjected<IMainRepository<ModelType>>(defaultInjectNamespace, MainRepository);
      return new ObservableOptionalModel<TT, ModelType>(src, src._modelType, mainRepository);
    } else if (isBaseStaticOptionalModel(src)) {
      return new StaticOptionalModel(src.getModel());
    } else {
      return new StaticOptionalModel(src as TT);
    }
  };
}
