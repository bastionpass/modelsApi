import { BaseOptionalModel, ObservableModel, OptionalModel, OptionalModelWithOnEmpty, OptionalModelWithOnEmptyOnFull, OptionalModelWithOnFull, IMainRepository } from '../../internals';
import { ModelWithId } from 'swagger-ts-types';
export interface BaseObservableOptionalModel<T extends ModelWithId, ModelTypes extends string> extends BaseOptionalModel<T> {
    getModelType: () => ModelTypes;
    getMainRepository: () => IMainRepository<ModelTypes>;
}
export declare function isBaseObservableOptionType<ModelType extends string>(arg: any): arg is BaseObservableOptionalModel<any, ModelType>;
/**
 * OptionalModel is a selector used to process model, which could be fully loaded or partially (empty) loaded
 * onFullCallback is called if model is fully loaded, onEmptyCallback is called otherwise
 * Current result could be obtained via getter 'result'
 * How to use in a Component render:
 * optionalModel.onEmpty((model) => return <CLoader/>).onFull((model) => <CModelCard model={model}/>)
 * Because model is observable the Component will re-render when model changes (e.g. been loaded)
 */
export declare class ObservableOptionalModel<T extends ModelWithId, ModelTypes extends string> implements OptionalModel<T>, BaseObservableOptionalModel<T, ModelTypes> {
    protected model: ObservableModel<T | ModelWithId, ModelTypes>;
    protected modelType: ModelTypes;
    protected mainRepository: IMainRepository<ModelTypes>;
    constructor(model: ObservableModel<T | ModelWithId, ModelTypes>, modelType: ModelTypes, mainRepository: IMainRepository<ModelTypes>);
    onFull<FR>(onFullCallback: ((model: T) => FR)): OptionalModelWithOnFull<T, FR>;
    onEmpty<ER>(onEmptyCallback: (model: ModelWithId | undefined | null) => ER): ObservableOptionalModelWithOnEmpty<T, ER, ModelTypes>;
    /**
     * This function returns model of current state: full or empty fro further manual checking
     * @return {ModelWithId | T}
     */
    getModel(): ObservableModel<T | ModelWithId, ModelTypes>;
    getModelType(): ModelTypes;
    getMainRepository(): IMainRepository<ModelTypes>;
}
export declare class ObservableOptionalModelWithOnEmpty<T extends ModelWithId, ER, ModelTypes extends string> implements OptionalModelWithOnEmpty<T, ER>, BaseObservableOptionalModel<T, ModelTypes> {
    protected model: ObservableModel<T | ModelWithId, ModelTypes>;
    protected modelType: ModelTypes;
    protected mainRepository: IMainRepository<ModelTypes>;
    protected onEmptyCallback: (model: ModelWithId | undefined | null) => ER;
    constructor(model: ObservableModel<T | ModelWithId, ModelTypes>, modelType: ModelTypes, mainRepository: IMainRepository<ModelTypes>, onEmptyCallback: (model: ModelWithId | undefined | null) => ER);
    onFull<FR>(onFullCallback: ((model: T) => FR)): ObservableOptionalModelWithOnEmptyOnFull<T, ER, FR, ModelTypes>;
    get result(): ER | undefined;
    getModel(): ObservableModel<T | ModelWithId, ModelTypes>;
    getModelType(): ModelTypes;
    getMainRepository(): IMainRepository<ModelTypes>;
}
export declare class ObservableOptionalModelWithOnFull<T extends ModelWithId, FR, ModelTypes extends string> implements OptionalModelWithOnFull<T, FR>, BaseObservableOptionalModel<T, ModelTypes> {
    protected model: ObservableModel<T | ModelWithId, ModelTypes>;
    protected modelType: ModelTypes;
    protected mainRepository: IMainRepository<ModelTypes>;
    protected onFullCallback: (model: T) => FR;
    constructor(model: ObservableModel<T | ModelWithId, ModelTypes>, modelType: ModelTypes, mainRepository: IMainRepository<ModelTypes>, onFullCallback: (model: T) => FR);
    onEmpty<ER>(onEmptyCallback: ((model: ModelWithId | undefined | null) => ER)): OptionalModelWithOnEmptyOnFull<T, ER, FR>;
    get result(): FR | undefined;
    getModel(): ObservableModel<T | ModelWithId, ModelTypes>;
    getModelType(): ModelTypes;
    getMainRepository(): IMainRepository<ModelTypes>;
}
export declare class ObservableOptionalModelWithOnEmptyOnFull<T extends ModelWithId, ER, FR, ModelTypes extends string> implements OptionalModelWithOnEmptyOnFull<T, ER, FR>, BaseObservableOptionalModel<T, ModelTypes> {
    protected model: ObservableModel<T | ModelWithId, ModelTypes>;
    protected modelType: ModelTypes;
    protected mainRepository: IMainRepository<ModelTypes>;
    protected onEmptyCallback: (model: ModelWithId | undefined | null) => ER;
    protected onFullCallback: (model: T) => FR;
    constructor(model: ObservableModel<T | ModelWithId, ModelTypes>, modelType: ModelTypes, mainRepository: IMainRepository<ModelTypes>, onEmptyCallback: (model: ModelWithId | undefined | null) => ER, onFullCallback: (model: T) => FR);
    get result(): ER | FR;
    getModel(): ObservableModel<T | ModelWithId, ModelTypes>;
    getModelType(): ModelTypes;
    getMainRepository(): IMainRepository<ModelTypes>;
}
