import got from 'got';

/**
 * @typedef {object} Question
 * @property {string} message - question message text
 * @property {string} name - question name (id)
 * @property {string} type - question type
 */

/**
 * @typedef {object} Log
 * @property {string} message - log message text
 * @property {string} level - log level
 */

/**
 * Get questions for given recipe from exoframe endpoint
 * @param {object} params
 * @param {string} params.recipe - existing recipe name
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {Question[]}
 */
export const getRecipeQuestions = async ({ recipe, endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/setup`;
  // ask for questions for this recipe
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    searchParams: {
      recipeName: recipe,
    },
    responseType: 'json',
  };

  // try sending request
  try {
    const {
      body: { success, log, questions },
    } = await got(remoteUrl, options);
    if (!success) {
      throw new Error('Error installing new recipe!');
    }

    // get questions from body
    return { questions, log };
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};

/**
 * Execute given recipe on exoframe endpoint
 * @param {object} params
 * @param {string} params.name - recipe name
 * @param {object} params.answers - answers to questions
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.token - exoframe auth token
 * @returns {{log: Log[]}}
 */
export const executeRecipe = async ({ name, answers, endpoint, token }) => {
  // services request url
  const remoteUrl = `${endpoint}/setup`;
  // send answers and execute recipe
  const answerOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: {
      recipeName: name,
      answers,
    },
    responseType: 'json',
  };

  try {
    const {
      body: { success, log },
    } = await got(remoteUrl, answerOptions);

    if (!success) {
      throw new Error('Error executing recipe!');
    }

    return { log };
  } catch (e) {
    // if authorization is expired/broken/etc
    if (e.response.statusCode === 401) {
      throw new Error('Authorization expired!');
    }

    throw e;
  }
};
