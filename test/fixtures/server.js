// npm packages
import express from 'express';
import bodyParser from 'body-parser';

// init server
const app = express();
// add body parsing
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

// token
const token = 'test-token-123';
const user = {username: 'admin', password: 'admin', admin: true};

// login method
app.post('/api/login', (req, res) => {
  const newUser = {...user};
  delete newUser.password;
  res.status(200).json({token, user: newUser});
});

let server;

export const startServer = (cb) => {
  // start server
  server = app.listen(3000, cb);
};

export const stopServer = (cb) => {
  server.close(cb);
};
