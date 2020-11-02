import { OptionalModel, OptionalModelWithOnFull, OptionalModelWithOnEmptyOnFull, OptionalModelWithOnEmpty, BaseOptionalModel } from '../../internals';
import { ModelWithId } from 'swagger-ts-types';
declare type BaseStaticOptionalModel<T extends ModelWithId> = BaseOptionalModel<T>;
export declare function isBaseStaticOptionalModel(arg: any): arg is BaseStaticOptionalModel<any>;
/**
 * Stub for dummy models, to work with them the same way as with ObservableModel
 */
export declare class StaticOptionalModel<T extends ModelWithId> implements OptionalModel<T> {
    protected model: T | ModelWithId | undefined | null;
    constructor(model: T | ModelWithId | undefined | null);
    onFull<FR>(onFullCallback: ((model: T) => FR)): StaticOptionalModelWithOnFull<T, FR>;
    onEmpty<ER>(onEmptyCallback: (model: ModelWithId | undefined | null) => ER): StaticOptionalModelWithOnEmpty<T, ER>;
    getModel(): T | ModelWithId | undefined | null;
}
export declare class StaticOptionalModelWithOnEmpty<T extends ModelWithId, ER> implements OptionalModelWithOnEmpty<T, ER> {
    protected model: T | ModelWithId | undefined | null;
    protected onEmptyCallback: (model: ModelWithId | undefined | null) => ER;
    constructor(model: T | ModelWithId | undefined | null, onEmptyCallback: (model: ModelWithId | undefined | null) => ER);
    onFull<FR>(onFullCallback: ((model: T) => FR)): StaticOptionalModelWithOnEmptyOnFull<T, ER, FR>;
    get result(): ER | undefined;
    getModel(): T | ModelWithId | undefined | null;
}
export declare class StaticOptionalModelWithOnFull<T extends ModelWithId, FR> implements OptionalModelWithOnFull<T, FR> {
    protected model: T | ModelWithId | undefined | null;
    protected onFullCallback: (model: T) => FR;
    constructor(model: T | ModelWithId | undefined | null, onFullCallback: (model: T) => FR);
    onEmpty<ER>(onEmptyCallback: ((model: ModelWithId | undefined | null) => ER)): StaticOptionalModelWithOnEmptyOnFull<T, ER, FR>;
    get result(): FR | undefined;
    getModel(): T | ModelWithId | undefined | null;
}
export declare class StaticOptionalModelWithOnEmptyOnFull<T extends ModelWithId, ER, FR> implements OptionalModelWithOnEmptyOnFull<T, ER, FR> {
    protected model: T | ModelWithId | undefined | null;
    protected onEmptyCallback: (model: ModelWithId | undefined | null) => ER;
    protected onFullCallback: (model: T) => FR;
    constructor(model: T | ModelWithId | undefined | null, onEmptyCallback: (model: ModelWithId | undefined | null) => ER, onFullCallback: (model: T) => FR);
    get result(): ER | FR;
    getModel(): T | ModelWithId | undefined | null;
}
/**
 * Return true if object contains another attributes, other than id and internal like _loasState
 * @param {ModelWithId | T} arg
 * @return {arg is T}
 */
export declare function isStaticFullModel<T>(arg: T | ModelWithId | undefined | null): arg is T;
export {};
