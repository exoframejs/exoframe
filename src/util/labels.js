/**
 * Transforms string of comma separated labels to array of labels
 * @param  {String} str String of comma separated labels
 * @return {Array}      Array of label strings
 */
export const labelArrayFromString = (str) => {
  if (!str || !str.length) {
    return undefined;
  }
  return str
      .split(',')
      .map(it => it.trim())
      .filter(it => it.includes('='));
};

/**
 * Transforms string of comma separated labels to key-value object
 * @param  {String} str String of comma separated labels
 * @return {Object}     Object of key-value labels
 */
export const labelsFromString = (str) => {
  if (!str || !str.length) {
    return undefined;
  }
  return labelArrayFromString(str)
      .reduce((sum, el) => {
        const [k, v] = el.split('=');
        return {
          [k]: v,
          ...sum,
        };
      }, {});
};
