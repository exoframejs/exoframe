import got from 'got';

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
