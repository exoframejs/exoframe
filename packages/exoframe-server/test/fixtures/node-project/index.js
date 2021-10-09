const http = require('http');

http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello world!');
  })
  .listen(80);

// log something for logging tests
console.log('Listening on port 80');
