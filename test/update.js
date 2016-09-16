// npm packages
import sinon from 'sinon';

// our packages
import update from '../src/update';

export default (test) => {
  // test
  test('Should update plugins', (t) => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute change
    update.handler();
    // make sure log in was successful
    // first check console output
    t.deepEqual(consoleSpy.args, [
      ['Updating plugins..'],
      ['Updating plugin:', 'test-template'],
    ], 'Correct log output');
    // restore console
    console.log.restore();
    t.end();
  });
};
