"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * LoadState describes state of Model or List of models, whether it's being loaded from backend or
 */
class LoadState {
    static none() { return noneState; }
    static pending() { return pendingState; }
    static done() { return doneState; }
    isNone() { return this instanceof NoneState; }
    isPending() { return this instanceof PendingState; }
    isDone() { return this instanceof DoneState; }
    isError() { return this instanceof ErrorState; }
    isNoneOrPending() { return this instanceof PendingState || this instanceof NoneState; }
}
exports.LoadState = LoadState;
/**
 * Nothing has been doneState with the model, it wasn't been loaded, so you cannot use it
 */
class NoneState extends LoadState {
}
exports.NoneState = NoneState;
/**
 * Model or list is being loaded from backend
 */
class PendingState extends LoadState {
}
exports.PendingState = PendingState;
/**
 * Model or List has been loaded and ready to use
 */
class DoneState extends LoadState {
}
exports.DoneState = DoneState;
/**
 * Error happened when it was been loaded
 */
class ErrorState extends LoadState {
    constructor(error) {
        super();
        this.error = error;
    }
    getError() {
        return this.error;
    }
}
exports.ErrorState = ErrorState;
const noneState = new NoneState();
const pendingState = new PendingState();
const doneState = new DoneState();
