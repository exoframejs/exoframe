// npm modules
import Docker from 'dockerode';

// create new docker instance
const docker = new Docker(); // defaults to above if env variables are not used

export default docker;
