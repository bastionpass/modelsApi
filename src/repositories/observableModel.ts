import { LoadState } from '../internals';
import { isObject, ModelWithId } from 'swagger-ts-types';
import { IObservableObject } from 'mobx/lib/types/observableobject';

export type ObservableModel<T extends ModelWithId, ModelTypes extends string> = T & IObservableObject & {
  _loadState: LoadState;
  _modelType: ModelTypes;
};

export function isObservableModel<T extends ModelWithId, ModelTypes extends string>(arg: any):
  arg is ObservableModel<T, ModelTypes> {
  return isObject(arg) && arg._loadState instanceof LoadState && arg._modelType;
}
