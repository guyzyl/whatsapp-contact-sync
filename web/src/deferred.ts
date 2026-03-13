// Based on https://stackoverflow.com/a/44905352/1403643
export class Deferred<T> implements Promise<T> {
  public [Symbol.toStringTag]: "Promise" = "Promise";
  private _resolveSelf: any;
  private _rejectSelf: any;
  private promise: Promise<T>;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this._resolveSelf = resolve;
      this._rejectSelf = reject;
    });
  }

  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  public catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }

  public finally(onfinally?: () => void): Promise<T> {
    return this.promise.finally(onfinally);
  }

  public resolve(val: T) {
    this._resolveSelf(val);
  }
  public reject(reason: any) {
    this._rejectSelf(reason);
  }
}
