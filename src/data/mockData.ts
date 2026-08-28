/**
 * The question set, re-exported.
 *
 * It lives under `api/_lib` because the generation route needs it at runtime to
 * build the prompt, and a serverless function must resolve its imports from
 * inside `api/`. The app reads it from here, where app content belongs.
 */
export { QUESTIONS } from '../../api/_lib/questions'
