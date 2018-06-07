/**
 * Core error, that happens in core subsystem
 */
export class CoreError implements Error {
  public name: string;
  public message: string;

  constructor(protected description: string) {
    this.message = description;
  }

  public getErrorType(): string {
    return 'CoreError';
  }

  public toString() { return `${this.getErrorType()}: ${this.description}`; }
}
