import { ModelWithId } from 'swagger-ts-types';
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
    const from: <TT extends ModelWithId, ER, FR>(src: any) => OptionalModel<TT>;
}
