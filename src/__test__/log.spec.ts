import { DELETE_BUNCH, Log, LogLevel, MAX_JOURNAL_LENGTH, CoreError } from '../internals';

describe('Log service test', () => {

  it('should call erorr handlers', () => {

    const error = new CoreError('I\'m just a little bit caught in the middle');
    const log = new Log();
    const params = {
      param: 'pam-pam',
    };

    let counter = 0;

    log.onLogEntry((entry) => {
      counter += 1;
    });

    log.onLogEntry(
      entry => expect(entry.error).toEqual(error),
      LogLevel.ERROR,
    );

    log.onLogEntry(
      entry => expect(entry.message).toEqual(`Warning ${params.param}`),
      LogLevel.WARNING,
    );

    log.onLogEntry(
      entry => expect(entry.message).toEqual(`Info ${params.param}`),
      LogLevel.INFO,
    );

    log.onLogEntry(
      entry => expect(entry.message).toEqual(`Debug ${params.param}`),
      LogLevel.DEBUG,
    );

    log.catcher(error);
    log.error(error, params);
    log.warning('Warning {param}', params);
    log.info('Info {param}', params);
    log.debug('Debug {param}', params);

    expect(counter).toEqual(5);
  });

  it('Jouranl should not exceed MAX_JOURNAL_LENGTH', () => {
    const error = new CoreError('I\'m just a little bit caught in the middle');
    const log = new Log();
    for (let i = 0; i <= MAX_JOURNAL_LENGTH + DELETE_BUNCH; i += 1) {
      log.error(error);
    }

    expect(log.getJournal().length).toEqual(MAX_JOURNAL_LENGTH + 1);
  });
});

