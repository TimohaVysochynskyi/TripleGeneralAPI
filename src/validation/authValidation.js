import Joi from 'joi';
import {
  validateNickname,
  validateEmail,
  validatePassword,
} from '../utils/inputValidation.js';

// Custom Joi validators
const nicknameValidator = (value, helpers) => {
  const validation = validateNickname(value);
  if (!validation.isValid) {
    return helpers.error('nickname.invalid', { message: validation.reason });
  }
  return value;
};

const emailValidator = (value, helpers) => {
  const validation = validateEmail(value);
  if (!validation.isValid) {
    return helpers.error('email.invalid', { message: validation.reason });
  }
  return value;
};

const passwordValidator = (value, helpers) => {
  const validation = validatePassword(value);
  if (!validation.isValid) {
    return helpers.error('password.invalid', { message: validation.reason });
  }
  return value;
};

export const registerValidation = Joi.object({
  nickname: Joi.string()
    .trim()
    .min(3)
    .max(16)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .custom(nicknameValidator, 'nickname validation')
    .required()
    .messages({
      'string.pattern.base':
        'Никнейм может содержать только английские буквы, цифры и _',
      'string.min': 'Никнейм должен содержать минимум 3 символа',
      'string.max': 'Никнейм не должен превышать 16 символов',
      'nickname.invalid': '{#message}',
    }),
  email: Joi.string()
    .trim()
    .email()
    .custom(emailValidator, 'email validation')
    .required()
    .messages({
      'string.email': 'Введите корректный email',
      'email.invalid': '{#message}',
    }),
  password: Joi.string()
    .min(8)
    .max(128) // Prevent DoS attacks
    .custom(passwordValidator, 'password validation')
    .required()
    .messages({
      'string.min': 'Пароль должен содержать минимум 8 символов',
      'string.max': 'Пароль слишком длинный',
      'password.invalid': '{#message}',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Пароли не совпадают',
  }),
});

export const loginValidation = Joi.object({
  emailOrNickname: Joi.string()
    .trim()
    .min(3)
    .max(255) // Prevent DoS
    .required()
    .messages({
      'any.required': 'Введите никнейм или email',
      'string.min': 'Минимум 3 символа',
      'string.max': 'Слишком длинная строка',
    }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Пароль должен содержать минимум 8 символов',
    'string.max': 'Пароль слишком длинный',
    'any.required': 'Пароль обязателен',
  }),
});

export const refreshValidation = Joi.object({
  refreshToken: Joi.string()
    .required()
    .max(1000) // Prevent DoS
    .messages({
      'any.required': 'Refresh token обязателен',
      'string.max': 'Токен слишком длинный',
    }),
});
