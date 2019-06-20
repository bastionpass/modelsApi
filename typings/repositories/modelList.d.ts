import { LoadState } from '../internals';
import { ModelWithId } from 'swagger-ts-types';
export interface ModelList<T extends ModelWithId> {
    readonly name: string;
    readonly loadState: LoadState;
    readonly total: number;
    readonly models: T[];
    readonly invalidModels: any[];
    readonly loadList: () => Promise<any>;
    readonly filter?: {
        [key in keyof T]?: T[key];
    };
}
export declare type Filter<T> = {
    [P in keyof T]?: T[P] | (T[P])[];
};
export declare class ModelListImpl<T extends ModelWithId> implements ModelList<T> {
    name: string;
    static deserialize<T extends ModelWithId>(value: string, getModel: (id: string) => ModelWithId, loadList: (list: ModelListImpl<any>) => Promise<any>): ModelListImpl<T> | null;
    loadState: LoadState;
    total: number;
    models: T[];
    invalidModels: any[];
    readonly filter: Partial<T> | undefined;
    private $filter?;
    private $loadList;
    constructor(name: string, loadList: (list: ModelListImpl<any>) => Promise<any>, filter?: Partial<T>);
    loadList(): Promise<any>;
    serialize(): string;
}
export declare class FilteredModelListImpl<T extends ModelWithId> implements ModelList<T> {
    name: string;
    private $originalList;
    readonly loadState: LoadState;
    readonly total: number;
    readonly models: T[];
    protected compareFilterWithProp(filerProp: any, modelProp: any): boolean;
    invalidModels: any[];
    readonly filter: Filter<T>;
    private $filter;
    constructor(name: string, originalList: ModelList<T>, filter: Partial<T>);
    loadList(): Promise<any>;
}
