import minimatch from 'minimatch';

// Ignore blobs from .dockerignore and .gitignore
export const dockerignore = () => {
  const ignores = ['.git/', 'node_modules/'];
  return (name) => ignores.some(ignore => minimatch(name, ignore));
};
