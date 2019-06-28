"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var _a;
"use strict";
const mobx_1 = require("mobx");
const internals_1 = require("../internals");
const swagger_ts_types_1 = require("swagger-ts-types");
const defaultList = 'all';
let ModelRepository = class ModelRepository extends internals_1.CustomRepository {
    constructor(modelType, modelMetadata, isModel, mainRepository, asyncListProcess = 10) {
        super(mainRepository);
        this.isModel = isModel;
        this.asyncListProcess = asyncListProcess;
        this.allModels = new Map();
        this.lists = new Map();
        this.fetchPromises = new Map();
        /**
         * This method initiate List loading and deserializing/denormallizing of all loaded models
         * Invalid models saved to invalidModels array of returned object
         * @param {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject} list
         */
        this.loadList = (list) => {
            if (this.fetchPromises.has(list)) {
                return this.fetchPromises.get(list); // Buggy TS
            }
            list.loadState = internals_1.LoadState.pending();
            const intermediateConsume = (rawModels, startingIndex) => {
                this.pushModelsToList(rawModels, list, startingIndex);
            };
            const fetchPromise = this.fetchList(list.name, intermediateConsume).then((rawModels) => {
                this.consumeModels(rawModels, list);
                this.fetchPromises.delete(list);
                return list;
            }).catch((error) => {
                list.loadState = new internals_1.ErrorState(error);
                this.fetchPromises.delete(list);
                if (!(error instanceof internals_1.CoreError)) {
                    throw error;
                }
            });
            this.fetchPromises.set(list, fetchPromise);
            return fetchPromise;
        };
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
    getModel(id, load) {
        return new internals_1.ObservableOptionalModel(this.getRawModel(id, load), this.modelType, this.mainRepository);
    }
    /**
     * If you need raw ObservableModel<Model> without OptionalModel Wrapper,
     * @param {string} id
     * @return {ObservableModel<ModelWithId | T>}
     */
    getRawModel(id, load) {
        // Try to get existing model
        const model = this.getExistingModel(id);
        if (load || (load === void 0 && model._loadState.isNone())) {
            setImmediate(() => this.loadModel(model));
        }
        return model;
    }
    isFullModel(model) {
        return this.isModel(model);
    }
    getMetadata() {
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
    hasModel(id) {
        return this.allModels.has(id);
    }
    /**
     * Use this method to create and later save a new model
     * @return {ObservableModel<T extends ModelWithId>}
     */
    createNewModel() {
        return this.createEmptyModel(swagger_ts_types_1.newModelId);
    }
    /**
     * Create or update model.
     * @param {ModelWithId} model - model, which will be full filled with value, but, should not be used further.
     *                              The only usable models should be always obtained via getModel(id)
     * @param saveModel
     * @return {Promise<void>}
     */
    createOrUpdate(saveModel) {
        let apiPromise;
        // TODO: add type checking for saveModel and isNewModel
        if (!swagger_ts_types_1.isModelWithId(saveModel)) {
            apiPromise = this.create(saveModel)
                .then((responseModel) => {
                // Push new model to default list
                const model = this.consumeModel(responseModel);
                this.allModels.set(model.id, model);
            });
        }
        else {
            apiPromise = this.update(saveModel)
                .then((responseModel) => {
                const model = this.consumeModel(responseModel);
                this.allModels.set(model.id, model);
            });
        }
        return apiPromise.catch((error) => {
            if (swagger_ts_types_1.isModelWithId(saveModel)) {
                const model = this.getExistingModel(saveModel.id);
                model._loadState = new internals_1.ErrorState(error);
            }
            throw error;
        });
    }
    deleteModel(model) {
        const realModel = this.allModels.get(model.id);
        if (realModel) {
            realModel._loadState = internals_1.LoadState.pending();
        }
        return this.deleteOne(model).then(() => {
            if (realModel) {
                realModel._loadState = internals_1.LoadState.done();
                this.allModels.delete(model.id);
                for (const list of this.lists) {
                    const index = list[1].models.indexOf(realModel);
                    if (index >= 0) {
                        list[1].models.splice(index, 1);
                    }
                }
            }
        }).catch((apiError) => {
            if (realModel) {
                model._loadState = new internals_1.ErrorState(apiError);
            }
            throw apiError;
        });
    }
    getExistingModel(id) {
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
    getList(name = defaultList, autoload = true) {
        return this.getListImpl(name, void 0, autoload);
    }
    /**
     * Returns filtered list
     * @param {{safe: Safe}} filter
     * @return {ModelListImpl<ObservableModel<T extends ModelWithId>>}
     */
    getFilteredList(filter) {
        const listName = JSON.stringify(swagger_ts_types_1.serialize(filter, [this.getMetadata()]));
        const all = this.getList();
        const filteredList = new internals_1.FilteredModelListImpl(listName, all, filter);
        return filteredList;
    }
    /**
     * internal use only
     * @param {string} name
     * @param {boolean} autoload
     * @return {ModelListImpl<ObservableModel<T extends ModelWithId>>}
     */
    getListImpl(name = defaultList, filter, autoload = true) {
        const list = this.getExistingListImpl(name, filter);
        if (autoload && list.loadState.isNone()) {
            setImmediate(() => list.loadList());
        }
        return list;
    }
    getExistingList(name = defaultList) {
        return this.getExistingListImpl(name);
    }
    getExistingListImpl(name = defaultList, filter) {
        const existingList = this.lists.get(name);
        if (existingList) {
            return existingList;
        }
        const list = this.createEmptyList(name, filter);
        this.lists.set(name, list);
        return list;
    }
    /**
     * Inner helper, that creates empty model with required Id
     * @param {string} id
     * @return {ObservableModel<T extends ModelWithId>}
     */
    createEmptyModel(id) {
        return mobx_1.observable.object(Object.assign({}, this.modelMetadata.emptyModel, { id, _loadState: internals_1.LoadState.none(), _modelType: this.modelType }));
    }
    /**
     * Inner helper that creates empty model list
     * @param {string} name
     * @return {ModelList<ObservableModel<T extends ModelWithId>> & IObservableObject}
     */
    createEmptyList(name, filter) {
        return new internals_1.ModelListImpl(name, this.loadList, filter);
    }
    /**
     * This method initiate a Model loading and deserializing/denormallizing
     * @param {ObservableModel<T extends ModelWithId>} model
     */
    loadModel(model) {
        if (model._loadState.isPending()) {
            return;
        }
        model._loadState = internals_1.LoadState.pending();
        const fetchPromise = this.fetchModel(model.id);
        if (fetchPromise) {
            fetchPromise.then((rawModel) => {
                this.consumeModel(rawModel);
            }).catch((error) => {
                model._loadState = new internals_1.ErrorState(error);
            });
        }
        else {
            // We cannot load single model, load whole list instead
            const list = this.getExistingList();
            list.loadList().then(() => {
                // When loadList is done, it will mark all models as Done as well
                // So if current model state is not Done that means it was not in list came from backend
                if (model._loadState.isPending()) {
                    model._loadState = new internals_1.ErrorState(new internals_1.CoreError(`Model ${this.modelType} ${model.id} was not found on backend in default list`));
                }
            }).catch((apiError) => {
                model._loadState = new internals_1.ErrorState(apiError);
            });
        }
    }
    /**
     * This method consumes an array of models and replaces them in a given list starting from provided index
     * It does not pushes models into allList, thou it updates models, tha could be in other lists as well.
     * @param {any[]} rawModels
     * @param {ModelListImpl<ObservableModel<T extends ModelWithId, ModelTypes extends string>>} implList
     * @param {number} startIndex
     */
    consumeModels(rawModels, implList, startIndex = 0) {
        const list = implList || this.getList(defaultList, false);
        this.pushModelsToList(rawModels, list, startIndex);
        list.loadState = list.invalidModels.length
            ? new internals_1.ErrorState(new internals_1.CoreError(`${list.invalidModels.length} invalid models came from backed. ${JSON.stringify(rawModels)}`))
            : internals_1.LoadState.done();
        list.total = list.models.length;
    }
    pushModelsToList(rawModels, implList, startIndex = 0) {
        const list = implList || this.getList(defaultList, false);
        for (const index in rawModels) {
            const rawModel = rawModels[index];
            if (swagger_ts_types_1.isModelWithId(rawModel)) {
                const model = this.getExistingModel(rawModel.id);
                const normalizingError = this.mainRepository.denormalizeModel(model, rawModel, this.modelMetadata);
                if (normalizingError) {
                    this.log.debug(`Denormalization error: ${normalizingError.message}`);
                    list.invalidModels.push(rawModel);
                    model._loadState = new internals_1.ErrorState(normalizingError);
                }
                else {
                    // Avoid gaps in lists for now
                    const resultingIndex = Number(index) + startIndex;
                    if (list.models.length > resultingIndex) {
                        list.models[resultingIndex] = model;
                    }
                    else {
                        list.models.push(model);
                    }
                    model._loadState = internals_1.LoadState.done();
                }
            }
            else {
                list.invalidModels.push(rawModel);
            }
        }
    }
    /**
     * This function is used to consume raw model into a repository
     * If needed this function unshifts a model into global list.
     * @param rawModel - the model to be consumed
     * @param deprecated {ObservableModel<ModelWithId | T, ModelTypes extends string>} model - optional model to fill in
     */
    consumeModel(rawModel) {
        const workingModel = this.getExistingModel(rawModel.id);
        if (workingModel.id !== rawModel.id && !swagger_ts_types_1.isNewModel(workingModel)) {
            this.log.warning(`Consume error: you try to update ${this.modelType} with id ${workingModel.id},
             but recieved model id is ${rawModel.id}`);
            workingModel._loadState = new internals_1.ErrorState(new internals_1.CoreError(`Consume error: you try to update
      this.log.warning(\`Consume error: you try to update  with id ${workingModel.id},
             but recieved model id is ${rawModel.id}`));
        }
        if (swagger_ts_types_1.isModelWithId(rawModel)) {
            if (rawModel.metadata && rawModel.metadata.deleted) {
                this.allModels.delete(rawModel.id);
                for (const list of this.lists) {
                    const index = list[1].models.findIndex(model => model.id === rawModel.id);
                    if (index >= 0) {
                        list[1].models.splice(index, 1);
                    }
                }
            }
            else {
                const normalizingError = this.mainRepository.denormalizeModel(workingModel, rawModel, this.modelMetadata);
                if (normalizingError) {
                    this.log.debug(`Load model denormalizing error: ${normalizingError.message}`);
                    workingModel._loadState = new internals_1.ErrorState(normalizingError);
                }
                else {
                    workingModel._loadState = internals_1.LoadState.done();
                    const allList = this.getExistingListImpl();
                    if (allList.models.indexOf(workingModel) < 0) {
                        allList.models.unshift(workingModel);
                        allList.total += 1;
                    }
                }
            }
        }
        else {
            workingModel._loadState = new internals_1.ErrorState(new internals_1.CoreError(`Denormalizing error: model has no id ${JSON.stringify(rawModel)}`));
        }
        return workingModel;
    }
    getModelType() {
        return this.modelType;
    }
    getMainRepository() {
        return this.mainRepository;
    }
    /**
     * This method clears all model and lists in the repository
     * Though already existed model and lists will still be valid
     */
    clearRepository() {
        this.allModels = new Map();
        this.lists = new Map();
    }
};
__decorate([
    internals_1.inject,
    __metadata("design:type", internals_1.Log)
], ModelRepository.prototype, "log", void 0);
__decorate([
    mobx_1.observable.shallow,
    __metadata("design:type", Map)
], ModelRepository.prototype, "allModels", void 0);
__decorate([
    mobx_1.observable.shallow,
    __metadata("design:type", Map)
], ModelRepository.prototype, "lists", void 0);
ModelRepository = __decorate([
    internals_1.inject,
    __metadata("design:paramtypes", [typeof (_a = typeof ModelTypes !== "undefined" && ModelTypes) === "function" && _a || Object, Object, Function, Object, Number])
], ModelRepository);
exports.ModelRepository = ModelRepository;
