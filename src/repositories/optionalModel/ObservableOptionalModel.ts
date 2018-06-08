import { computed } from 'mobx';
import {
  BaseOptionalModel,
  ObservableModel,
  OptionalModel,
  OptionalModelWithOnEmpty,
  OptionalModelWithOnEmptyOnFull,
  OptionalModelWithOnFull,
  MainRepository,
} from '../../internals';
import { ModelWithId } from 'swagger-ts-types';

export interface BaseObservableOptionalModel<T extends ModelWithId, ModelTypes extends string>
    extends BaseOptionalModel<T> {
  getModelType: () => ModelTypes;
  getMainRepository: () => MainRepository<ModelTypes>;
}

export function isBaseObservableOptionType<ModelType extends string>(arg: any):
    arg is BaseObservableOptionalModel<any, ModelType> {
  return arg instanceof ObservableOptionalModel || arg instanceof ObservableOptionalModelWithOnEmpty ||
    arg instanceof ObservableOptionalModelWithOnFull || arg instanceof ObservableOptionalModelWithOnEmptyOnFull;
}

/**
 * OptionalModel is a selector used to process model, which could be fully loaded or partially (empty) loaded
 * onFullCallback is called if model is fully loaded, onEmptyCallback is called otherwise
 * Current result could be obtained via getter 'result'
 * How to use in a Component render:
 * optionalModel.onEmpty((model) => return <CLoader/>).onFull((model) => <CModelCard model={model}/>)
 * Because model is observable the Component will re-render when model changes (e.g. been loaded)
 */
export class ObservableOptionalModel<T extends ModelWithId, ModelTypes extends string> implements
    OptionalModel<T>, BaseObservableOptionalModel<T, ModelTypes>{

  constructor(protected model: ObservableModel<T | ModelWithId, ModelTypes>,
              protected modelType: ModelTypes,
              protected mainRepository: MainRepository<ModelTypes>) {}

  public onFull<FR>(onFullCallback: ((model: T) => FR)): OptionalModelWithOnFull<T, FR> {
    return new ObservableOptionalModelWithOnFull<T, FR, ModelTypes>(
      this.model,
      this.modelType,
      this.mainRepository,
      onFullCallback,
    );
  }

  public onEmpty<ER>(onEmptyCallback: (model: ModelWithId | undefined | null) => ER):
    ObservableOptionalModelWithOnEmpty<T, ER, ModelTypes> {
    return new ObservableOptionalModelWithOnEmpty<T, ER, ModelTypes>(
      this.model,
      this.modelType,
      this.mainRepository,
      onEmptyCallback,
    );
  }

  /**
   * This function returns model of current state: full or empty fro further manual checking
   * @return {ModelWithId | T}
   */
  public getModel(): ObservableModel<T | ModelWithId, ModelTypes> {
    return this.model;
  }

  public getModelType(): ModelTypes {
    return this.modelType;
  }

  public getMainRepository(): MainRepository<ModelTypes> {
    return this.mainRepository;
  }
}

export class ObservableOptionalModelWithOnEmpty<T extends ModelWithId, ER, ModelTypes extends string> implements
  OptionalModelWithOnEmpty<T, ER>, BaseObservableOptionalModel<T, ModelTypes> {

  constructor(protected model: ObservableModel <T | ModelWithId, ModelTypes>,
              protected modelType: ModelTypes,
              protected mainRepository: MainRepository<ModelTypes>,
              protected onEmptyCallback: (model: ModelWithId | undefined | null) => ER) {}

  public onFull<FR>(onFullCallback: ((model: T) => FR)):
      ObservableOptionalModelWithOnEmptyOnFull<T, ER, FR, ModelTypes> {
    return new ObservableOptionalModelWithOnEmptyOnFull<T, ER, FR, ModelTypes>(
      this.model,
      this.modelType,
      this.mainRepository,
      this.onEmptyCallback,
      onFullCallback,
    );
  }

  @computed
  public get result(): ER | undefined {
    return isFullModel(this.model, this.modelType, this.mainRepository)
      ? void 0
      : this.onEmptyCallback(this.model);
  }

  public getModel(): ObservableModel<T | ModelWithId, ModelTypes> {
    return this.model;
  }

  public getModelType(): ModelTypes {
    return this.modelType;
  }

  public getMainRepository(): MainRepository<ModelTypes> {
    return this.mainRepository;
  }
}

export class ObservableOptionalModelWithOnFull<T extends ModelWithId, FR, ModelTypes extends string> implements
  OptionalModelWithOnFull<T, FR>, BaseObservableOptionalModel<T, ModelTypes> {

  constructor(protected model: ObservableModel <T | ModelWithId, ModelTypes>,
              protected modelType: ModelTypes,
              protected mainRepository: MainRepository<ModelTypes>,
              protected onFullCallback: (model: T) => FR) {}

  public onEmpty<ER>(onEmptyCallback: ((model: ModelWithId | undefined | null) => ER)):
    OptionalModelWithOnEmptyOnFull<T, ER, FR> {
    return new ObservableOptionalModelWithOnEmptyOnFull<T, ER, FR, ModelTypes>(
      this.model,
      this.modelType,
      this.mainRepository,
      onEmptyCallback,
      this.onFullCallback,
    );
  }

  @computed
  public get result(): FR | undefined {
    return isFullModel<T, ModelTypes>(this.model, this.modelType, this.mainRepository)
      ? this.onFullCallback(this.model)
      : void 0;
  }

  public getModel(): ObservableModel<T | ModelWithId, ModelTypes> {
    return this.model;
  }

  public getModelType(): ModelTypes {
    return this.modelType;
  }

  public getMainRepository(): MainRepository<ModelTypes> {
    return this.mainRepository;
  }
}

export class ObservableOptionalModelWithOnEmptyOnFull<T extends ModelWithId, ER, FR, ModelTypes extends string> implements
  OptionalModelWithOnEmptyOnFull<T, ER, FR>, BaseObservableOptionalModel<T, ModelTypes> {

  constructor(protected model: ObservableModel <T | ModelWithId, ModelTypes>,
              protected modelType: ModelTypes,
              protected mainRepository: MainRepository<ModelTypes>,
              protected onEmptyCallback: (model: ModelWithId | undefined | null) => ER,
              protected onFullCallback: (model: T) => FR) {}

  @computed
  public get result(): ER | FR {
    return isFullModel<T, ModelTypes>(this.model, this.modelType, this.mainRepository)
      ? this.onFullCallback(this.model)
      : this.onEmptyCallback(this.model);
  }

  public getModel(): ObservableModel<T | ModelWithId, ModelTypes> {
    return this.model;
  }

  public getModelType(): ModelTypes {
    return this.modelType;
  }

  public getMainRepository(): MainRepository<ModelTypes> {
    return this.mainRepository;
  }
}

function isFullModel<T extends ModelWithId, ModelTypes extends string>(model: T | ModelWithId,
                                                                       modelType: ModelTypes,
                                                                       mainRepository: MainRepository<ModelTypes>,
                                                                       visitedCtx?: WeakMap<ModelWithId, boolean>):
    model is T {

  const visited = visitedCtx || new WeakMap<ModelWithId, boolean>();

  if (mainRepository.isFullModel<T>(model, modelType)) {
    return true;
    // visited.set(model, true);
    // Now check all subModels
    /* const metadata = mainRepository.getMetadata(modelType);
    if (isModelMetadata(metadata)) {
      return Object.keys(metadata.fields).find((key) => {
        // We need to find not full sub model
        const field = metadata.fields[key];
        if (field.types.indexOf('link') >= 0) {
          if (field.types.indexOf('null') >= 0 && model[key] === null) {
            return true;
          }

          if (mainRepository.isKnownModelType(field.subType)) {
            return visited.has(model[key])
              ? !visited.get(model[key])
              : isFullModel(model[key], field.subType, mainRepository, visited);
          }
        }
        return false;
      }) === void 0;
    }*/
  }
  return false;
}
