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
        this.customRepositories = [];
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
    validateModel(rawModel, metadata) {
        if (swagger_ts_types_1.isObject(rawModel)) {
            for (const fieldName in metadata.fields) {
                const fieldMetadata = metadata.fields[fieldName];
                const value = rawModel[fieldMetadata.apiField];
                if (fieldMetadata.isRequired && value === void 0) {
                    return new internals_1.CoreError(`Required field ${fieldMetadata.apiField} is undefined.`);
                }
                else if (value !== void 0) {
                    for (const type of fieldMetadata.types) {
                        if (!swagger_ts_types_1.Validator.isValidValue(value, [type])) {
                            return new internals_1.CoreError(`Bad type or value ${JSON.stringify(fieldMetadata.types)} ` +
                                `of ${JSON.stringify(value)} for field ${JSON.stringify(fieldMetadata)} `);
                        }
                    }
                }
            }
        }
        else {
            return new internals_1.CoreError(`Raw model is not an object: ${rawModel}`);
        }
        return null;
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
    registerRepository(repository) {
        if (repository instanceof internals_1.ModelRepository) {
            this.modelRepositories.set(repository.getModelType(), repository);
        }
        else {
            this.customRepositories.push(repository);
        }
    }
    clearRepositories() {
        for (const key of this.modelRepositories.keys()) {
            const repository = this.modelRepositories.get(key);
            if (repository) {
                repository.clearRepository();
            }
        }
        this.customRepositories.forEach(customRepository => customRepository.clearRepository());
    }
};
MainRepository = __decorate([
    autobind_decorator_1.default
], MainRepository);
exports.MainRepository = MainRepository;
