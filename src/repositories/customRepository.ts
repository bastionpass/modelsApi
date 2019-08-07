import { IMainRepository } from '../internals';

export abstract class CustomRepository {
  constructor(protected mainRepository: IMainRepository<any>, params?: any) {
    mainRepository.registerRepository(this, params);
  }
  public clearRepository() {}
}
