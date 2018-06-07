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
const loadState_1 = require("./loadState");
const mobx_1 = require("mobx");
const swagger_ts_types_1 = require("swagger-ts-types");
class ModelListImpl {
    constructor(name, loadList, filter) {
        this.name = name;
        this.loadState = loadState_1.LoadState.none();
        this.total = 0;
        this.models = [];
        this.invalidModels = [];
        this.$loadList = loadList;
        this.$filter = filter;
    }
    get filter() {
        return this.$filter;
    }
    loadList() {
        return this.$loadList(this);
    }
}
__decorate([
    mobx_1.observable,
    __metadata("design:type", loadState_1.LoadState)
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
                if (swagger_ts_types_1.isModelWithId(prop) && swagger_ts_types_1.isModelWithId(model[key])) {
                    if (prop.id !== model[key].id) {
                        return false;
                    }
                }
                else {
                    if (prop !== model[key]) {
                        return false;
                    }
                }
            }
            return true;
        });
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
