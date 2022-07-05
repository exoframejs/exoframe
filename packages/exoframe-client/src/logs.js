// npm packages
import EventEmitter from 'events';
import got from 'got';

/**
 * Gets logs for given deployment
 * @param {object} params
 * @param {string} params.id - deployment ID
 * @param {boolean} params.follow - whether to continuously return log
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {object} Response event emitter
 */
export const getLogs = ({ id, follow, endpoint, token }) =>
  new Promise((resolve) => {
    // services request url
    const remoteUrl = `${endpoint}/logs/${id}`;

    // construct query
    const searchParams = {};
    if (follow) {
      searchParams.query = { follow: 'true' };
    }

    // construct shared request params
    const options = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams,
    };

    // create resulting stream
    const emitter = new EventEmitter();

    // try sending request
    const logStream = got.stream(remoteUrl, options);
    logStream.on('error', (e) => {
      // if authorization is expired/broken/etc
      if (e.statusCode === 401) {
        const authErr = new Error('Authorization expired!');
        emitter.emit('error', authErr);
        throw authErr;
      }

      // if container was not found
      if (e.statusCode === 404) {
        const lookupErr = new Error('Container was not found!');
        emitter.emit('error', lookupErr);
        throw lookupErr;
      }

      emitter.emit('error', e);
      throw e;
    });

    // close result stream on end
    logStream.on('end', () => emitter.emit('end'));

    logStream.on('data', (buf) => {
      const d = buf.toString();
      const lines = d.split('\n');
      lines
        .map((line) => line.replace(/^\u0001.+?(\d)/g, '$1').replace(/\n+$/, ''))
        .filter((line) => line && line.length > 0)
        .map((line) => {
          if (line.startsWith('Logs for')) {
            return { date: null, msg: line };
          }

          const parts = line.split(/\dZ\s/);
          const date = new Date(parts[0]);
          const msg = parts[1];
          return { date, msg };
        })
        .filter(({ date, msg }) => date !== undefined && msg !== undefined)
        .map(({ date, msg }) => ({
          date: date && isFinite(date) ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` : '  ',
          msg,
        }))
        .forEach((obj) => emitter.emit('data', obj));
    });

    resolve(emitter);
  });
