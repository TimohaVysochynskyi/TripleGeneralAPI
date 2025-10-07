import Joi from 'joi';

// Middleware for validating application data from multipart form
export const validateApplicationData = (req, res, next) => {
  // First validate that required files are present
  if (!req.files?.passportPhoto?.[0]) {
    return res.status(400).json({
      status: 400,
      message: 'Помилка валідації',
      errors: ["Фото паспорту обов'язкове"],
    });
  }

  if (!req.files?.userPhoto?.[0]) {
    return res.status(400).json({
      status: 400,
      message: 'Помилка валідації',
      errors: ["Фото користувача обов'язкове"],
    });
  }

  const schema = Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .pattern(/^[А-Яа-яІіЇїЄєҐґ'\s-]+$/, 'ukrainian-name')
      .required()
      .messages({
        'string.min': "Ім'я повинно містити мінімум 2 символи",
        'string.max': "Ім'я не повинно перевищувати 100 символів",
        'string.pattern.name':
          "Ім'я може містити лише українські літери, апострофи та дефіси",
        'any.required': "Ім'я обов'язкове",
      }),

    lastName: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .pattern(/^[А-Яа-яІіЇїЄєҐґ'\s-]+$/, 'ukrainian-name')
      .required()
      .messages({
        'string.min': 'Прізвище повинно містити мінімум 2 символи',
        'string.max': 'Прізвище не повинно перевищувати 100 символів',
        'string.pattern.name':
          'Прізвище може містити лише українські літери, апострофи та дефіси',
        'any.required': "Прізвище обов'язкове",
      }),

    patronymic: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .pattern(/^[А-Яа-яІіЇїЄєҐґ'\s-]+$/, 'ukrainian-name')
      .required()
      .messages({
        'string.min': 'По-батькові повинно містити мінімум 2 символи',
        'string.max': 'По-батькові не повинно перевищувати 100 символів',
        'string.pattern.name':
          'По-батькові може містити лише українські літери, апострофи та дефіси',
        'any.required': "По-батькові обов'язкове",
      }),

    birthDate: Joi.date().max('now').required().messages({
      'date.max': 'Дата народження не може бути в майбутньому',
      'any.required': "Дата народження обов'язкова",
    }),

    passportSeries: Joi.string().trim().length(10).required().messages({
      'string.length': 'РНОКПП повинен містити рівно 10 символів',
      'any.required': "РНОКПП обов'язковий",
    }),

    passportNumber: Joi.string()
      .trim()
      .length(9)
      .pattern(/^\d{9}$/, 'digits-only')
      .required()
      .messages({
        'string.length': 'Номер паспорту повинен містити рівно 9 цифр',
        'string.pattern.name': 'Номер паспорту може містити лише цифри',
        'any.required': "Номер паспорту обов'язковий",
      }),

    issuingAuthority: Joi.string().trim().min(4).max(255).required().messages({
      'string.min': 'Орган, що видав паспорт повинен містити мінімум 4 символи',
      'string.max':
        'Орган, що видав паспорт не повинен перевищувати 255 символів',
      'any.required': "Орган, що видав паспорт обов'язковий",
    }),

    placeOfResidence: Joi.string().trim().min(2).max(255).required().messages({
      'string.min': 'Місце проживання повинно містити мінімум 2 символи',
      'string.max': 'Місце проживання не повинно перевищувати 255 символів',
      'any.required': "Місце проживання обов'язкове",
    }),

    digitalSignature: Joi.string().trim().max(500).optional().messages({
      'string.max': 'Цифровий підпис не повинен перевищувати 500 символів',
    }),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: 400,
      message: 'Помилка валідації',
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.body = value;
  next();
};

export const updateApplicationStatusValidation = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .required()
    .messages({
      'any.only': 'Статус може бути лише pending, approved або rejected',
      'any.required': "Статус обов'язковий",
    }),

  rejectionReason: Joi.when('status', {
    is: 'rejected',
    then: Joi.string().trim().min(10).max(1000).required().messages({
      'string.min': 'Причина відхилення повинна містити мінімум 10 символів',
      'string.max': 'Причина відхилення не повинна перевищувати 1000 символів',
      'any.required': "Причина відхилення обов'язкова при відхиленні анкети",
    }),
    otherwise: Joi.optional(),
  }),
});
