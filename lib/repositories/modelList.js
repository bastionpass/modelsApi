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
exports.FilteredModelListImpl = exports.ModelListImpl = void 0;
const mobx_1 = require("mobx");
const swagger_ts_types_1 = require("swagger-ts-types");
const internals_1 = require("../internals");
class ModelListImpl {
    constructor(name, loadList, filter) {
        this.name = name;
        this.loadState = internals_1.LoadState.none();
        this.total = 0;
        this.models = [];
        this.invalidModels = [];
        this.$loadList = loadList;
        this.$filter = filter;
    }
    static deserialize(value, getModel, loadList) {
        try {
            const data = JSON.parse(value);
            const { name, filter, models } = data;
            if (name && filter && models) {
                const result = new ModelListImpl(name, loadList, JSON.parse(filter));
                models.forEach((modelId) => result.models.push(getModel(modelId)));
                return result;
            }
        }
        catch (e) { }
        return null;
    }
    get filter() {
        return this.$filter;
    }
    loadList() {
        return this.$loadList(this);
    }
    serialize() {
        return JSON.stringify({
            name: this.name,
            filter: this.$filter,
            models: this.models.map((model) => model.id),
        });
    }
}
__decorate([
    mobx_1.observable,
    __metadata("design:type", internals_1.LoadState)
], ModelListImpl.prototype, "loadState", void 0);
__decorate([
    mobx_1.observable,
    __metadata("design:type", Number)
], ModelListImpl.prototype, "total", void 0);
__decorate([
    mobx_1.observable.shallow,
    __metadata("design:type", Array)
], ModelListImpl.prototype, "models", void 0);
__decorate([
    mobx_1.observable.shallow,
    __metadata("design:type", Array)
], ModelListImpl.prototype, "invalidModels", void 0);
exports.ModelListImpl = ModelListImpl;
class FilteredModelListImpl {
    constructor(name, originalList, filter) {
        this.name = name;
        this.invalidModels = [];
        this.$originalList = originalList;
        this.$filter = filter;
    }
    get loadState() {
        return this.$originalList.loadState;
    }
    get total() {
        return this.models.length;
    }
    get models() {
        const filter = this.filter;
        return this.$originalList.models.filter((model) => {
            for (const key in filter) {
                const prop = filter[key];
                if (!this.compareFilterWithProp(filter[key], model[key])) {
                    return false;
                }
            }
            return true;
        });
    }
    compareFilterWithProp(filerProp, modelProp) {
        if (swagger_ts_types_1.isModelWithId(filerProp) && swagger_ts_types_1.isModelWithId(modelProp)) {
            // Comparing two models
            if (filerProp.id !== modelProp.id) {
                return false;
            }
        }
        else if (swagger_ts_types_1.isArray(filerProp)) {
            return !!filerProp.find((item) => this.compareFilterWithProp(item, modelProp));
        }
        else {
            // compare any other types
            if (filerProp !== modelProp) {
                return false;
            }
        }
        return true;
    }
    get filter() {
        return this.$filter;
    }
    loadList() {
        return this.$originalList.loadList();
    }
}
__decorate([
    mobx_1.computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], FilteredModelListImpl.prototype, "loadState", null);
__decorate([
    mobx_1.computed,
    __metadata("design:type", Number),
    __metadata("design:paramtypes", [])
], FilteredModelListImpl.prototype, "total", null);
__decorate([
    mobx_1.computed,
    __metadata("design:type", Array),
    __metadata("design:paramtypes", [])
], FilteredModelListImpl.prototype, "models", null);
exports.FilteredModelListImpl = FilteredModelListImpl;
