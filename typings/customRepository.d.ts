import { MainRepository } from './mainRepository';
export declare abstract class CustomRepository<ModelTypes extends string> {
    protected mainRepository: MainRepository<ModelTypes>;
    constructor(mainRepository: MainRepository<ModelTypes>);
}
