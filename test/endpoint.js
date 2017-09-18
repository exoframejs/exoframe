// npm packages
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: updateEndpoint} = require('../src/commands/endpoint');
const {handler: removeEndpoint} = require('../src/commands/endpoint-rm');

module.exports = () => {
  const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
  const mockEndpoint = 'http://test.endpoint';
  const mockEndpoint2 = 'http://test';

  // load original config
  const origCfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));

  // test config generation
  tap.test('Should add new endpoint', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    updateEndpoint({url: mockEndpoint}).then(() => {
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Updating endpoint URL to:', 'http://test.endpoint'], ['Endpoint URL updated!']],
        'Correct log output'
      );
      // then check config changes
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.endpoint, mockEndpoint, 'Correct endpoint');
      t.equal(cfg.user, null, 'Correct new user');
      t.equal(cfg.token, null, 'Correct token');
      t.equal(cfg.endpoints.length, 1, 'Correct new endpoints list');
      t.equal(cfg.endpoints[0].endpoint, origCfg.endpoint, 'Correct endpoint in list');
      t.equal(cfg.endpoints[0].user.username, origCfg.user.username, 'Correct user in list');
      t.equal(cfg.endpoints[0].token, origCfg.token, 'Correct token in list');
      // restore console
      console.log.restore();
      t.end();
    });
  });

  // test config generation
  tap.test('Should add second new endpoint', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    updateEndpoint({url: mockEndpoint2}).then(() => {
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Updating endpoint URL to:', mockEndpoint2], ['Endpoint URL updated!']],
        'Correct log output'
      );
      // then check config changes
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.endpoint, mockEndpoint2, 'Correct endpoint');
      t.equal(cfg.user, null, 'Correct new user');
      t.equal(cfg.token, null, 'Correct token');
      t.equal(cfg.endpoints.length, 2, 'Correct new endpoints list');
      t.equal(cfg.endpoints[0].endpoint, origCfg.endpoint, 'Correct endpoint in list');
      t.equal(cfg.endpoints[0].user.username, origCfg.user.username, 'Correct user in list');
      t.equal(cfg.endpoints[0].token, origCfg.token, 'Correct token in list');
      t.equal(cfg.endpoints[1].endpoint, mockEndpoint, 'Correct endpoint in list');
      t.notOk(cfg.endpoints[1].user, 'Correct user in list');
      t.notOk(cfg.endpoints[1].token, 'Correct token in list');
      // restore console
      console.log.restore();
      t.end();
    });
  });

  // test config generation
  tap.test('Should select old endpoint', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({newEndpoint: origCfg.endpoint}));
    // execute login
    updateEndpoint({}).then(() => {
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Updating endpoint URL to:', 'http://localhost:8080'], ['Endpoint URL updated!']],
        'Correct log output'
      );
      // then check config changes
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.endpoint, origCfg.endpoint, 'Correct endpoint');
      t.equal(cfg.user.username, origCfg.user.username, 'Correct new user');
      t.equal(cfg.token, origCfg.token, 'Correct token');
      t.equal(cfg.endpoints.length, 2, 'Correct new endpoints list');
      t.equal(cfg.endpoints[0].endpoint, mockEndpoint, 'Correct endpoint in list');
      t.notOk(cfg.endpoints[0].user, 'Correct user in list');
      t.notOk(cfg.endpoints[0].token, 'Correct token in list');
      t.equal(cfg.endpoints[1].endpoint, mockEndpoint2, 'Correct endpoint in list');
      t.notOk(cfg.endpoints[1].user, 'Correct user in list');
      t.notOk(cfg.endpoints[1].token, 'Correct token in list');
      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      t.end();
    });
  });

  // test config generation
  tap.test('Should select old endpoint using URL param', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    updateEndpoint({url: mockEndpoint}).then(() => {
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Updating endpoint URL to:', mockEndpoint], ['Endpoint URL updated!']],
        'Correct log output'
      );
      // then check config changes
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.endpoint, mockEndpoint, 'Correct endpoint');
      t.notOk(cfg.user, 'Correct new user');
      t.notOk(cfg.token, 'Correct token');
      t.equal(cfg.endpoints.length, 2, 'Correct new endpoints list');
      t.equal(cfg.endpoints[0].endpoint, mockEndpoint2, 'Correct endpoint in list');
      t.notOk(cfg.endpoints[0].user, 'Correct user in list');
      t.notOk(cfg.endpoints[0].token, 'Correct token in list');
      t.equal(cfg.endpoints[1].endpoint, origCfg.endpoint, 'Correct endpoint in list');
      t.equal(cfg.endpoints[1].user.username, origCfg.user.username, 'Correct user in list');
      t.equal(cfg.endpoints[1].token, origCfg.token, 'Correct token in list');
      // restore console
      console.log.restore();
      t.end();
    });
  });

  tap.test('Should show error on remove of non-existent endpoint', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({delEndpoint: 'do-not-exist'}));
    // execute login
    removeEndpoint({}).then(() => {
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Error!', "Couldn't find endpoint with URL:", 'do-not-exist']],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      t.end();
    });
  });

  tap.test('Should remove current endpoint using inquirer', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({delEndpoint: mockEndpoint}));
    // execute login
    removeEndpoint({}).then(() => {
      // first check console output
      t.deepEqual(consoleSpy.args, [['Removing endpoint:', mockEndpoint], ['Endpoint removed!']], 'Correct log output');
      // then check config changes
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.endpoint, mockEndpoint2, 'Correct endpoint');
      t.notOk(cfg.user, 'Correct new user');
      t.notOk(cfg.token, 'Correct token');
      t.equal(cfg.endpoints.length, 1, 'Correct new endpoints list');
      t.equal(cfg.endpoints[0].endpoint, origCfg.endpoint, 'Correct endpoint in list');
      t.equal(cfg.endpoints[0].user.username, origCfg.user.username, 'Correct user in list');
      t.equal(cfg.endpoints[0].token, origCfg.token, 'Correct token in list');
      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      t.end();
    });
  });

  tap.test('Should remove existing endpoint using param', t => {
    let consoleSpy;
    // select original endpoint to test removal from list
    updateEndpoint({url: origCfg.endpoint})
      .then(() => {
        // spy on console
        consoleSpy = sinon.spy(console, 'log');
        // execute login
        return removeEndpoint({url: mockEndpoint2});
      })
      .then(() => {
        // first check console output
        t.deepEqual(
          consoleSpy.args,
          [['Removing endpoint:', mockEndpoint2], ['Endpoint removed!']],
          'Correct log output'
        );
        // then check config changes
        const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
        console.log(cfg);
        t.equal(cfg.endpoint, origCfg.endpoint, 'Correct endpoint');
        t.equal(cfg.user.username, origCfg.user.username, 'Correct new user');
        t.equal(cfg.token, origCfg.token, 'Correct token');
        t.equal(cfg.endpoints.length, 0, 'Correct new endpoints list');
        // restore console
        console.log.restore();
        t.end();
      });
  });

  tap.test('Should not remove only endpoint', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({delEndpoint: origCfg.endpoint}));
    // execute login
    removeEndpoint({}).then(() => {
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Error!', 'Cannot remove the only endpoint URL:', origCfg.endpoint]],
        'Correct log output'
      );
      // then check config changes
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      t.equal(cfg.endpoint, origCfg.endpoint, 'Correct endpoint');
      t.equal(cfg.user.username, origCfg.user.username, 'Correct new user');
      t.equal(cfg.token, origCfg.token, 'Correct token');
      t.equal(cfg.endpoints.length, 0, 'Correct new endpoints list');
      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      t.end();
    });
  });

  tap.test('Restore original config', t => {
    // restore original config
    fs.writeFileSync(configPath, yaml.safeDump(origCfg), 'utf8');
    t.end();
  });
};
