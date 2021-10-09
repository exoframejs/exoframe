/* eslint-env jest */
// mock util module
const { runNPM, getProjectConfig, ...actualUtil } = jest.requireActual('../../src/util/index.js');
const util = jest.genMockFromModule('../../src/util/index.js');

util.runNPM = () => new Promise((r) => r());
util.getProjectConfig = (folder) => folder;

export default { ...util, ...actualUtil };
