// npm packages
import express from 'express';
import bodyParser from 'body-parser';

// init server
const app = express();
// add body parsing
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

let server;
// services
export const services = [
  // running service
  {
    Id: '12345678901234567890',
    Names: ['test'],
    Status: 'up',
    Ports: [{PrivatePort: '80', PublicPort: '80', IP: '0.0.0.0', Type: 'tcp'}],
    Labels: {'exoframe.type': 'test'},
    Image: 'test',
  },
  // stopped service
  {
    Id: '09876543210987654321',
    Names: ['test-stopped'],
    Status: 'stopped',
    Ports: [],
    Labels: {'exoframe.type': 'other'},
    Image: 'other',
  },
];
// images
export const images = [
  {Id: 'sha:12345678901234567890', Size: 1024 * 10, RepoTags: ['test-image'], Labels: {'exoframe.type': 'test'}},
];

// common stubs
// images list stub
app.get('/api/images', (req, res) => res.send(images));
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
