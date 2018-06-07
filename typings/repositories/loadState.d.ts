import { CoreError } from '../coreError';
/**
 * LoadState describes state of Model or List of models, whether it's being loaded from backend or
 */
export declare class LoadState {
    static none(): NoneState;
    static pending(): PendingState;
    static done(): DoneState;
    isNone(): this is NoneState;
    isPending(): this is PendingState;
    isDone(): this is DoneState;
    isError(): this is ErrorState;
    isNoneOrPending(): boolean;
}
/**
 * Nothing has been doneState with the model, it wasn't been loaded, so you cannot use it
 */
export declare class NoneState extends LoadState {
}
/**
 * Model or list is being loaded from backend
 */
export declare class PendingState extends LoadState {
}
/**
 * Model or List has been loaded and ready to use
 */
export declare class DoneState extends LoadState {
}
/**
 * Error happened when it was been loaded
 */
export declare class ErrorState extends LoadState {
    protected error: CoreError;
    constructor(error: CoreError);
    getError(): CoreError;
}
