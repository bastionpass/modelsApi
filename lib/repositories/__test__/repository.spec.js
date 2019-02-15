"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internals_1 = require("../../internals");
const mobx_1 = require("mobx");
const swagger_ts_types_1 = require("swagger-ts-types");
const modelType = 'ModelType';
function isMyModel(arg) {
    return swagger_ts_types_1.isObject(arg) && arg.name && arg.myModel;
}
const myModelMetadata = {
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
class MyModelRepository extends internals_1.ModelRepository {
    constructor(mainRepository) {
        super(myModelMetadata.modelType, myModelMetadata, isMyModel, mainRepository);
    }
    fetchModel(id) {
        // There's no fetch model on API, so we have to request all accounts
        return null;
    }
    fetchList(name) {
        return new Promise(resolve => resolve([rawModel]));
    }
    create(saveModel) {
        return new Promise(() => null);
    }
    update(saveModel) {
        return new Promise(() => null);
    }
    getCreateResponseModel(response) {
        return new Promise(() => null);
    }
    getUpdateResponseModel(response) {
        return new Promise(() => null);
    }
    deleteOne(model) {
        return new Promise(() => null);
    }
}
class BadMyModelRepository extends MyModelRepository {
    fetchList(name) {
        return new Promise(resolve => resolve(badRawModels));
    }
}
exports.log = new internals_1.Log();
exports.log.onLogEntry(logEntry => console.warn(logEntry.error, logEntry), internals_1.LogLevel.ERROR);
exports.log.onLogEntry(logEntry => console.warn(logEntry.message, logEntry), internals_1.LogLevel.WARNING);
exports.log.onLogEntry(logEntry => console.log(logEntry.message, logEntry), internals_1.LogLevel.INFO);
exports.log.onLogEntry(logEntry => console.log(logEntry.message, logEntry), internals_1.LogLevel.DEBUG);
internals_1.initializeInject(new internals_1.InjectionMap([
    [internals_1.Log, exports.log],
]));
describe('Repositories', () => {
    it('Repository sanity check.', () => {
        const mainRepository = new internals_1.MainRepository();
        mainRepository.registerModelRepository(modelType, new MyModelRepository(mainRepository));
        const result = mainRepository.getRawModel(modelType, modelId);
        expect.assertions(4);
        expect(result).toEqual(expect.objectContaining({
            _loadState: internals_1.LoadState.pending(),
            id: modelId,
        }));
        expect(mobx_1.isObservable(result)).toBeTruthy();
        jest.setTimeout(500);
        return new Promise((resolve) => {
            if (!internals_1.isUnknownModelTypeError(result)) {
                mobx_1.autorun(() => {
                    if (!result._loadState.isNoneOrPending()) {
                        resolve(result);
                    }
                });
            }
        }).then((result) => {
            expect((result)._loadState).toBeInstanceOf(internals_1.DoneState);
            expect(result.myModel).toEqual(result);
        });
    });
    it('Repository reaction on bad models from backend', () => {
        expect.assertions(6);
        const mainRepository = new internals_1.MainRepository();
        mainRepository.registerModelRepository(modelType, new BadMyModelRepository(mainRepository));
        {
            const badRepo = mainRepository.getModelRepository('Account');
            expect(badRepo).toEqual(void 0);
        }
        const repo = mainRepository.getModelRepository(modelType);
        expect(repo).toBeInstanceOf(BadMyModelRepository);
        if (repo) {
            const list = repo.getList();
            expect(list).toBeInstanceOf(internals_1.ModelListImpl);
            jest.setTimeout(500);
            return new Promise((resolve) => {
                const disposer = mobx_1.autorun(() => {
                    if (list.loadState.isError()) {
                        resolve(list);
                    }
                });
            }).then((result) => {
                expect(result.loadState).toBeInstanceOf(internals_1.ErrorState);
                expect(result.models.length).toEqual(0);
                expect(result.invalidModels.length).toEqual(6);
            });
        }
    });
    it('Repository reaction on good models from backend', () => {
        expect.assertions(5);
        const mainRepository = new internals_1.MainRepository();
        mainRepository.registerModelRepository(modelType, new MyModelRepository(mainRepository));
        const repo = mainRepository.getModelRepository(modelType);
        expect(repo).toBeInstanceOf(MyModelRepository);
        if (repo) {
            const list = repo.getList();
            expect(list).toBeInstanceOf(internals_1.ModelListImpl);
            jest.setTimeout(500);
            return new Promise((resolve) => {
                const disposer = mobx_1.autorun(() => {
                    if (list.loadState.isDone()) {
                        resolve(list);
                    }
                });
            }).then((result) => {
                expect(result.loadState).toBeInstanceOf(internals_1.DoneState);
                expect(result.models.length).toEqual(1);
                expect(result.invalidModels.length).toEqual(0);
            });
        }
    });
    it('Repository optional model.', () => {
        expect.assertions(5);
        const mainRepository = new internals_1.MainRepository();
        mainRepository.registerModelRepository(modelType, new MyModelRepository(mainRepository));
        const optionalModel = mainRepository.getModel(modelType, modelId);
        expect(optionalModel).toBeInstanceOf(internals_1.ObservableOptionalModel);
        expect(internals_1.isUnknownModelTypeError(optionalModel)).toBeFalsy();
        if (!internals_1.isUnknownModelTypeError(optionalModel)) {
            expect(optionalModel.getModel()).toEqual(expect.objectContaining({
                _loadState: internals_1.LoadState.pending(),
                id: modelId,
            }));
            const optionalWithAll = optionalModel
                .onEmpty(() => 'Empty')
                .onFull(() => 'Full');
            expect(optionalWithAll.result).toEqual('Empty');
            jest.setTimeout(500);
            return new Promise((resolve) => {
                mobx_1.autorun(() => {
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
        const mainRepository = new internals_1.MainRepository();
        const myModelRepository = new MyModelRepository(mainRepository);
        mainRepository.registerModelRepository(modelType, myModelRepository);
        myModelRepository.consumeModel(rawModel);
        expect(myModelRepository.getList().models.length).toEqual(1);
        myModelRepository.consumeModel({ id: rawModel.id, metadata: {
                deleted: true,
            } });
        expect(myModelRepository.getList().models.length).toEqual(0);
    });
});
