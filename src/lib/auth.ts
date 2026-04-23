/** localStorage key for signed-in Google profile (client-side session). */
export const VISUA_AI_USER_KEY = 'visua_ai_user';

/** localStorage key for the API prompt (full text sent to /api/generate). */
export const VISUA_AI_CONCEPT_KEY = 'visua_ai_concept';

/** Short label for loading UI (e.g. chip title); falls back to concept if missing. */
export const VISUA_AI_TOPIC_KEY = 'visua_ai_topic';

export type VisuaAiUser = {
  name?: string;
  email?: string;
  picture?: string;
};
