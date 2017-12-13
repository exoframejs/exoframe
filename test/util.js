const stripAnsi = require('strip-ansi');

exports.cleanLogs = logs => logs.map(lines => lines.map(l => stripAnsi(l)));
