import { IMainRepository } from '../internals';

export abstract class CustomRepository {
  constructor(protected mainRepository: IMainRepository<any>) {
    mainRepository.registerRepository(this);
  }
  public clearRepository() {}
}
