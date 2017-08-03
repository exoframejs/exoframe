// tests
const login = require('./login');
const remove = require('./remove');
const deploy = require('./deploy');
const logs = require('./logs');
const list = require('./list');
const config = require('./config');
const token = require('./token');
const endpoint = require('./endpoint');

// run tests
login();
remove();
deploy();
logs();
list();
config();
token();
endpoint();
