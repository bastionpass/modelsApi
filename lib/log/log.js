"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_ts_types_1 = require("swagger-ts-types");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARNING"] = 1] = "WARNING";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["ANY"] = 4] = "ANY";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
exports.MAX_JOURNAL_LENGTH = 500;
exports.DELETE_BUNCH = 10;
class Log {
    constructor() {
        /**
         * This is catcher for any promises, if you don't care about handling erorrs
         * @param {Error} e
         */
        this.catcher = (e) => {
            this.error(e);
        };
        this.journal = [];
        this.callbacks = new Map();
    }
    /**
     * If you want to publish an error manually
     * @param {Error} error
     * @param {LogParams} params - any additional params you want to pass with error
     */
    error(error, params) {
        this.log({ level: LogLevel.ERROR, error, message: error.message, params: params || {}, time: new Date() });
    }
    /**
     * Publish a warning
     * @param {string} message - message could include {paramName},
     * in that case it will be replaced with {paramName: value} if found
     * @param {LogParams} params
     */
    warning(message, params) {
        this.log({ level: LogLevel.WARNING, message, params: params || {}, time: new Date() });
    }
    /**
     * Publish a information
     * @param {string} message
     * @param {LogParams} params
     */
    info(message, params) {
        this.log({ level: LogLevel.INFO, message, params: params || {}, time: new Date() });
    }
    /**
     * publish debug info
     * @param {string} message
     * @param {LogParams} params
     */
    debug(message, params) {
        this.log({ level: LogLevel.DEBUG, message, params: params || {}, time: new Date() });
    }
    /**
     * Set callback to catch any specific or any log entries
     * @param {Callback} callback
     * @param {LogLevel} type
     */
    onLogEntry(callback, type = LogLevel.ANY) {
        if (!this.callbacks.has(type)) {
            this.callbacks.set(type, []);
        }
        const callbacks = this.callbacks.get(type);
        callbacks.push(callback); // TS Buggy-Wuggy
    }
    getJournal() {
        return this.journal;
    }
    log(entry) {
        if (entry.message && swagger_ts_types_1.isObject(entry.params)) {
            entry.message = Object.keys(entry.params).reduce((message, key) => message.replace(new RegExp(`{${key}}`, 'g'), entry.params[key]), entry.message);
        }
        this.journal.push(entry);
        if (this.journal.length > exports.MAX_JOURNAL_LENGTH + exports.DELETE_BUNCH) {
            this.journal.splice(0, exports.DELETE_BUNCH);
        }
        this.callbacks.forEach((callbacks, type) => {
            if (type === entry.level || type === LogLevel.ANY) {
                callbacks.forEach(callback => callback(entry));
            }
        });
    }
}
exports.Log = Log;
