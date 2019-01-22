"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mobx_1 = require("mobx");
const internals_1 = require("../internals");
const swagger_ts_types_1 = require("swagger-ts-types");
const autobind_decorator_1 = require("autobind-decorator");
let MainRepository = class MainRepository {
    constructor() {
        this.modelRepositories = new Map();
        this.isKnownModelType = (arg) => {
            return (typeof arg === 'string') && this.modelRepositories.has(arg);
        };
    }
    getModelRepository(modelType) {
        return this.modelRepositories.get(modelType);
    }
    /**
     * Entry point to get Model to work with, also, could be used particular repository getModel function
     * @param {ModelTypes} modelType
     * @param {string} id
     * @return {ObservableModel<ModelWithId | T> | UnknownModelTypeError}
     */
    getModel(modelType, id) {
        const result = this.getRawModel(modelType, id);
        return internals_1.isUnknownModelTypeError(result)
            ? result
            : new internals_1.ObservableOptionalModel(result, modelType, this);
    }
    /**
     * Return raw model, should be used only if you what you do, otherwise use getModel
     * @param modelType
     * @param {string} id
     * @return {ObservableModel<ModelWithId | T> | UnknownModelTypeError}
     */
    getRawModel(modelType, id) {
        const modelRepository = this.modelRepositories.get(modelType);
        if (modelRepository) {
            return modelRepository.getRawModel(id);
        }
        return new internals_1.UnknownModelTypeError(modelType);
    }
    isFullModel(model, modelType) {
        const modelRepository = this.modelRepositories.get(modelType);
        return modelRepository && modelRepository.isFullModel(model);
    }
    getMetadata(modelType) {
        const modelRepository = this.modelRepositories.get(modelType);
        if (modelRepository) {
            return modelRepository.getMetadata();
        }
        return new internals_1.UnknownModelTypeError(modelType);
    }
    /**
     * Denormalize, deserialize, and validate raw model, received from backend
     * Replaces links with real Models, and deserialize primitive types
     * @param {ModelWithId} rawModel
     * @param {ModelMetadata} metadata
     */
    denormalizeModel(model, rawModel, metadata) {
        const denormalizeResult = swagger_ts_types_1.Deserializer.denormalizeRawModel(rawModel, metadata, this.getRawModel, this.isKnownModelType);
        mobx_1.set(model, denormalizeResult.getValue());
        return denormalizeResult.isOk()
            ? null
            : new internals_1.CoreError(`Unable to denormalize Model ${JSON.stringify(rawModel)},` +
                ` Errors: ${JSON.stringify(denormalizeResult.getErrors())}`);
    }
    registerModelRepository(modelType, modelRepository) {
        this.modelRepositories.set(modelType, modelRepository);
    }
    clearRepositories() {
        for (const key in this.modelRepositories) {
            const repository = this.modelRepositories.get(key);
            if (repository) {
                repository.clearRepository();
            }
        }
    }
};
MainRepository = __decorate([
    autobind_decorator_1.default
], MainRepository);
exports.MainRepository = MainRepository;
