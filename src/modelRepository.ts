import { IObservableObject, observable, set } from 'mobx';
import { ModelTypes } from '../api/api';
import { ObservableValue } from 'mobx/lib/types/observablevalue';
import { ErrorState, LoadState } from './loadState';
import { MainRepository } from './mainRepository';
import { ApiError } from '../apiError';
import { CoreError } from '../coreError';
import { ObservableOptionalModel } from './optionalModel/ObservableOptionalModel';
import isObject = require('lodash/fp/isObject');
import { FilteredModelListImpl, ModelList, ModelListImpl } from './modelList';
import { CustomRepository } from './customRepository';
import { inject } from '../inject/inject';
import { Log } from '../log/log';
import {isNewModel, ModelMetadata, ModelWithId, newModelId, serialize} from 'swagger-ts-types';

export type ObservableModel<T extends ModelWithId> = T & IObservableObject & {
  _loadState: LoadState;
  _modelType: ModelTypes;
};

export function isObservableModel<T extends ModelWithId>(arg: any): arg is ObservableModel<T> {
  return isObject(arg) && arg._loadState instanceof LoadState && arg._modelType;
}

const defaultList = 'all';

@inject
export abstract class ModelRepository<
  T extends ModelWithId,
  CreateRequest,
  UpdateRequest> extends CustomRepository {

  @inject
  protected log: Log;

  protected modelType: ModelTypes;
  protected modelMetadata: ModelMetadata;

  @observable.shallow
  protected allModels: Map<string, ObservableModel<T>> = new Map();

  @observable.shallow
  protected lists: Map<string, ModelListImpl<ObservableModel<T>>> = new Map();

  private fetchPromises: Map<Object, Promise<any>> = new Map();

  constructor(modelType: ModelTypes,
              modelMetadata: ModelMetadata,
              protected isModel: (arg: any) => boolean,
              mainRepository: MainRepository) {
    super(mainRepository);
    mainRepository.registerModelRepository(modelType, this);
    this.modelType = modelType;
    this.modelMetadata = modelMetadata;
  }

  /**
   * The main entry point of obtain a model. It returns existing model, or try to load it via API
   * the method immediately returns observable T model with appropriate loadsState
   * eg, if model is not loaded yet, this method returns {id: id, loadState: LoadState.Pending()}
   * The returned observable object will be changed as soon as value from backend arrive.
   * @param {string} id
   * @return {ObservableValue<T extends ModelWithId>}
   */
  public getModel(id: string): ObservableOptionalModel<T> {
    return new ObservableOptionalModel(this.getRawModel(id), this.modelType, this.mainRepository);
  }

  /**
   * If you need raw ObservableModel<Model> without OptionalModel Wrapper,
   * @param {string} id
   * @return {ObservableModel<ModelWithId | T>}
   */
  public getRawModel(id: string, autoLoad: boolean = true): ObservableModel<T | ModelWithId> {
    // Try to get existing model
    const model = this.getExistingModel(id);
    if (autoLoad && !model._loadState.isNone()) {
      setImmediate(() => this.loadModel(model));
    }
    return model;
  }

  public isFullModel(model: any): model is T {
    return this.isModel(model);
  }

  public getMetadata() {
    return this.modelMetadata;
  }

  /**
   * Use this method to create and later save a new model
   * @return {ObservableModel<T extends ModelWithId>}
   */
  public createNewModel(): ObservableModel<T | ModelWithId> {
    return this.createEmptyModel(newModelId);
  }

  /**
   * Create or update model.
   * @param {ModelWithId} model - model, which will be full filled with value, but, should not be used further.
   *                              The only usable models should be always obtained via getModel(id)
   * @param saveModel
   * @return {Promise<void>}
   */
  public createOrUpdate(model: ObservableModel<T>, saveModel: CreateRequest | UpdateRequest) {
    let apiPromise: Promise<any>;

    // TODO: add type checking for saveModel and isNewModel
    if (isNewModel(model)) {
      apiPromise = this.create(saveModel as CreateRequest);
    } else {
      apiPromise = this.update(saveModel as UpdateRequest);
    }

    return apiPromise.then((responseModel) => {

      this.consumeModel(model, responseModel);

      // This model could be already created in repo, in that case we have to copy
      // This is very rare case, when, for instance fresh model arrived via websocket
      const existingModel = this.allModels.get(responseModel.id);
      if (existingModel) {
        if (existingModel !== model) {
          set(existingModel, model);
        }
      } else {
        this.allModels.set(model.id, model);
      }

    }).catch((error: ApiError) => {
      model._loadState = new ErrorState(error);
      throw error;
    });
  }

  public deleteModel(model: T): void {
    const realModel = this.allModels.get(model.id);

    if (realModel) {
      realModel._loadState = LoadState.pending();
    }

    this.deleteOne(model).then(() => {
      if (realModel) {
        realModel._loadState = LoadState.done();
        this.allModels.delete(model.id);
        for (const list of this.lists) {
          const index = list[1].models.indexOf(realModel);
          if (index >= 0) {
            list[1].models.splice(index, 1);
          }
        }
      }
    }).catch((apiError: ApiError) => {
      if (realModel) {
        model._loadState = new ErrorState(apiError);
      }
      throw apiError;
    });
  }

  public getExistingModel(id: string): ObservableModel<T> {
    const existingModel = this.allModels.get(id);

    if (existingModel) {
      return existingModel;
    }

    const model = this.createEmptyModel(id);
    this.allModels.set(id, model);

    return model;
  }

  /**
   * The main entry point to get list of Models. The method immediately return observable list
   * and if it was not loaded or is not being loaded, starts it's async loading. The returned observable list will
   * change as soon as value from backend arrive.
   * @param {string} name
   * @return {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject}
   */
  public getList(name: string = defaultList, autoload: boolean = true): ModelList<ObservableModel<T>> {
    return this.getListImpl(name, void 0, autoload);
  }

  /**
   * Returns filtered list
   * @param {{safe: Safe}} filter
   * @return {ModelListImpl<ObservableModel<T extends ModelWithId>>}
   */
  public getFilteredList(filter: Partial<T>) {
    const listName = JSON.stringify(serialize(filter, [this.getMetadata()]));
    const all = this.getList();
    const filteredList = new FilteredModelListImpl<T>(listName, all, filter);
    return filteredList;
  }

  /**
   * internal use only
   * @param {string} name
   * @param {boolean} autoload
   * @return {ModelListImpl<ObservableModel<T extends ModelWithId>>}
   */
  public getListImpl(name: string = defaultList, filter?: Partial<T>, autoload: boolean = true):
    ModelListImpl<ObservableModel<T>> {
    const list = this.getExistingListImpl(name, filter);

    if (autoload && list.loadState.isNone()) {
      setImmediate(() => list.loadList());
    }

    return list;
  }

  public getExistingList(name: string = defaultList): ModelList<ObservableModel<T>> {
    return this.getExistingListImpl(name);
  }

  public getExistingListImpl(name: string = defaultList, filter?: Partial<T>):
    ModelListImpl<ObservableModel<T>> {
    const existingList = this.lists.get(name);
    if (existingList) {
      return existingList;
    }

    const list = this.createEmptyList(name, filter);

    this.lists.set(name, list);

    return list;
  }

  /**
   * Implement in descendants
   * It should fetch model by Id or return null, if fetching single Model is not possible
   * @param {string} id
   * @return {Promise<any> | null}
   */
  protected abstract fetchModel(id: string): Promise<any> | null;

  protected abstract fetchList(name: string): Promise<any[]>;
  protected abstract create(saveModel: CreateRequest): Promise<any>;
  protected abstract update(saveModel: UpdateRequest): Promise<any>;
  protected abstract deleteOne(model: T): Promise<any>;

  /**
   * Inner helper, that creates empty model with required Id
   * @param {string} id
   * @return {ObservableModel<T extends ModelWithId>}
   */
  private createEmptyModel(id: string): ObservableModel<T> {
    return observable.object({
      ...this.modelMetadata.emptyModel,
      id,
      _loadState: LoadState.none(),
      _modelType: this.modelType,
    }) as ObservableModel<T>;
  }

  /**
   * Inner helper that creates empty model list
   * @param {string} name
   * @return {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject}
   */
  private createEmptyList(name: string, filter?: Partial<T>): ModelListImpl<ObservableModel<T>> {
    return new ModelListImpl<ObservableModel<T>>(name, this.loadList, filter);
  }

  /**
   * This method initiate a Model loading and deserializing/denormallizing
   * @param {ObservableModel<T extends ModelWithId>} model
   */
  private loadModel(model: ObservableModel<T>): void {
    if (model._loadState.isPending()) {
      return;
    }

    model._loadState = LoadState.pending();

    const fetchPromise = this.fetchModel(model.id);
    if (fetchPromise) {
      fetchPromise.then((rawModel: any) => {
        this.consumeModel(model, rawModel);
      }).catch((error: ApiError) => {
        model._loadState = new ErrorState(error);
      });
    } else {
      // We cannot load single model, load whole list instead
      const list = this.getExistingList();
      list.loadList().then(() => {

        // When loadList is done, it will mark all models as Done as well
        // So if current model state is not Done that means it was not in list came from backend
        if (model._loadState.isPending()) {
          model._loadState = new ErrorState(
            new CoreError(`Model ${this.modelType} ${model.id} was not found on backend in default list`),
          );
        }

      }).catch((apiError: ApiError) => {
        model._loadState = new ErrorState(apiError);
      });
    }
  }

  /**
   * This method initiate List loading and deserializing/denormallizing of all loaded models
   * Invalid models saved to invalidModels array of returned object
   * @param {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject} list
   */
  private loadList = (list: ModelListImpl<ObservableModel<T>>): Promise<any> => {

    if (this.fetchPromises.has(list)) {
      return this.fetchPromises.get(list) as Promise<any>; // Buggy TS
    }

    list.loadState = LoadState.pending();

    const fetchPromise = this.fetchList(list.name).then((rawModels: any[]) => {
      this.consumeModels(rawModels, list);
      this.fetchPromises.delete(list);
      return list;
    }).catch((error: ApiError) => {
      list.loadState = new ErrorState(error);
      this.fetchPromises.delete(list);
      if (!(error instanceof ApiError)) {
        throw error;
      }
    });

    this.fetchPromises.set(list, fetchPromise);

    return fetchPromise;
  }

  public consumeModels(rawModels: any[], implList?: ModelListImpl<ObservableModel<T>>) {
    const list = implList || this.getList(defaultList, false) as ModelListImpl<ObservableModel<T>>;

    const models: ObservableModel<T>[] = [];
    const invalidModels: any[] = [];

    for (const index in rawModels) {
      const rawModel = rawModels[index];
      if (isObject(rawModel) && rawModel.id) {
        const model = this.getExistingModel(rawModel.id);
        const normalizingError = this.mainRepository.denormalizeModel(model, rawModel, this.modelMetadata);
        if (normalizingError) {
          this.log.debug(`Denormalization error: ${normalizingError.message}`);
          invalidModels.push(rawModel);
          model._loadState = new ErrorState(normalizingError);
        } else {
          models.push(model);
          model._loadState = LoadState.done();
        }
      } else {
        invalidModels.push(rawModel);
      }
    }

    list.loadState = invalidModels.length
      ? new ErrorState(
        new CoreError(`${invalidModels.length} invalid models came from backed. ${JSON.stringify(rawModels)}`),
      )
      : LoadState.done();

    list.models = observable.array(models);
    list.invalidModels = observable.array(invalidModels);
    list.total = models.length;
  }

  public consumeModel(model: ObservableModel<T>, rawModel: any) {
    if (isObject(rawModel) && rawModel.id) {
      const normalizingError = this.mainRepository.denormalizeModel(model, rawModel, this.modelMetadata);
      if (normalizingError) {
        this.log.debug(`Load model denormalizing error: ${normalizingError.message}`);
        model._loadState = new ErrorState(normalizingError);
      } else {
        model._loadState = LoadState.done();
      }
    } else {
      model._loadState = new ErrorState(
        new CoreError(`Denormalizing error: model has no id ${JSON.stringify(rawModel)}`),
      );
    }
  }

  public getModelType() {
    return this.modelType;
  }

  public getMainRepository() {
    return this.mainRepository;
  }
}
