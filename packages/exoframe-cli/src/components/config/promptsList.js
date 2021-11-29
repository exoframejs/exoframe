const validate = (input) => input && input.length > 0;
const filter = (input) => (input ? input.trim() : '');

export const prompts = [
  {
    type: 'input',
    name: 'name',
    message: 'Project name (required):',
    placeholder: 'Exoframe project name',
    prop: 'name',
    focused: true,
  },
  // default stuff
  {
    type: 'input',
    name: 'domain',
    message: 'Domain:',
    placeholder: 'domain.tld (optional)',
    prop: 'domain',
  },
  {
    type: 'input',
    name: 'port',
    message: 'Port:',
    placeholder: '8080 (optional)',
    prop: 'port',
  },
  {
    type: 'input',
    name: 'project',
    message: 'Project:',
    placeholder: 'project-name (optional)',
    prop: 'project',
  },
  {
    type: 'keyval-input',
    name: 'env',
    message: 'Env variables:',
    placeholder: 'key=val,key2=val2 (optional)',
    prop: 'env',
  },
  {
    type: 'keyval-input',
    name: 'labels',
    message: 'Labels:',
    placeholder: 'key=val,key2=val2 (optional)',
    prop: 'labels',
  },
  {
    type: 'array-input',
    name: 'volumes',
    message: 'Volumes:',
    placeholder: 'src:dest,src2:dest2 (optional)',
    prop: 'volumes',
  },
  {
    type: 'input',
    name: 'ratelimitAverage',
    message: 'Rate-limit average request rate',
    placeholder: '5 (optional)',
    prop: 'rateLimit.average',
  },
  {
    type: 'input',
    name: 'ratelimitBurst',
    message: 'Rate-limit burst request rate',
    placeholder: '1 (optional)',
    prop: 'rateLimit.burst',
  },
  {
    type: 'input',
    name: 'hostname',
    message: 'Hostname:',
    placeholder: 'hostname (optional)',
    prop: 'hostname',
  },
  {
    type: 'list',
    name: 'restart',
    message: 'Restart policy:',
    placeholder: 'always (optional)',
    prop: 'restart',
    list: [
      { label: 'Not set', value: '' },
      { label: 'No', value: 'no' },
      { label: 'On failure', value: 'on-failure:2' },
      { label: 'Always', value: 'always' },
    ],
  },
  {
    type: 'input',
    name: 'template',
    message: 'Template:',
    placeholder: 'exoframe-template-name (optional)',
    prop: 'template',
  },
  {
    type: 'list',
    name: 'compress',
    message: 'Compress:',
    placeholder: 'false (optional)',
    prop: 'compress',
    list: [
      { label: 'Not set', value: '' },
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
  {
    type: 'list',
    name: 'letsencrypt',
    message: 'Enable letsencrypt:',
    placeholder: 'false (optional)',
    prop: 'letsencrypt',
    list: [
      { label: 'Not set', value: '' },
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
  // docker image deployment part
  {
    type: 'input',
    name: 'image',
    message: 'Deploy using docker image:',
    placeholder: 'image:tag (optional)',
    prop: 'image',
  },
  {
    type: 'input',
    name: 'imageFile',
    message: 'Load docker image from tar file:',
    placeholder: 'path/to/file.tar (optional)',
    prop: 'imageFile',
  },
  // basic auth part
  {
    type: 'auth',
    name: 'basicAuth',
    message: 'Basic auth user:',
    placeholder: 'username:pwd-hash (optional)',
    prop: 'basicAuth',
  },
  // save button
  {
    type: 'button',
    name: 'save',
    message: 'Save',
    action: async ({ saveConfig, exit }) => {
      await saveConfig();
      setTimeout(() => exit(), 300);
    },
  },
];

// prompts for recursive questions
const recursivePrompts = [];
recursivePrompts.push({
  type: 'input',
  name: 'username',
  message: 'Username for Basic Auth:',
  filter,
  validate,
});
recursivePrompts.push({
  type: 'password',
  name: 'password',
  message: 'Password for Basic auth:',
  filter,
  validate,
});
recursivePrompts.push({
  type: 'confirm',
  name: 'askAgain',
  message: 'Add another user?',
  value: false,
});
