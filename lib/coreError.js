"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreError = void 0;
/**
 * Core error, that happens in core subsystem
 */
class CoreError {
    constructor(description) {
        this.description = description;
        this.message = description;
    }
    getErrorType() {
        return 'CoreError';
    }
    toString() { return `${this.getErrorType()}: ${this.description}`; }
}
exports.CoreError = CoreError;
