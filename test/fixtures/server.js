// npm packages
import express from 'express';
import bodyParser from 'body-parser';

// init server
const app = express();
// add body parsing
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

let server;

export const startServer = (cb) => {
  // start server
  server = app.listen(3000, cb);
};

export const stopServer = (cb) => {
  server.close(cb);
};

export default app;
