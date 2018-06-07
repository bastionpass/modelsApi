/* tslint:disable:max-line-length */

export function bindArgs<A1, R>(fn: (a1: A1) => R, a1: A1): () => R;

export function bindArgs<A1, A2, R>(fn: (a1: A1, a2: A2) => R, a1: A1, a2: A2): () => R;
export function bindArgs<A1, A2, R>(fn: (a1: A1, a2: A2) => R, a1: A1): (a2: A2) => R;

export function bindArgs<A1, A2, A3, R>(fn: (a1: A1, a2: A2, a3: A3) => R, a1: A1, a2: A2, a3: A3): () => R;
export function bindArgs<A1, A2, A3, R>(fn: (a1: A1, a2: A2, a3: A3) => R, a1: A1, a2: A2): (a3: A3) => R;
export function bindArgs<A1, A2, A3, R>(fn: (a1: A1, a2: A2, a3: A3) => R, a1: A1): (a2: A2, a3: A3) => R;

export function bindArgs<A1, A2, A3, A4, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4) => R, a1: A1, a2: A2, a3: A3, a4: A4): () => R;
export function bindArgs<A1, A2, A3, A4, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4) => R, a1: A1, a2: A2, a3: A3): (a4: A4) => R;
export function bindArgs<A1, A2, A3, A4, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4) => R, a1: A1, a2: A2): (a3: A3, a4: A4) => R;
export function bindArgs<A1, A2, A3, A4, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4) => R, a1: A1): (a2: A2, a3: A3, a4: A4) => R;

export function bindArgs(fn: Function, ...args: any[]): Function {
  return fn.bind(null, ...args);
}
