/** localStorage key for signed-in Google profile (client-side session). */
export const MATHCANVAS_USER_KEY = 'mathcanvas_user';

/** localStorage key for the API prompt (full text sent to /api/generate). */
export const MATHCANVAS_CONCEPT_KEY = 'mathcanvas_concept';

/** Short label for loading UI (e.g. chip title); falls back to concept if missing. */
export const MATHCANVAS_TOPIC_KEY = 'mathcanvas_topic';

export type MathCanvasUser = {
  name?: string;
  email?: string;
  picture?: string;
};
