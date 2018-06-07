/**
 * Core error, that happens in core subsystem
 */
export declare class CoreError implements Error {
    protected description: string;
    name: string;
    message: string;
    constructor(description: string);
    getErrorType(): string;
    toString(): string;
}
