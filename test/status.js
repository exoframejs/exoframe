// npm packages
import sinon from 'sinon';

// our packages
import status from '../src/status';

export default (test) => {
  // test
  test('Should get status', (t) => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute change
    status.handler();
    // make sure log in was successful
    // first check console output
    t.deepEqual(consoleSpy.args, [
      ['Exoframe status:'],
      ['  Endpoint: http://localhost:3000'],
      ['  User: admin (admin)'],
    ], 'Correct log output');
    // restore console
    console.log.restore();
    t.end();
  });
};
