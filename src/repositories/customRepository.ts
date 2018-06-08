import { MainRepository } from '../internals';

export abstract class CustomRepository<ModelTypes extends string> {
  constructor(protected mainRepository: MainRepository<ModelTypes>) {}
}
