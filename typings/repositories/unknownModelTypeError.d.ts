import { CoreError } from '../internals';
export declare class UnknownModelTypeError extends CoreError {
    private modelType;
    constructor(modelType: string);
}
export declare function isUnknownModelTypeError(arg: any): arg is UnknownModelTypeError;
