import { MainRepository } from './mainRepository';

export abstract class CustomRepository<ModelTypes extends string> {
  constructor(protected mainRepository: MainRepository<ModelTypes>) {}
}
