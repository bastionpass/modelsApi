import { LoadState } from '../internals';
import { computed, observable } from 'mobx';
import { ModelWithId, isModelWithId, isArray } from 'swagger-ts-types';

export interface ModelList<T extends ModelWithId> {
  readonly name: string;
  readonly loadState: LoadState; // Load state of the List
  readonly total: number;        // Total number of items
  readonly models: T[];          // valid loaded models
  readonly invalidModels: any[]; // invalid loaded models
  readonly loadList: () => Promise<any>;  // Load current list
  readonly filter?: {[key in keyof T]?: T[key]};
}

export class ModelListImpl<T extends ModelWithId> implements ModelList<T> {

  @observable
  public loadState: LoadState = LoadState.none();

  @observable
  public total: number = 0;

  @observable.shallow
  public models: T[] = [];

  @observable.shallow
  public invalidModels: any[] = [];

  public get filter() {
    return this.$filter;
  }

  private $filter?: Partial<T>;

  private $loadList: (list: ModelListImpl<any>) => Promise<any>;

  constructor(public name: string,
              loadList: (list: ModelListImpl<any>) => Promise<any>,
              filter?: Partial<T>) {

    this.$loadList = loadList;
    this.$filter = filter;
  }

  public loadList(): Promise<any> {
    return this.$loadList(this);
  }

}

export class FilteredModelListImpl<T extends ModelWithId> implements ModelList<T> {

  private $originalList: ModelList<T>;

  @computed
  public get loadState() {
    return this.$originalList.loadState;
  }

  @computed
  public get total(): number {
    return this.models.length;
  }

  @computed
  public get models(): T[] {
    const filter = this.filter;
    return this.$originalList.models.filter((model) => {
      for (const key in filter) {
        const prop = filter[key];
        if (!this.compareFilterWithProp(filter[key], model[key])) {
          return false;
        }
      }
      return true;
    });
  }

  protected compareFilterWithProp(filerProp: any, modelProp: any): boolean {
    if (isModelWithId(filerProp) && isModelWithId(modelProp)) {
      // Comparing two models
      if (filerProp.id !== modelProp.id) {
        return false;
      }
    } else if (isArray(filerProp)) {
      return !!filerProp.find(item => this.compareFilterWithProp(item, modelProp));
    } else {
      // compare any other types
      if (filerProp !== modelProp) {
        return false;
      }
    }
    return true;
  }

  public invalidModels: any[] = [];

  public get filter() {
    return this.$filter;
  }

  private $filter: Partial<T>;

  constructor(public name: string, originalList: ModelList<T>, filter: Partial<T>) {
    this.$originalList = originalList;
    this.$filter = filter;
  }

  public loadList(): Promise<any> {
    return this.$originalList.loadList();
  }
}
