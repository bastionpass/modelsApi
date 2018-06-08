import { IMainRepository } from '../internals';
export declare abstract class CustomRepository<ModelTypes extends string> {
    protected mainRepository: IMainRepository<ModelTypes>;
    constructor(mainRepository: IMainRepository<ModelTypes>);
}
