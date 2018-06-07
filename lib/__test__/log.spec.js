"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../log/log");
const coreError_1 = require("../coreError");
describe('Log service test', () => {
    it('should call erorr handlers', () => {
        const error = new coreError_1.CoreError('I\'m just a little bit caught in the middle');
        const log = new log_1.Log();
        const params = {
            param: 'pam-pam',
        };
        let counter = 0;
        log.onLogEntry((entry) => {
            counter += 1;
        });
        log.onLogEntry(entry => expect(entry.error).toEqual(error), log_1.LogLevel.ERROR);
        log.onLogEntry(entry => expect(entry.message).toEqual(`Warning ${params.param}`), log_1.LogLevel.WARNING);
        log.onLogEntry(entry => expect(entry.message).toEqual(`Info ${params.param}`), log_1.LogLevel.INFO);
        log.onLogEntry(entry => expect(entry.message).toEqual(`Debug ${params.param}`), log_1.LogLevel.DEBUG);
        log.catcher(error);
        log.error(error, params);
        log.warning('Warning {param}', params);
        log.info('Info {param}', params);
        log.debug('Debug {param}', params);
        expect(counter).toEqual(5);
    });
    it('Jouranl should not exceed MAX_JOURNAL_LENGTH', () => {
        const error = new coreError_1.CoreError('I\'m just a little bit caught in the middle');
        const log = new log_1.Log();
        for (let i = 0; i <= log_1.MAX_JOURNAL_LENGTH + log_1.DELETE_BUNCH; i += 1) {
            log.error(error);
        }
        expect(log.getJournal().length).toEqual(log_1.MAX_JOURNAL_LENGTH + 1);
    });
});
