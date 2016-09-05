
/**
 * Transforms string of comma separated values to array of values
 * @param  {String} str String of comma separated values
 * @return {Array}      Array of values
 */
export const commaStringToArray = (str) => {
  if (!str || !str.length) {
    return undefined;
  }

  return str.split(',').map(p => p.trim());
};
