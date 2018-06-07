import { ModelWithId } from 'swagger-ts-types';
import { ObservableModel } from '../observableModel';
export interface BaseOptionalModel<T extends ModelWithId> {
    getModel: () => T | ModelWithId | undefined | null;
}
export interface OptionalModel<T extends ModelWithId> extends BaseOptionalModel<T> {
    onEmpty: <ER>(callback: (model: ModelWithId | undefined | null) => ER) => OptionalModelWithOnEmpty<T, ER>;
    onFull: <FR>(callback: (model: T) => FR) => OptionalModelWithOnFull<T, FR>;
}
export interface OptionalModelWithOnEmpty<T extends ModelWithId, ER> extends BaseOptionalModel<T> {
    onFull: <FR>(callback: (model: T) => FR) => OptionalModelWithOnEmptyOnFull<T, ER, FR>;
}
export interface OptionalModelWithOnFull<T extends ModelWithId, FR> extends BaseOptionalModel<T> {
    onEmpty: <ER>(callback: (model: ModelWithId | undefined | null) => ER) => OptionalModelWithOnEmptyOnFull<T, ER, FR>;
}
export interface OptionalModelWithOnEmptyOnFull<T extends ModelWithId, ER, FR> extends BaseOptionalModel<T> {
    result: ER | FR;
}
export declare module OptionalModel {
    const from: <TT extends ModelWithId, ER, FR, ModelType extends string>(src: TT | OptionalModel<TT> | OptionalModelWithOnEmpty<TT, ER> | OptionalModelWithOnFull<TT, any> | OptionalModelWithOnEmptyOnFull<TT, ER, FR> | ObservableModel<TT, ModelType> | null | undefined) => OptionalModel<TT>;
}
