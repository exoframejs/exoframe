import { getSecretsCollection, secretsInited } from '../db/secrets.js';

export default (fastify) => {
  fastify.route({
    method: 'GET',
    path: '/secrets',
    async handler(request, reply) {
      // get username
      const { username } = request.user;

      // wait for db to init if required
      await secretsInited;
      // find user secrets
      const secrets = getSecretsCollection()
        .find({ user: username })
        .map(({ value, ...s }) => s);

      reply.send({ secrets });
    },
  });

  fastify.route({
    method: 'GET',
    path: '/secrets/:secretName',
    async handler(request, reply) {
      // get username
      const { username } = request.user;
      const { secretName } = request.params;

      // wait for db to init if required
      await secretsInited;
      // find user secrets
      const secret = getSecretsCollection().findOne({ user: username, name: secretName });

      reply.send({ secret });
    },
  });

  fastify.route({
    method: 'POST',
    path: '/secrets',
    async handler(request, reply) {
      // get username
      const { username } = request.user;
      // get secret data
      const { secretName, secretValue } = request.body;

      // wait for db to init if required
      await secretsInited;
      // create new secret for current user
      const secret = { user: username, name: secretName, value: secretValue };
      getSecretsCollection().insert(secret);

      reply.send(secret);
    },
  });

  fastify.route({
    method: 'DELETE',
    path: '/secrets',
    async handler(request, reply) {
      // generate new deploy token
      const { secretName } = request.body;
      const { user } = request;
      const existingSecret = getSecretsCollection().findOne({ user: user.username, name: secretName });
      if (!existingSecret) {
        reply.code(200).send({ removed: false, reason: 'Secret does not exist' });
        return;
      }
      // wait for db to init if required
      await secretsInited;
      // remove token from collection
      getSecretsCollection().remove(existingSecret);
      // send back to user
      reply.code(204).send();
    },
  });
};
