import {
  ModelRepository ,
  MainRepository,
  DoneState,
  ErrorState,
  LoadState,
  isUnknownModelTypeError,
  ModelList,
  ModelListImpl,
  ObservableOptionalModel,
  Log,
  LogLevel,
  initializeInject,
  InjectionMap,
  ObservableModel,
} from '../../internals';

import { autorun, isObservable } from 'mobx';
import { isObject, ModelMetadata, ModelWithId } from 'swagger-ts-types';

const modelType = 'ModelType';

type ModelTypes = 'ModelType';

interface MyModel {
  id: string;
  name: string;
  myModel: MyModel;
}

function isMyModel(arg: any): arg is MyModel {
  return isObject(arg) && arg.name && arg.myModel;
}

const myModelMetadata: ModelMetadata = {
  modelType,
  emptyModel: { id: void 0, name: void 0, myModel: void 0 },
  fields: {
    id: {
      name: 'id',
      types: ['string'],
      subType: '',
      isRequired: true,
      apiField: 'id',
    },
    name: {
      name: 'name',
      types: ['string'],
      subType: '',
      isRequired: true,
      apiField: 'name',
    },
    myModel: {
      name: 'myModel',
      types: ['link'],
      subType: modelType,
      isRequired: true,
      apiField: 'myModelId',
    },
  },
};

const modelId = '2497afaa-b03c-4b05-9c0c-7088cbadf4be';

const rawModel = {
  id: modelId,
  name: 'name',
  myModelId: modelId,
};

const badRawModels = [
  null,
  123,
  'Want your bad romance.',
  [1, 2, 3],
  {
    hallo: 'you fucked',
  },
  {
    id: modelId,
    why: 'not so bad',
  },
];

interface MyModelRequestResponse {
}

class MyModelRepository extends ModelRepository<MyModel,
  MyModelRequestResponse,
  MyModelRequestResponse,
  ModelTypes> {

  constructor(mainRepository: MainRepository<ModelTypes>) {
    super(myModelMetadata.modelType as ModelTypes, myModelMetadata, isMyModel, mainRepository);
  }

  protected fetchModel(id: string): Promise<any> | null {
    // There's no fetch model on API, so we have to request all accounts
    return null;
  }

  protected fetchList(name: string): Promise<any[]> {
    return new Promise(resolve => setTimeout(() => resolve([rawModel]), 100));
  }

  protected create(saveModel: MyModelRequestResponse) {
    return new Promise<MyModelRequestResponse>(() => null);
  }

  protected update(saveModel: MyModelRequestResponse) {
    return new Promise<MyModelRequestResponse>(() => null);
  }

  protected getCreateResponseModel(response: MyModelRequestResponse): any {
    return new Promise<MyModelRequestResponse>(() => null);
  }

  protected getUpdateResponseModel(response: MyModelRequestResponse): any {
    return new Promise<MyModelRequestResponse>(() => null);
  }

  protected deleteOne(model: MyModel): Promise<any> {
    return new Promise<MyModelRequestResponse>(() => null);
  }
}

class BadMyModelRepository extends MyModelRepository {
  protected fetchList(name: string): Promise<any[]> {
    return new Promise(resolve => resolve(badRawModels));
  }
}

export const log = new Log();

log.onLogEntry(logEntry => console.warn(logEntry.error, logEntry), LogLevel.ERROR);
log.onLogEntry(logEntry => console.warn(logEntry.message, logEntry), LogLevel.WARNING);
log.onLogEntry(logEntry => console.log(logEntry.message, logEntry), LogLevel.INFO);
log.onLogEntry(logEntry => console.log(logEntry.message, logEntry), LogLevel.DEBUG);

initializeInject(new InjectionMap([
  [Log, log],
]));

describe('Repositories', () => {
  it('Repository sanity check.', () => {

    const mainRepository = new MainRepository<ModelTypes>();
    mainRepository.registerRepository(new MyModelRepository(mainRepository), modelType);

    const result = mainRepository.getRawModel(modelType as ModelTypes, modelId);

    expect.assertions(4);

    expect(result).toEqual(expect.objectContaining({
      _loadState: LoadState.pending(),
      id: modelId,
    }));

    expect(isObservable(result)).toBeTruthy();

    jest.setTimeout(500);

    return new Promise<ObservableModel<MyModel, ModelTypes>>((resolve) => {
      if (!isUnknownModelTypeError(result)) {
        autorun(() => {
          if (!result._loadState.isNoneOrPending()) {
            resolve(result as ObservableModel<MyModel, ModelTypes>);
          }
        });
      }
    }).then((result) => {
      expect((result)._loadState).toBeInstanceOf(DoneState);
      expect(result.myModel).toEqual(result);
    });
  });

  it('Repository reaction on bad models from backend', () => {
    expect.assertions(6);

    const mainRepository = new MainRepository<ModelTypes>();
    mainRepository.registerRepository(new BadMyModelRepository(mainRepository), modelType);

    {
      const badRepo = mainRepository.getModelRepository<BadMyModelRepository>('Account' as ModelTypes);
      expect(badRepo).toEqual(void 0);
    }

    const repo = mainRepository.getModelRepository<BadMyModelRepository>(modelType as ModelTypes);
    expect(repo).toBeInstanceOf(BadMyModelRepository);

    if (repo) {
      const list = repo.getList();
      expect(list).toBeInstanceOf(ModelListImpl);

      jest.setTimeout(500);

      return new Promise<ModelList<MyModel>>((resolve) => {
        const disposer = autorun(() => {
          if (list.loadState.isError()) {
            resolve(list);
          }
        });
      }).then((result) => {
        expect(result.loadState).toBeInstanceOf(ErrorState);
        expect(result.models.length).toEqual(0);
        expect(result.invalidModels.length).toEqual(6);
      });
    }
  });

  it('Repository reaction on good models from backend', () => {
    expect.assertions(5);

    const mainRepository = new MainRepository<ModelTypes>();
    mainRepository.registerRepository(new MyModelRepository(mainRepository), modelType);

    const repo = mainRepository.getModelRepository<MyModelRepository>(modelType as ModelTypes);
    expect(repo).toBeInstanceOf(MyModelRepository);

    if (repo) {
      const list = repo.getList();
      expect(list).toBeInstanceOf(ModelListImpl);

      jest.setTimeout(500);

      return new Promise<ModelList<MyModel>>((resolve) => {
        const disposer = autorun(() => {
          if (list.loadState.isDone()) {
            resolve(list);
          }
        });
      }).then((result) => {
        expect(result.loadState).toBeInstanceOf(DoneState);
        expect(result.models.length).toEqual(1);
        expect(result.invalidModels.length).toEqual(0);
      });
    }
  });

  it('Repository optional model.', () => {

    expect.assertions(5);

    const mainRepository = new MainRepository<ModelTypes>();
    mainRepository.registerRepository(new MyModelRepository(mainRepository), modelType);

    const optionalModel = mainRepository.getModel(modelType as ModelTypes, modelId);

    expect(optionalModel).toBeInstanceOf(ObservableOptionalModel);
    expect(isUnknownModelTypeError(optionalModel)).toBeFalsy();

    if (!isUnknownModelTypeError(optionalModel)) {

      expect(optionalModel.getModel()).toEqual(expect.objectContaining({
        _loadState: LoadState.pending(),
        id: modelId,
      }));

      const optionalWithAll = optionalModel
        .onEmpty(() => 'Empty')
        .onFull(() => 'Full');

      expect(optionalWithAll.result).toEqual('Empty');

      jest.setTimeout(500);

      return new Promise<ObservableOptionalModel<ModelWithId, ModelTypes>>((resolve) => {

        autorun(() => {
          if (!optionalModel.getModel()._loadState.isNoneOrPending()) {
            resolve(optionalModel);
          }
        });
      }).then((optionalModel) => {
        expect(optionalWithAll.result).toEqual('Full');
      });
    }
  });

  it('Consume deleted model', () => {
    const mainRepository = new MainRepository<ModelTypes>();
    const myModelRepository = new MyModelRepository(mainRepository);
    mainRepository.registerRepository(myModelRepository, modelType);

    myModelRepository.consumeModel(rawModel);

    expect(myModelRepository.getList().models.length).toEqual(1);

    myModelRepository.consumeModel({id:rawModel.id, metadata: {
      deleted: true,
    }});

    expect(myModelRepository.getList().models.length).toEqual(0);

  });

});
