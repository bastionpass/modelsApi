import { ModelMetadata, ModelWithId } from 'swagger-ts-types';
import { CoreError, ModelRepository, ObservableModel, UnknownModelTypeError } from '../internals';
import { ObservableOptionalModel } from './optionalModel/ObservableOptionalModel';
export interface IMainRepository<ModelTypes extends string> {
    getModelRepository<R extends ModelRepository<any, any, any, ModelTypes>>(modelType: ModelTypes): R | undefined;
    /**
     * Entry point to get Model to work with, also, could be used particular repository getModel function
     * @param {ModelTypes} modelType
     * @param {string} id
     * @return {ObservableModel<ModelWithId | T> | UnknownModelTypeError}
     */
    getModel<T extends ModelWithId>(modelType: ModelTypes, id: string): ObservableOptionalModel<T, ModelTypes> | UnknownModelTypeError;
    /**
     * Return raw model, should be used only if you what you do, otherwise use getModel
     * @param modelType
     * @param {string} id
     * @return {ObservableModel<ModelWithId | T> | UnknownModelTypeError}
     */
    getRawModel<T extends ModelWithId>(modelType: string, id: string): ObservableModel<T | ModelWithId, ModelTypes> | UnknownModelTypeError;
    isFullModel<T extends ModelWithId>(model: T | ModelWithId, modelType: ModelTypes): model is T;
    getMetadata(modelType: ModelTypes): ModelMetadata | UnknownModelTypeError;
    isKnownModelType(arg: any): arg is ModelTypes;
    /**
     * Denormalize, deserialize, and validate raw model, received from backend
     * Replaces links with real Models, and deserialize primitive types
     * @param {ModelWithId} rawModel
     * @param {ModelMetadata} metadata
     */
    denormalizeModel(model: ObservableModel<ModelWithId, ModelTypes>, rawModel: ModelWithId, metadata: ModelMetadata): CoreError | null;
    validateModel(rawModel: ModelWithId, metadata: ModelMetadata): CoreError | null;
    registerModelRepository(modelType: ModelTypes, modelRepository: ModelRepository<any, any, any, ModelTypes>): void;
    /**
     * Clear all registered ModelRepositories
     * Note, you have to manually clear CustomRepositories if they has such logic
     */
    clearRepositories(): void;
}
