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
        'Нікнейм може містити лише англійські літери, цифри та _',
      'string.min': 'Нікнейм повинен містити мінімум 3 символи',
      'string.max': 'Нікнейм не повинен перевищувати 16 символів',
      'nickname.invalid': '{#message}',
    }),
  email: Joi.string()
    .trim()
    .email()
    .custom(emailValidator, 'email validation')
    .required()
    .messages({
      'string.email': 'Введіть коректний email',
      'email.invalid': '{#message}',
    }),
  password: Joi.string()
    .min(8)
    .max(128) // Prevent DoS attacks
    .custom(passwordValidator, 'password validation')
    .required()
    .messages({
      'string.min': 'Пароль повинен містити мінімум 8 символів',
      'string.max': 'Пароль занадто довгий',
      'password.invalid': '{#message}',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Паролі не співпадають',
  }),
});

export const loginValidation = Joi.object({
  emailOrNickname: Joi.string()
    .trim()
    .min(3)
    .max(255) // Prevent DoS
    .required()
    .messages({
      'any.required': 'Введіть нікнейм або email',
      'string.min': 'Мінімум 3 символи',
      'string.max': 'Занадто довгий рядок',
    }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Пароль повинен містити мінімум 8 символів',
    'string.max': 'Пароль занадто довгий',
    'any.required': "Пароль обов'язковий",
  }),
});

export const refreshValidation = Joi.object({
  refreshToken: Joi.string()
    .required()
    .max(1000) // Prevent DoS
    .messages({
      'any.required': "Refresh token обов'язковий",
      'string.max': 'Токен занадто довгий',
    }),
});
