import Joi from 'joi';
import { parseApplicantWorkPreference } from '../utils/enum.js';

/**
 * Single value, comma-separated string, or array — normalized to canonical CSV (e.g. "full-time,freelance,contract").
 * Uses helpers.message() so the client gets a clear message and correct Joi path (not "failed custom validation because …").
 */
export const workPreferenceJoi = Joi.any().custom((value, helpers) => {
  const parsed = parseApplicantWorkPreference(value);
  if (!parsed.ok) {
    return helpers.message(parsed.message);
  }
  return parsed.value;
});
