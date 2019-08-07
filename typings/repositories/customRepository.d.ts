import { IMainRepository } from '../internals';
export declare abstract class CustomRepository {
    protected mainRepository: IMainRepository<any>;
    constructor(mainRepository: IMainRepository<any>);
    clearRepository(): void;
}
