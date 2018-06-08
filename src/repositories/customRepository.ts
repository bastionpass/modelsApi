import { IMainRepository } from '../internals';

export abstract class CustomRepository<ModelTypes extends string> {
  constructor(protected mainRepository: IMainRepository<ModelTypes>) {}
}
