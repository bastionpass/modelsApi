import { isObject } from 'swagger-ts-types';

export interface LogParams {
  [key: string]: any;
}

export enum LogLevel {
  ERROR,
  WARNING,
  INFO,
  DEBUG,
  ANY,
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

export const MAX_JOURNAL_LENGTH = 500;
export const DELETE_BUNCH = 10;

export class Log {

  /**
   * This is catcher for any promises, if you don't care about handling erorrs
   * @param {Error} e
   */
  public catcher = (e: Error) => {
    this.error(e);
  }

  /**
   * If you want to publish an error manually
   * @param {Error} error
   * @param {LogParams} params - any additional params you want to pass with error
   */
  public error(error: Error, params?: LogParams) {
    this.log({ level: LogLevel.ERROR, error, message: error.message, params: params || {}, time: new Date() });
  }

  /**
   * Publish a warning
   * @param {string} message - message could include {paramName},
   * in that case it will be replaced with {paramName: value} if found
   * @param {LogParams} params
   */
  public warning(message: string, params?: LogParams) {
    this.log({ level: LogLevel.WARNING, message, params: params || {}, time: new Date() });
  }

  /**
   * Publish a information
   * @param {string} message
   * @param {LogParams} params
   */
  public info(message: string, params?: LogParams) {
    this.log({ level: LogLevel.INFO, message, params: params || {}, time: new Date() });
  }

  /**
   * publish debug info
   * @param {string} message
   * @param {LogParams} params
   */
  public debug(message: string, params?: LogParams) {
    this.log({ level: LogLevel.DEBUG, message, params: params || {}, time: new Date() });
  }

  /**
   * Set callback to catch any specific or any log entries
   * @param {Callback} callback
   * @param {LogLevel} type
   */
  public onLogEntry(callback: Callback, type: LogLevel = LogLevel.ANY) {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }

    const callbacks = this.callbacks.get(type);
    (callbacks as Callback[]).push(callback); // TS Buggy-Wuggy
  }

  public getJournal() {
    return this.journal;
  }

  protected journal: LogEntry[] = [];
  protected callbacks: Map<LogLevel, Callback[]> = new Map();

  protected log(entry: LogEntry) {
    if (entry.message && isObject(entry.params)) {
      entry.message = Object.keys(entry.params).reduce(
        (message, key) => message.replace(new RegExp(`{${key}}`, 'g'), entry.params[key]),
        entry.message,
      );
    }

    this.journal.push(entry);
    if (this.journal.length > MAX_JOURNAL_LENGTH + DELETE_BUNCH) {
      this.journal.splice(0, DELETE_BUNCH);
    }

    this.callbacks.forEach((callbacks, type) => {
      if (type === entry.level || type === LogLevel.ANY) {
        callbacks.forEach(callback => callback(entry));
      }
    });
  }
}
