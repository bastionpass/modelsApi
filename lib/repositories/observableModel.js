"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internals_1 = require("../internals");
const swagger_ts_types_1 = require("swagger-ts-types");
function isObservableModel(arg) {
    return swagger_ts_types_1.isObject(arg) && arg._loadState instanceof internals_1.LoadState && arg._modelType;
}
exports.isObservableModel = isObservableModel;
