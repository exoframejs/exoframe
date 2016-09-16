// npm packages
import express from 'express';
import bodyParser from 'body-parser';

// init server
const app = express();
// add body parsing
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

let server;
export const services = [
  {Id: '12345678901234567890', Names: ['test'], Status: 'up'}, // running service
  {Id: '09876543210987654321', Names: ['test-stopped'], Status: 'stopped'}, // stopped service
];

// common stubs
// images list stub
app.get('/api/images', (req, res) => res.send([]));
// service list stub
app.get('/api/services', (req, res) => res.send(services));

export const startServer = (cb) => {
  // start server
  server = app.listen(3000, cb);
};

export const stopServer = (cb) => {
  server.close(cb);
};

export default app;
