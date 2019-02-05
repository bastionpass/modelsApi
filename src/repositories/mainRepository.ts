import { set } from 'mobx';
import {
  ObservableModel,
  ObservableOptionalModel,
  isUnknownModelTypeError,
  UnknownModelTypeError,
  CoreError,
  ModelRepository,
} from '../internals';
import { Deserializer, ModelMetadata, ModelWithId } from 'swagger-ts-types';
import { IMainRepository } from './IMainRepository';
import autobindDecorator from 'autobind-decorator';

export type ModelRepositoriesMap<ModelTypes extends string> =
    Map<ModelTypes, ModelRepository<any, any, any, ModelTypes>>;

@autobindDecorator
export class MainRepository<ModelTypes extends string> implements IMainRepository<ModelTypes> {

  private modelRepositories: ModelRepositoriesMap<ModelTypes> = new Map();

  public getModelRepository<R extends ModelRepository<any, any, any, ModelTypes>>(modelType: ModelTypes):
      R | undefined {
    return this.modelRepositories.get(modelType) as R | undefined;
  }

  /**
   * Entry point to get Model to work with, also, could be used particular repository getModel function
   * @param {ModelTypes} modelType
   * @param {string} id
   * @return {ObservableModel<ModelWithId | T> | UnknownModelTypeError}
   */
  public getModel<T extends ModelWithId> (modelType: ModelTypes, id: string)
    : ObservableOptionalModel<T, ModelTypes> | UnknownModelTypeError {
    const result = this.getRawModel<T>(modelType, id);
    return isUnknownModelTypeError(result)
      ? result
      : new ObservableOptionalModel<T, ModelTypes>(result, modelType, this);
  }

  /**
   * Return raw model, should be used only if you what you do, otherwise use getModel
   * @param modelType
   * @param {string} id
   * @return {ObservableModel<ModelWithId | T> | UnknownModelTypeError}
   */
  public getRawModel<T extends ModelWithId>(modelType: string, id: string)
    : ObservableModel<T | ModelWithId, ModelTypes> | UnknownModelTypeError {

    const modelRepository = this.modelRepositories.get(modelType as ModelTypes);
    if (modelRepository) {
      return modelRepository.getRawModel(id) as ObservableModel<T | ModelWithId, ModelTypes> ;
    }
    return new UnknownModelTypeError(modelType);

  }

  public isFullModel<T extends ModelWithId>(model: T | ModelWithId, modelType: ModelTypes): model is T {
    const modelRepository = this.modelRepositories.get(modelType) as ModelRepository<T, any, any, ModelTypes>;
    return modelRepository && modelRepository.isFullModel(model);
  }

  public getMetadata(modelType: ModelTypes): ModelMetadata | UnknownModelTypeError {
    const modelRepository = this.modelRepositories.get(modelType);
    if (modelRepository) {
      return modelRepository.getMetadata();
    }
    return new UnknownModelTypeError(modelType);
  }

  public isKnownModelType = (arg: any): arg is ModelTypes => {
    return (typeof arg === 'string') && this.modelRepositories.has(arg as ModelTypes);
  }

  /**
   * Denormalize, deserialize, and validate raw model, received from backend
   * Replaces links with real Models, and deserialize primitive types
   * @param {ModelWithId} rawModel
   * @param {ModelMetadata} metadata
   */
  public denormalizeModel(model: ObservableModel<ModelWithId, ModelTypes>,
                          rawModel: ModelWithId,
                          metadata: ModelMetadata): CoreError | null {

    const denormalizeResult = Deserializer.denormalizeRawModel(
      rawModel,
      metadata,
      this.getRawModel,
      this.isKnownModelType,
    );

    set(model, denormalizeResult.getValue());

    return denormalizeResult.isOk()
      ? null
      : new CoreError(`Unable to denormalize Model ${JSON.stringify(rawModel)},` +
        ` Errors: ${JSON.stringify(denormalizeResult.getErrors())}`);
  }

  public registerModelRepository(modelType: ModelTypes, modelRepository: ModelRepository<any, any, any, ModelTypes>) {
    this.modelRepositories.set(modelType, modelRepository);
  }

  public clearRepositories() {
    for (const key of this.modelRepositories.keys()) {
      const repository = this.modelRepositories.get(key as ModelTypes);
      if (repository) {
        repository.clearRepository();
      }
    }
  }
}
