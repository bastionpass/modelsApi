import { CoreError } from '../internals';

/**
 * LoadState describes state of Model or List of models, whether it's being loaded from backend or
 */

export class LoadState {

  public static none(): NoneState { return noneState; }
  public static pending(): PendingState { return pendingState; }
  public static done(): DoneState { return doneState; }

  public isNone(): this is NoneState { return this instanceof NoneState; }
  public isPending(): this is PendingState { return this instanceof PendingState; }
  public isDone(): this is DoneState { return this instanceof DoneState; }
  public isError(): this is ErrorState { return this instanceof ErrorState; }
  public isNoneOrPending(): boolean { return this instanceof PendingState || this instanceof NoneState; }
}

/**
 * Nothing has been doneState with the model, it wasn't been loaded, so you cannot use it
 */
export class NoneState extends LoadState {}

/**
 * Model or list is being loaded from backend
 */
export class PendingState extends LoadState {}

/**
 * Model or List has been loaded and ready to use
 */
export class DoneState extends LoadState {}

/**
 * Error happened when it was been loaded
 */
export class ErrorState extends LoadState {

  constructor(protected error: CoreError) {
    super();
  }

  getError() {
    return this.error;
  }

}

const noneState = new NoneState();
const pendingState = new PendingState();
const doneState = new DoneState();
