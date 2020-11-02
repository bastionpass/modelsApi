import { action, IObservableObject, observable, set } from "mobx";
import { ObservableValue } from "mobx/lib/types/observablevalue";
import {
  isModelWithId,
  isNewModel,
  ModelMetadata,
  ModelWithId,
  newModelId,
  serialize,
} from "swagger-ts-types";
import {
  CoreError,
  CustomRepository,
  ErrorState,
  FilteredModelListImpl,
  IMainRepository,
  inject,
  LoadState,
  Log,
  ModelList,
  ModelListImpl,
  ObservableModel,
  ObservableOptionalModel,
} from "../internals";
import { Filter } from "./modelList";

const defaultList = "all";

@inject
export abstract class ModelRepository<
  T extends ModelWithId,
  CreateRequest,
  UpdateRequest,
  ModelTypes extends string
> extends CustomRepository {
  @inject
  protected log: Log;

  @observable.shallow
  protected allModels: Map<string, ObservableModel<T, ModelTypes>> = new Map();

  @observable.shallow
  protected lists: Map<
    string,
    ModelListImpl<ObservableModel<T, ModelTypes>>
  > = new Map();

  protected fetchPromises: Map<Object, Promise<any>> = new Map();

  constructor(
    private modelType: ModelTypes,
    private modelMetadata: ModelMetadata,
    protected isModel: (arg: any) => boolean,
    mainRepository: IMainRepository<ModelTypes>,
    private asyncListProcess: number = 10
  ) {
    super(mainRepository, modelType);
  }

  /**
   * The main entry point of obtain a model. It returns existing model, or try to load it via API
   * the method immediately returns observable T model with appropriate loadsState
   * eg, if model is not loaded yet, this method returns {id: id, loadState: LoadState.Pending()}
   * The returned observable object will be changed as soon as value from backend arrive.
   * @param {string} id
   * @return {ObservableValue<T extends ModelWithId>}
   */
  public getModel(
    id: string,
    load?: boolean
  ): ObservableOptionalModel<T, ModelTypes> {
    return new ObservableOptionalModel(
      this.getRawModel(id, load),
      this.modelType,
      this.mainRepository
    );
  }

  /**
   * If you need raw ObservableModel<Model> without OptionalModel Wrapper,
   * @param {string} id
   * @return {ObservableModel<ModelWithId | T>}
   */
  public getRawModel(
    id: string,
    load?: boolean
  ): ObservableModel<T, ModelTypes> {
    // Try to get existing model
    const model = this.getExistingModel(id);
    if (load || (load === void 0 && model._loadState.isNone())) {
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
   * Returns true if model with particular id exists in repo
   * Note, that does not mean the model really exists on backend.
   * This method will return true, if before getModel, getRawModel, or getExistingModel was called
   * Use this method to not pollute repository with models with unknown id
   * @param {string} id
   * @return {boolean}
   */
  public hasModel(id: string): boolean {
    return this.allModels.has(id);
  }

  /**
   * Use this method to create and later save a new model
   * @return {ObservableModel<T extends ModelWithId>}
   */
  public createNewModel(): ObservableModel<T, ModelTypes> {
    return this.createEmptyModel(newModelId);
  }

  /**
   * Create or update model.
   * @param {ModelWithId} model - model, which will be full filled with value, but, should not be used further.
   *                              The only usable models should be always obtained via getModel(id)
   * @param saveModel
   * @return {Promise<void>}
   */
  public updateModel(id: string, saveModel: UpdateRequest) {
    return this.update(saveModel as UpdateRequest)
      .then((responseModel) => {
        const model = this.consumeModel(responseModel);
        this.allModels.set(model.id, model);
        return model;
      })
      .catch((error) => {
        const model = this.getExistingModel(id);
        model._loadState = new ErrorState(error);
        throw error;
      });
  }

  public createModel(saveModel: CreateRequest) {
    return this.create(saveModel).then((responseModel) => {
      // Push new model to default list
      const model = this.consumeModel(responseModel);
      this.allModels.set(model.id, model);
      return model;
    });
  }

  public deleteModel(model: T): Promise<void> {
    const realModel = this.allModels.get(model.id);

    if (realModel) {
      realModel._loadState = LoadState.pending();
    }

    return this.deleteOne(model)
      .then(() => {
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
      })
      .catch((apiError: CoreError) => {
        if (realModel) {
          (model as ObservableModel<T, any>)._loadState = new ErrorState(
            apiError
          );
        }
        throw apiError;
      });
  }

  public getExistingModel(id: string): ObservableModel<T, ModelTypes> {
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
  public getList(
    name: string = defaultList,
    autoload: boolean = true
  ): ModelList<ObservableModel<T, ModelTypes>> {
    return this.getListImpl(name, void 0, autoload);
  }

  /**
   * Returns filtered list
   * @param {{safe: Safe}} filter
   * @return {ModelListImpl<ObservableModel<T extends ModelWithId>>}
   */
  public getFilteredList(filter: Filter<T>) {
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
  public getListImpl(
    name: string = defaultList,
    filter?: Filter<T>,
    autoload: boolean = true
  ): ModelListImpl<ObservableModel<T, ModelTypes>> {
    const list = this.getExistingListImpl(name, filter);

    if (autoload && list.loadState.isNone()) {
      setImmediate(() => list.loadList());
    }

    return list;
  }

  public getExistingList(
    name: string = defaultList
  ): ModelList<ObservableModel<T, ModelTypes>> {
    return this.getExistingListImpl(name);
  }

  public getExistingListImpl(
    name: string = defaultList,
    filter?: Filter<T>
  ): ModelListImpl<ObservableModel<T, ModelTypes>> {
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

  protected abstract fetchList(
    name: string,
    consume: (models: any[], startIndex: number) => void
  ): Promise<any[]>;
  protected abstract create(saveModel: CreateRequest): Promise<any>;
  protected abstract update(saveModel: UpdateRequest): Promise<any>;
  protected abstract deleteOne(model: T): Promise<any>;

  /**
   * Inner helper, that creates empty model with required Id
   * @param {string} id
   * @return {ObservableModel<T extends ModelWithId>}
   */
  protected createEmptyModel(id: string): ObservableModel<T, ModelTypes> {
    return observable.object({
      ...this.modelMetadata.emptyModel,
      id,
      _loadState: LoadState.none(),
      _modelType: this.modelType,
    }) as ObservableModel<T, ModelTypes>;
  }

  /**
   * Inner helper that creates empty model list
   * @param {string} name
   * @return {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject}
   */
  protected createEmptyList(
    name: string,
    filter?: Filter<T>
  ): ModelListImpl<ObservableModel<T, ModelTypes>> {
    return new ModelListImpl<ObservableModel<T, ModelTypes>>(
      name,
      this.loadList,
      filter as any
    );
  }

  /**
   * This method initiate a Model loading and deserializing/denormallizing
   * @param {ObservableModel<T extends ModelWithId>} model
   */
  protected loadModel(model: ObservableModel<T, ModelTypes>): void {
    if (model._loadState.isPending()) {
      return;
    }

    model._loadState = LoadState.pending();

    const fetchPromise = this.makeCancellable(this.fetchModel(model.id));
    if (fetchPromise) {
      this.fetchPromises.set(model, fetchPromise);
      fetchPromise
        .then((rawModel: any) => {
          this.consumeModel(rawModel);
        })
        .catch((error: CoreError) => {
          model._loadState = new ErrorState(error);
        });
    } else {
      // We cannot load single model, load whole list instead
      const list = this.getExistingList();
      list
        .loadList()
        .then(() => {
          // When loadList is done, it will mark all models as Done as well
          // So if current model state is not Done that means it was not in list came from backend
          if (model._loadState.isPending()) {
            model._loadState = new ErrorState(
              new CoreError(
                `Model ${this.modelType} ${model.id} was not found on backend in default list`
              )
            );
          }
        })
        .catch((apiError: CoreError) => {
          model._loadState = new ErrorState(apiError);
        });
    }
  }

  /**
   * This method initiate List loading and deserializing/denormallizing of all loaded models
   * Invalid models saved to invalidModels array of returned object
   * @param {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject} list
   */
  protected loadList = (
    list: ModelListImpl<ObservableModel<T, ModelTypes>>
  ): Promise<any> => {
    if (this.fetchPromises.has(list)) {
      return this.fetchPromises.get(list) as Promise<any>; // Buggy TS
    }

    list.loadState = LoadState.pending();

    let intermediateConsumed = false;

    const intermediateConsume = (rawModels: any[], startingIndex: number) => {
      intermediateConsumed = true;
      this.pushModelsToList(rawModels, list, startingIndex);
    };

    const fetchPromise = this.makeCancellable(
      this.fetchList(list.name, intermediateConsume)
        .then(
          action((rawModels: any[]) => {
            // If we didn't consumed models before, replace the list totally
            if (!intermediateConsumed) {
              list.models = [];
            }
            this.consumeModels(rawModels, list);
            this.fetchPromises.delete(list);
            return list;
          })
        )
        .catch((error: CoreError) => {
          list.loadState = new ErrorState(error);
          this.fetchPromises.delete(list);
          if (!(error instanceof CoreError)) {
            throw error;
          }
        })
    );

    this.fetchPromises.set(list, fetchPromise);

    return fetchPromise;
  };

  /**
   * This method consumes an array of models and replaces them in a given list starting from provided index
   * It does not pushes models into allList, thou it updates models, tha could be in other lists as well.
   * @param {any[]} rawModels
   * @param {ModelListImpl<ObservableModel<T extends ModelWithId, ModelTypes extends string>>} implList
   * @param {number} startIndex
   */
  public consumeModels(
    rawModels: any[],
    implList?: ModelListImpl<ObservableModel<T, ModelTypes>>,
    startIndex: number = 0
  ) {
    const list =
      implList ||
      (this.getList(defaultList, false) as ModelListImpl<
        ObservableModel<T, ModelTypes>
      >);

    this.pushModelsToList(rawModels, list, startIndex);

    list.loadState = list.invalidModels.length
      ? new ErrorState(
          new CoreError(
            `${
              list.invalidModels.length
            } invalid models came from backed. ${JSON.stringify(rawModels)}`
          )
        )
      : LoadState.done();

    list.total = list.models.length;
  }

  @action
  public pushModelsToList(
    rawModels: any[],
    implList?: ModelListImpl<ObservableModel<T, ModelTypes>>,
    startIndex: number = 0
  ) {
    const list =
      implList ||
      (this.getList(defaultList, false) as ModelListImpl<
        ObservableModel<T, ModelTypes>
      >);

    for (const rawIndex in rawModels) {
      const index = Number(rawIndex);
      const rawModel = rawModels[index];
      if (isModelWithId(rawModel)) {
        const model = this.getExistingModel(rawModel.id);
        const normalizingError = this.mainRepository.denormalizeModel(
          model,
          rawModel,
          this.modelMetadata
        );
        if (normalizingError) {
          this.log.debug(`Denormalization error: ${normalizingError.message}`);
          list.invalidModels.push(rawModel);
          model._loadState = new ErrorState(normalizingError);
        } else {
          // Avoid gaps in lists for now
          const resultingIndex = Number(index) + startIndex;
          if (list.models.length > resultingIndex) {
            list.models[resultingIndex] = model;
          } else {
            list.models.push(model);
          }
          model._loadState = LoadState.done();
        }
      } else {
        list.invalidModels.push(rawModel);
      }
    }

    /**
     * Removing duplicates from models list.
     * Note, that last added or replaced model with specified id considered as source of truth.
     */
    const modelIds: Set<string> = new Set();
    const modelsList: T[] = [];
    for (let i = list.models.length - 1; i > -1; i--) {
      const modelId = list.models[i].id;
      if (!modelIds.has(modelId)) {
        modelsList.push(list.models[i]);
      }
      modelIds.add(modelId);
    }
    list.models = modelsList.reverse() as any;
  }

  /**
   * This function is used to consume raw model into a repository
   * If needed this function unshifts a model into global list.
   * @param rawModel - the model to be consumed
   * @param deprecated {ObservableModel<ModelWithId | T, ModelTypes extends string>} model - optional model to fill in
   */
  public consumeModel(rawModel: any): ObservableModel<T, ModelTypes> {
    const workingModel = this.getExistingModel(rawModel.id);

    if (workingModel.id !== rawModel.id && !isNewModel(workingModel)) {
      this.log
        .warning(`Consume error: you try to update ${this.modelType} with id ${workingModel.id},
             but recieved model id is ${rawModel.id}`);
      workingModel._loadState = new ErrorState(
        new CoreError(
          `Consume error: you try to update
      this.log.warning(\`Consume error: you try to update  with id ${workingModel.id},
             but recieved model id is ${rawModel.id}`
        )
      );
    }

    if (isModelWithId(rawModel)) {
      if (rawModel.metadata && rawModel.metadata.deleted) {
        // If we have this model loaded, mark it as deleted
        if (this.hasModel(rawModel.id)) {
          const existingModel = this.getExistingModel(rawModel.id);
          set(existingModel, { _loadState: LoadState.deleted() });
        }

        this.allModels.delete(rawModel.id);
        for (const list of this.lists) {
          const index = list[1].models.findIndex(
            (model) => model.id === rawModel.id
          );
          if (index >= 0) {
            list[1].models.splice(index, 1);
          }
        }
      } else {
        const normalizingError = this.mainRepository.denormalizeModel(
          workingModel,
          rawModel,
          this.modelMetadata
        );
        if (normalizingError) {
          this.log.debug(
            `Load model denormalizing error: ${normalizingError.message}`
          );
          workingModel._loadState = new ErrorState(normalizingError);
        } else {
          workingModel._loadState = LoadState.done();
          const allList = this.getExistingListImpl();
          if (
            allList.models.indexOf(
              workingModel as ObservableModel<T, ModelTypes>
            ) < 0
          ) {
            allList.models.unshift(
              workingModel as ObservableModel<T, ModelTypes>
            );
            allList.total += 1;
          }
        }
      }
    } else {
      workingModel._loadState = new ErrorState(
        new CoreError(
          `Denormalizing error: model has no id ${JSON.stringify(rawModel)}`
        )
      );
    }

    return workingModel as ObservableModel<T, ModelTypes>;
  }

  public getModelType() {
    return this.modelType;
  }

  public getMainRepository() {
    return this.mainRepository;
  }

  /**
   * This method clears all model and lists in the repository
   * Though already existed model and lists will still be valid
   */
  public clearRepository() {
    this.fetchPromises.forEach((promise) => (promise as any).cancel());
    this.fetchPromises.clear();
    this.allModels = new Map();
    this.lists = new Map();
  }

  protected makeCancellable<T>(src: T): T {
    if (!(src instanceof Promise)) {
      return src;
    }

    let active = true;
    const wrappedPromise = new Promise<T>((resolve, reject) => {
      src.then((result) => active && resolve(result));
      src.catch((error) => active && reject(error));
    });

    (wrappedPromise as any).cancel = () => (active = false);
    return (wrappedPromise as any) as T;
  }
}
