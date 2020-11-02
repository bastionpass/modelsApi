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
exports.ObservableOptionalModelWithOnEmptyOnFull = exports.ObservableOptionalModelWithOnFull = exports.ObservableOptionalModelWithOnEmpty = exports.ObservableOptionalModel = exports.isBaseObservableOptionType = void 0;
const mobx_1 = require("mobx");
function isBaseObservableOptionType(arg) {
    return arg instanceof ObservableOptionalModel || arg instanceof ObservableOptionalModelWithOnEmpty ||
        arg instanceof ObservableOptionalModelWithOnFull || arg instanceof ObservableOptionalModelWithOnEmptyOnFull;
}
exports.isBaseObservableOptionType = isBaseObservableOptionType;
/**
 * OptionalModel is a selector used to process model, which could be fully loaded or partially (empty) loaded
 * onFullCallback is called if model is fully loaded, onEmptyCallback is called otherwise
 * Current result could be obtained via getter 'result'
 * How to use in a Component render:
 * optionalModel.onEmpty((model) => return <CLoader/>).onFull((model) => <CModelCard model={model}/>)
 * Because model is observable the Component will re-render when model changes (e.g. been loaded)
 */
class ObservableOptionalModel {
    constructor(model, modelType, mainRepository) {
        this.model = model;
        this.modelType = modelType;
        this.mainRepository = mainRepository;
    }
    onFull(onFullCallback) {
        return new ObservableOptionalModelWithOnFull(this.model, this.modelType, this.mainRepository, onFullCallback);
    }
    onEmpty(onEmptyCallback) {
        return new ObservableOptionalModelWithOnEmpty(this.model, this.modelType, this.mainRepository, onEmptyCallback);
    }
    /**
     * This function returns model of current state: full or empty fro further manual checking
     * @return {ModelWithId | T}
     */
    getModel() {
        return this.model;
    }
    getModelType() {
        return this.modelType;
    }
    getMainRepository() {
        return this.mainRepository;
    }
}
exports.ObservableOptionalModel = ObservableOptionalModel;
class ObservableOptionalModelWithOnEmpty {
    constructor(model, modelType, mainRepository, onEmptyCallback) {
        this.model = model;
        this.modelType = modelType;
        this.mainRepository = mainRepository;
        this.onEmptyCallback = onEmptyCallback;
    }
    onFull(onFullCallback) {
        return new ObservableOptionalModelWithOnEmptyOnFull(this.model, this.modelType, this.mainRepository, this.onEmptyCallback, onFullCallback);
    }
    get result() {
        return isFullModel(this.model, this.modelType, this.mainRepository)
            ? void 0
            : this.onEmptyCallback(this.model);
    }
    getModel() {
        return this.model;
    }
    getModelType() {
        return this.modelType;
    }
    getMainRepository() {
        return this.mainRepository;
    }
}
__decorate([
    mobx_1.computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], ObservableOptionalModelWithOnEmpty.prototype, "result", null);
exports.ObservableOptionalModelWithOnEmpty = ObservableOptionalModelWithOnEmpty;
class ObservableOptionalModelWithOnFull {
    constructor(model, modelType, mainRepository, onFullCallback) {
        this.model = model;
        this.modelType = modelType;
        this.mainRepository = mainRepository;
        this.onFullCallback = onFullCallback;
    }
    onEmpty(onEmptyCallback) {
        return new ObservableOptionalModelWithOnEmptyOnFull(this.model, this.modelType, this.mainRepository, onEmptyCallback, this.onFullCallback);
    }
    get result() {
        return isFullModel(this.model, this.modelType, this.mainRepository)
            ? this.onFullCallback(this.model)
            : void 0;
    }
    getModel() {
        return this.model;
    }
    getModelType() {
        return this.modelType;
    }
    getMainRepository() {
        return this.mainRepository;
    }
}
__decorate([
    mobx_1.computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], ObservableOptionalModelWithOnFull.prototype, "result", null);
exports.ObservableOptionalModelWithOnFull = ObservableOptionalModelWithOnFull;
class ObservableOptionalModelWithOnEmptyOnFull {
    constructor(model, modelType, mainRepository, onEmptyCallback, onFullCallback) {
        this.model = model;
        this.modelType = modelType;
        this.mainRepository = mainRepository;
        this.onEmptyCallback = onEmptyCallback;
        this.onFullCallback = onFullCallback;
    }
    get result() {
        return isFullModel(this.model, this.modelType, this.mainRepository)
            ? this.onFullCallback(this.model)
            : this.onEmptyCallback(this.model);
    }
    getModel() {
        return this.model;
    }
    getModelType() {
        return this.modelType;
    }
    getMainRepository() {
        return this.mainRepository;
    }
}
__decorate([
    mobx_1.computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], ObservableOptionalModelWithOnEmptyOnFull.prototype, "result", null);
exports.ObservableOptionalModelWithOnEmptyOnFull = ObservableOptionalModelWithOnEmptyOnFull;
function isFullModel(model, modelType, mainRepository, visitedCtx) {
    const visited = visitedCtx || new WeakMap();
    if (mainRepository.isFullModel(model, modelType)) {
        return true;
        // visited.set(model, true);
        // Now check all subModels
        /* const metadata = mainRepository.getMetadata(modelType);
        if (isModelMetadata(metadata)) {
          return Object.keys(metadata.fields).find((key) => {
            // We need to find not full sub model
            const field = metadata.fields[key];
            if (field.types.indexOf('link') >= 0) {
              if (field.types.indexOf('null') >= 0 && model[key] === null) {
                return true;
              }
    
              if (mainRepository.isKnownModelType(field.subType)) {
                return visited.has(model[key])
                  ? !visited.get(model[key])
                  : isFullModel(model[key], field.subType, mainRepository, visited);
              }
            }
            return false;
          }) === void 0;
        }*/
    }
    return false;
}
