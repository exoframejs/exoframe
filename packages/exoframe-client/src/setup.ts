import got from 'got';
import { getStatusCode } from './http.ts';
import type { LogMessage, NestedValue, Question } from './types.ts';

interface RecipeParams {
  endpoint: string;
  token: string;
}

interface GetRecipeQuestionsParams extends RecipeParams {
  recipe: string;
}

interface ExecuteRecipeParams extends RecipeParams {
  name: string;
  answers: Record<string, NestedValue>;
}

export const getRecipeQuestions = async ({
  recipe,
  endpoint,
  token,
}: GetRecipeQuestionsParams): Promise<{ questions: Question[]; log: LogMessage[] }> => {
  try {
    const {
      body: { success, log, questions },
    } = await got.get<{ success: boolean; log: LogMessage[]; questions: Question[] }>(`${endpoint}/setup`, {
      headers: { Authorization: `Bearer ${token}` },
      searchParams: {
        recipeName: recipe,
      },
      responseType: 'json',
    });

    if (!success) {
      throw new Error('Error installing new recipe!');
    }

    return { questions, log };
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};

export const executeRecipe = async ({
  name,
  answers,
  endpoint,
  token,
}: ExecuteRecipeParams): Promise<{ log: LogMessage[] }> => {
  try {
    const {
      body: { success, log },
    } = await got.post<{ success: boolean; log: LogMessage[] }>(`${endpoint}/setup`, {
      headers: { Authorization: `Bearer ${token}` },
      json: {
        recipeName: name,
        answers,
      },
      responseType: 'json',
    });

    if (!success) {
      throw new Error('Error executing recipe!');
    }

    return { log };
  } catch (error) {
    if (getStatusCode(error) === 401) {
      throw new Error('Authorization expired!');
    }
    throw error;
  }
};
