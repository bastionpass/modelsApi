"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRepository = void 0;
class CustomRepository {
    constructor(mainRepository, params) {
        this.mainRepository = mainRepository;
        mainRepository.registerRepository(this, params);
    }
    clearRepository() { }
}
exports.CustomRepository = CustomRepository;
