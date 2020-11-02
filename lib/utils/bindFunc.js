"use strict";
/* tslint:disable:max-line-length */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindArgs = void 0;
function bindArgs(fn, ...args) {
    return fn.bind(null, ...args);
}
exports.bindArgs = bindArgs;
