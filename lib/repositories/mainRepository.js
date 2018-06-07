"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mobx_1 = require("mobx");
const ObservableOptionalModel_1 = require("./optionalModel/ObservableOptionalModel");
const unknownModelTypeError_1 = require("./unknownModelTypeError");
const swagger_ts_types_1 = require("swagger-ts-types");
const coreError_1 = require("../coreError");
class MainRepository {
    constructor() {
        this.modelRepositories = new Map();
        /**
         * Return raw model, should be used only if you what you do, otherwise use getModel
         * @param modelType
         * @param {string} id
         * @return {ObservableModel<ModelWithId | T> | UnknownModelTypeError}
         */
        this.getRawModel = (modelType, id) => {
            const modelRepository = this.modelRepositories.get(modelType);
            if (modelRepository) {
                return modelRepository.getRawModel(id);
            }
            return new unknownModelTypeError_1.UnknownModelTypeError(modelType);
        };
        this.isKnownModelType = (arg) => {
            return (typeof arg === 'string') && this.modelRepositories.has(arg);
        };
        /**
         * Denormalize, deserialize, and validate raw model, received from backend
         * Replaces links with real Models, and deserialize primitive types
         * @param {ModelWithId} rawModel
         * @param {ModelMetadata} metadata
         */
        this.denormalizeModel = (model, rawModel, metadata) => {
            const denormalizeResult = swagger_ts_types_1.Deserializer.denormalizeRawModel(rawModel, metadata, this.getRawModel, this.isKnownModelType);
            mobx_1.set(model, denormalizeResult.getValue());
            return denormalizeResult.isOk()
                ? null
                : new coreError_1.CoreError(`Unable to denormalize Model ${JSON.stringify(rawModel)},` +
                    ` Errors: ${JSON.stringify(denormalizeResult.getErrors())}`);
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
        return unknownModelTypeError_1.isUnknownModelTypeError(result) ? result : new ObservableOptionalModel_1.ObservableOptionalModel(result, modelType, this);
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
        return new unknownModelTypeError_1.UnknownModelTypeError(modelType);
    }
    registerModelRepository(modelType, modelRepository) {
        this.modelRepositories.set(modelType, modelRepository);
    }
}
exports.MainRepository = MainRepository;
