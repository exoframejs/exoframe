// npm packages
import sinon from 'sinon';

// our packages
import list from '../src/list';

export default (test) => {
  // test
  test('Should get owned images and services', (t) => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // execute change
    list.handler({type: 'all'}).then(() => {
      // make sure log in was successful
      t.deepEqual(consoleSpy.args, [
        ['Getting images and services from:', 'http://localhost:3000'],
        [],
        ['Owned images:'],
        ['1)', 'test-image'],
        ['  Id: 123456789012'],
        ['  Size: 10.0 kB'],
        ['  Template: test'],
        [],
        ['Owned services:'],
        ['1)', 'test', ':'],
        ['  Image: test'],
        ['  Ports: \n    - Container:80 to Host:80 on 0.0.0.0 (tcp)'],
        ['  Status: up'],
        ['  Template: test'],
        [],
        ['2)', 'test-stopped', ':'],
        ['  Image: other'],
        ['  Ports: None'],
        ['  Status: stopped'],
        ['  Template: other'],
        [],
      ], 'Correct log output');

      // restore console
      console.log.restore();
      t.end();
    });
  });
};
