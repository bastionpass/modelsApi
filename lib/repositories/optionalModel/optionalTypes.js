"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const staticOptionalModel_1 = require("./staticOptionalModel");
const modelRepository_1 = require("../modelRepository");
const ObservableOptionalModel_1 = require("./ObservableOptionalModel");
const inject_1 = require("../../inject/inject");
const mainRepository_1 = require("../mainRepository");
var OptionalModel;
(function (OptionalModel) {
    OptionalModel.from = (src) => {
        if (ObservableOptionalModel_1.isBaseObservableOptionType(src)) {
            return new ObservableOptionalModel_1.ObservableOptionalModel(src.getModel(), src.getModelType(), src.getMainRepository());
        }
        else if (modelRepository_1.isObservableModel(src)) {
            const mainRepository = inject_1.getInjected(inject_1.defaultInjectNamespace, mainRepository_1.MainRepository);
            return new ObservableOptionalModel_1.ObservableOptionalModel(src, src._modelType, mainRepository);
        }
        else if (staticOptionalModel_1.isBaseStaticOptionalModel(src)) {
            return new staticOptionalModel_1.StaticOptionalModel(src.getModel());
        }
        else {
            return new staticOptionalModel_1.StaticOptionalModel(src);
        }
    };
})(OptionalModel = exports.OptionalModel || (exports.OptionalModel = {}));
