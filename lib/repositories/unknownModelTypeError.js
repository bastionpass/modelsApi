"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coreError_1 = require("../coreError");
class UnknownModelTypeError extends coreError_1.CoreError {
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
