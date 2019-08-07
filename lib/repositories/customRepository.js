"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CustomRepository {
    constructor(mainRepository) {
        this.mainRepository = mainRepository;
        mainRepository.registerRepository(this);
    }
    clearRepository() { }
}
exports.CustomRepository = CustomRepository;
