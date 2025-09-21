import Joi from 'joi';

export const ideasValidation = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  telegram: Joi.string()
    .trim()
    .pattern(/^@\w{4,}$/u)
    .required(),
  idea: Joi.string().trim().min(10).max(2000).required(),
});
