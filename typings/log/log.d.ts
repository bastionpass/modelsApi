export interface LogParams {
    [key: string]: any;
}
export declare enum LogLevel {
    ERROR = 0,
    WARNING = 1,
    INFO = 2,
    DEBUG = 3,
    ANY = 4
}
export interface LogEntry {
    level: LogLevel;
    error?: Error;
    message: string;
    params: LogParams;
    time: Date;
}
interface Callback {
    (entry: LogEntry): void;
}
export declare const MAX_JOURNAL_LENGTH = 500;
export declare const DELETE_BUNCH = 10;
export declare class Log {
    /**
     * This is catcher for any promises, if you don't care about handling erorrs
     * @param {Error} e
     */
    catcher: (e: Error) => void;
    /**
     * If you want to publish an error manually
     * @param {Error} error
     * @param {LogParams} params - any additional params you want to pass with error
     */
    error(error: Error, params?: LogParams): void;
    /**
     * Publish a warning
     * @param {string} message - message could include {paramName},
     * in that case it will be replaced with {paramName: value} if found
     * @param {LogParams} params
     */
    warning(message: string, params?: LogParams): void;
    /**
     * Publish a information
     * @param {string} message
     * @param {LogParams} params
     */
    info(message: string, params?: LogParams): void;
    /**
     * publish debug info
     * @param {string} message
     * @param {LogParams} params
     */
    debug(message: string, params?: LogParams): void;
    /**
     * Set callback to catch any specific or any log entries
     * @param {Callback} callback
     * @param {LogLevel} type
     */
    onLogEntry(callback: Callback, type?: LogLevel): void;
    getJournal(): LogEntry[];
    protected journal: LogEntry[];
    protected callbacks: Map<LogLevel, Callback[]>;
    protected log(entry: LogEntry): void;
}
export {};
