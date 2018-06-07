import { ModelRepository, ObservableModel } from './modelRepository';
import { ObservableOptionalModel } from './optionalModel/ObservableOptionalModel';
import { UnknownModelTypeError } from './unknownModelTypeError';
import { ModelMetadata, ModelWithId } from 'swagger-ts-types';
export declare type ModelRepositoriesMap<ModelTypes extends string> = Map<ModelTypes, ModelRepository<any, any, any, ModelTypes>>;
export declare class MainRepository<ModelTypes extends string> {
    modelRepositories: ModelRepositoriesMap<ModelTypes>;
    getModelRepository<R extends ModelRepository<any, any, any, ModelTypes>>(modelType: ModelTypes): R | undefined;
    /**
     * Entry point to get Model to work with, also, could be used particular repository getModel function
     * @param {ModelTypes} modelType
     * @param {string} id
     * @return {ObservableModel<ModelWithId | T> | UnknownModelTypeError}
     */
    getModel<T extends ModelWithId>(modelType: ModelTypes, id: string): ObservableOptionalModel<T> | UnknownModelTypeError;
    /**
     * Return raw model, should be used only if you what you do, otherwise use getModel
     * @param modelType
     * @param {string} id
     * @return {ObservableModel<ModelWithId | T> | UnknownModelTypeError}
     */
    getRawModel: <T extends ModelWithId>(modelType: string, id: string) => ObservableModel<ModelWithId, ModelTypes> | (T & import("../node_modules/mobx/lib/types/observableobject").IObservableObject & {
        _loadState: import("./loadState").LoadState;
        _modelType: ModelTypes;
    }) | UnknownModelTypeError;
    isFullModel<T extends ModelWithId>(model: T | ModelWithId, modelType: ModelTypes): model is T;
    getMetadata(modelType: ModelTypes): ModelMetadata | UnknownModelTypeError;
    isKnownModelType: (arg: any) => arg is ModelTypes;
    /**
     * Denormalize, deserialize, and validate raw model, received from backend
     * Replaces links with real Models, and deserialize primitive types
     * @param {ModelWithId} rawModel
     * @param {ModelMetadata} metadata
     */
    denormalizeModel: (model: ObservableModel<ModelWithId, ModelTypes>, rawModel: ModelWithId, metadata: ModelMetadata) => Error | null;
    registerModelRepository(modelType: ModelTypes, modelRepository: ModelRepository<any, any, any>): void;
}
