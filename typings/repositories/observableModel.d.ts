import { LoadState } from '../internals';
import { ModelWithId } from 'swagger-ts-types';
import { IObservableObject } from 'mobx/lib/types/observableobject';
export declare type ObservableModel<T extends ModelWithId, ModelTypes extends string> = T & IObservableObject & {
    _loadState: LoadState;
    _modelType: ModelTypes;
};
export declare function isObservableModel<T extends ModelWithId, ModelTypes extends string>(arg: any): arg is ObservableModel<T, ModelTypes>;
