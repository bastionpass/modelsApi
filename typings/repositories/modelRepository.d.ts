import { ObservableOptionalModel, ObservableModel, IMainRepository, FilteredModelListImpl, ModelList, ModelListImpl, CustomRepository, Log } from '../internals';
import { ModelMetadata, ModelWithId } from 'swagger-ts-types';
import { Filter } from './modelList';
export declare abstract class ModelRepository<T extends ModelWithId, CreateRequest, UpdateRequest, ModelTypes extends string> extends CustomRepository<ModelTypes> {
    protected isModel: (arg: any) => boolean;
    private asyncListProcess;
    protected log: Log;
    protected modelType: ModelTypes;
    protected modelMetadata: ModelMetadata;
    protected allModels: Map<string, ObservableModel<T, ModelTypes>>;
    protected lists: Map<string, ModelListImpl<ObservableModel<T, ModelTypes>>>;
    protected fetchPromises: Map<Object, Promise<any>>;
    constructor(modelType: ModelTypes, modelMetadata: ModelMetadata, isModel: (arg: any) => boolean, mainRepository: IMainRepository<ModelTypes>, asyncListProcess?: number);
    /**
     * The main entry point of obtain a model. It returns existing model, or try to load it via API
     * the method immediately returns observable T model with appropriate loadsState
     * eg, if model is not loaded yet, this method returns {id: id, loadState: LoadState.Pending()}
     * The returned observable object will be changed as soon as value from backend arrive.
     * @param {string} id
     * @return {ObservableValue<T extends ModelWithId>}
     */
    getModel(id: string, load?: boolean): ObservableOptionalModel<T, ModelTypes>;
    /**
     * If you need raw ObservableModel<Model> without OptionalModel Wrapper,
     * @param {string} id
     * @return {ObservableModel<ModelWithId | T>}
     */
    getRawModel(id: string, load?: boolean): ObservableModel<T, ModelTypes>;
    isFullModel(model: any): model is T;
    getMetadata(): ModelMetadata;
    /**
     * Returns true if model with particular id exists in repo
     * Note, that does not mean the model really exists on backend.
     * This method will return true, if before getModel, getRawModel, or getExistingModel was called
     * Use this method to not pollute repository with models with unknown id
     * @param {string} id
     * @return {boolean}
     */
    hasModel(id: string): boolean;
    /**
     * Use this method to create and later save a new model
     * @return {ObservableModel<T extends ModelWithId>}
     */
    createNewModel(): ObservableModel<T, ModelTypes>;
    /**
     * Create or update model.
     * @param {ModelWithId} model - model, which will be full filled with value, but, should not be used further.
     *                              The only usable models should be always obtained via getModel(id)
     * @param saveModel
     * @return {Promise<void>}
     */
    createOrUpdate(model: ObservableModel<T, ModelTypes>, saveModel: CreateRequest | UpdateRequest): Promise<any>;
    deleteModel(model: T): Promise<void>;
    getExistingModel(id: string): ObservableModel<T, ModelTypes>;
    /**
     * The main entry point to get list of Models. The method immediately return observable list
     * and if it was not loaded or is not being loaded, starts it's async loading. The returned observable list will
     * change as soon as value from backend arrive.
     * @param {string} name
     * @return {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject}
     */
    getList(name?: string, autoload?: boolean): ModelList<ObservableModel<T, ModelTypes>>;
    /**
     * Returns filtered list
     * @param {{safe: Safe}} filter
     * @return {ModelListImpl<ObservableModel<T extends ModelWithId>>}
     */
    getFilteredList(filter: Filter<T>): FilteredModelListImpl<T>;
    /**
     * internal use only
     * @param {string} name
     * @param {boolean} autoload
     * @return {ModelListImpl<ObservableModel<T extends ModelWithId>>}
     */
    getListImpl(name?: string, filter?: Filter<T>, autoload?: boolean): ModelListImpl<ObservableModel<T, ModelTypes>>;
    getExistingList(name?: string): ModelList<ObservableModel<T, ModelTypes>>;
    getExistingListImpl(name?: string, filter?: Filter<T>): ModelListImpl<ObservableModel<T, ModelTypes>>;
    /**
     * Implement in descendants
     * It should fetch model by Id or return null, if fetching single Model is not possible
     * @param {string} id
     * @return {Promise<any> | null}
     */
    protected abstract fetchModel(id: string): Promise<any> | null;
    protected abstract fetchList(name: string, consume: (models: any[], startIndex: number) => void): Promise<any[]>;
    protected abstract create(saveModel: CreateRequest): Promise<any>;
    protected abstract update(saveModel: UpdateRequest): Promise<any>;
    protected abstract deleteOne(model: T): Promise<any>;
    /**
     * Inner helper, that creates empty model with required Id
     * @param {string} id
     * @return {ObservableModel<T extends ModelWithId>}
     */
    protected createEmptyModel(id: string): ObservableModel<T, ModelTypes>;
    /**
     * Inner helper that creates empty model list
     * @param {string} name
     * @return {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject}
     */
    protected createEmptyList(name: string, filter?: Filter<T>): ModelListImpl<ObservableModel<T, ModelTypes>>;
    /**
     * This method initiate a Model loading and deserializing/denormallizing
     * @param {ObservableModel<T extends ModelWithId>} model
     */
    protected loadModel(model: ObservableModel<T, ModelTypes>): void;
    /**
     * This method initiate List loading and deserializing/denormallizing of all loaded models
     * Invalid models saved to invalidModels array of returned object
     * @param {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject} list
     */
    protected loadList: (list: ModelListImpl<ObservableModel<T, ModelTypes>>) => Promise<any>;
    /**
     * This method consumes an array of models and replaces them in a given list starting from provided index
     * It does not pushes models into allList, thou it updates models, tha could be in other lists as well.
     * @param {any[]} rawModels
     * @param {ModelListImpl<ObservableModel<T extends ModelWithId, ModelTypes extends string>>} implList
     * @param {number} startIndex
     */
    consumeModels(rawModels: any[], implList?: ModelListImpl<ObservableModel<T, ModelTypes>>, startIndex?: number): void;
    protected pushModelsToList(rawModels: any[], implList?: ModelListImpl<ObservableModel<T, ModelTypes>>, startIndex?: number): void;
    /**
     * This function is used to consume raw model into a repository
     * If needed this function unshifts a model into global list.
     * @param rawModel - the model to be consumed
     * @param {ObservableModel<ModelWithId | T, ModelTypes extends string>} model - optional model to fill in
     */
    consumeModel(rawModel: any, model?: ObservableModel<T, ModelTypes>): ObservableModel<T, ModelTypes>;
    getModelType(): ModelTypes;
    getMainRepository(): IMainRepository<ModelTypes>;
    /**
     * This method clears all model and lists in the repository
     * Though already existed model and lists will still be valid
     */
    clearRepository(): void;
}
