"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStaticFullModel = exports.StaticOptionalModelWithOnEmptyOnFull = exports.StaticOptionalModelWithOnFull = exports.StaticOptionalModelWithOnEmpty = exports.StaticOptionalModel = exports.isBaseStaticOptionalModel = void 0;
const mobx_1 = require("mobx");
const swagger_ts_types_1 = require("swagger-ts-types");
function isBaseStaticOptionalModel(arg) {
    return arg instanceof StaticOptionalModel || arg instanceof StaticOptionalModelWithOnEmpty ||
        arg instanceof StaticOptionalModelWithOnFull || arg instanceof StaticOptionalModelWithOnEmptyOnFull;
}
exports.isBaseStaticOptionalModel = isBaseStaticOptionalModel;
/**
 * Stub for dummy models, to work with them the same way as with ObservableModel
 */
class StaticOptionalModel {
    constructor(model) {
        this.model = model;
    }
    onFull(onFullCallback) {
        return new StaticOptionalModelWithOnFull(this.model, onFullCallback);
    }
    onEmpty(onEmptyCallback) {
        return new StaticOptionalModelWithOnEmpty(this.model, onEmptyCallback);
    }
    getModel() {
        return this.model;
    }
}
exports.StaticOptionalModel = StaticOptionalModel;
class StaticOptionalModelWithOnEmpty {
    constructor(model, onEmptyCallback) {
        this.model = model;
        this.onEmptyCallback = onEmptyCallback;
    }
    onFull(onFullCallback) {
        return new StaticOptionalModelWithOnEmptyOnFull(this.model, this.onEmptyCallback, onFullCallback);
    }
    get result() {
        return isStaticFullModel(this.model)
            ? void 0
            : this.onEmptyCallback(this.model);
    }
    getModel() {
        return this.model;
    }
}
__decorate([
    mobx_1.computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], StaticOptionalModelWithOnEmpty.prototype, "result", null);
exports.StaticOptionalModelWithOnEmpty = StaticOptionalModelWithOnEmpty;
class StaticOptionalModelWithOnFull {
    constructor(model, onFullCallback) {
        this.model = model;
        this.onFullCallback = onFullCallback;
    }
    onEmpty(onEmptyCallback) {
        return new StaticOptionalModelWithOnEmptyOnFull(this.model, onEmptyCallback, this.onFullCallback);
    }
    get result() {
        return isStaticFullModel(this.model)
            ? this.onFullCallback(this.model)
            : void 0;
    }
    getModel() {
        return this.model;
    }
}
__decorate([
    mobx_1.computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], StaticOptionalModelWithOnFull.prototype, "result", null);
exports.StaticOptionalModelWithOnFull = StaticOptionalModelWithOnFull;
class StaticOptionalModelWithOnEmptyOnFull {
    constructor(model, onEmptyCallback, onFullCallback) {
        this.model = model;
        this.onEmptyCallback = onEmptyCallback;
        this.onFullCallback = onFullCallback;
    }
    get result() {
        return isStaticFullModel(this.model)
            ? this.onFullCallback(this.model)
            : this.onEmptyCallback(this.model);
    }
    getModel() {
        return this.model;
    }
}
__decorate([
    mobx_1.computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], StaticOptionalModelWithOnEmptyOnFull.prototype, "result", null);
exports.StaticOptionalModelWithOnEmptyOnFull = StaticOptionalModelWithOnEmptyOnFull;
/**
 * Return true if object contains another attributes, other than id and internal like _loasState
 * @param {ModelWithId | T} arg
 * @return {arg is T}
 */
function isStaticFullModel(arg) {
    return swagger_ts_types_1.isObject(arg) &&
        Object.getOwnPropertyNames(arg).filter(propName => propName !== 'id' && propName[0] !== '_').length > 0;
}
exports.isStaticFullModel = isStaticFullModel;
