"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const internals_1 = require("../internals");
describe('Log service test', () => {
    it('should call erorr handlers', () => {
        const error = new internals_1.CoreError('I\'m just a little bit caught in the middle');
        const log = new internals_1.Log();
        const params = {
            param: 'pam-pam',
        };
        let counter = 0;
        log.onLogEntry((entry) => {
            counter += 1;
        });
        log.onLogEntry(entry => expect(entry.error).toEqual(error), internals_1.LogLevel.ERROR);
        log.onLogEntry(entry => expect(entry.message).toEqual(`Warning ${params.param}`), internals_1.LogLevel.WARNING);
        log.onLogEntry(entry => expect(entry.message).toEqual(`Info ${params.param}`), internals_1.LogLevel.INFO);
        log.onLogEntry(entry => expect(entry.message).toEqual(`Debug ${params.param}`), internals_1.LogLevel.DEBUG);
        log.catcher(error);
        log.error(error, params);
        log.warning('Warning {param}', params);
        log.info('Info {param}', params);
        log.debug('Debug {param}', params);
        expect(counter).toEqual(5);
    });
    it('Jouranl should not exceed MAX_JOURNAL_LENGTH', () => {
        const error = new internals_1.CoreError('I\'m just a little bit caught in the middle');
        const log = new internals_1.Log();
        for (let i = 0; i <= internals_1.MAX_JOURNAL_LENGTH + internals_1.DELETE_BUNCH; i += 1) {
            log.error(error);
        }
        expect(log.getJournal().length).toEqual(internals_1.MAX_JOURNAL_LENGTH + 1);
    });
});
