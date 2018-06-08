"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internals_1 = require("../internals");
class UnknownModelTypeError extends internals_1.CoreError {
    constructor(modelType) {
        super(`Unknown ModelType: ${modelType}`);
        this.modelType = modelType;
    }
}
exports.UnknownModelTypeError = UnknownModelTypeError;
function isUnknownModelTypeError(arg) {
    return arg instanceof UnknownModelTypeError;
}
exports.isUnknownModelTypeError = isUnknownModelTypeError;
