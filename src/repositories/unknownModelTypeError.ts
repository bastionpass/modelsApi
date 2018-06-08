import { CoreError } from '../internals';

export class UnknownModelTypeError extends CoreError {
  constructor(private modelType: string) {
    super(`Unknown ModelType: ${modelType}`);
  }
}

export function isUnknownModelTypeError(arg: any): arg is UnknownModelTypeError {
  return arg instanceof UnknownModelTypeError;
}
