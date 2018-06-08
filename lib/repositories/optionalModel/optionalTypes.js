"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internals_1 = require("../../internals");
var OptionalModel;
(function (OptionalModel) {
    OptionalModel.from = (src) => {
        if (internals_1.isBaseObservableOptionType(src)) {
            return new internals_1.ObservableOptionalModel(src.getModel(), src.getModelType(), src.getMainRepository());
        }
        else if (internals_1.isObservableModel(src)) {
            const mainRepository = internals_1.getInjected(internals_1.defaultInjectNamespace, internals_1.MainRepository);
            return new internals_1.ObservableOptionalModel(src, src._modelType, mainRepository);
        }
        else if (internals_1.isBaseStaticOptionalModel(src)) {
            return new internals_1.StaticOptionalModel(src.getModel());
        }
        else {
            return new internals_1.StaticOptionalModel(src);
        }
    };
})(OptionalModel = exports.OptionalModel || (exports.OptionalModel = {}));
