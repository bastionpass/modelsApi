import { MainRepository } from './mainRepository';


export abstract class CustomRepository {
  constructor(protected mainRepository: MainRepository) {}
}
