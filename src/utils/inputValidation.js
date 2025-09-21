import { Filter } from 'bad-words';
import validator from 'validator';

// Initialize bad words filter with custom words
const filter = new Filter();

// Add custom inappropriate words (Ukrainian/Russian/English)
const customBadWords = [
  // Admin/System reserved
  'admin',
  'administrator',
  'root',
  'system',
  'null',
  'undefined',
  'moderator',
  'support',
  'помощь',
  'поддержка',
  'админ',

  // Spam patterns
  'test',
  'user',
  'guest',
  'temp',
  'temporary',
  'bot',
  'spam',
  'пользователь',
  'юзер',
  'тест',
  'гость',

  // Inappropriate (basic list - can be extended)
  'hitler',
  'nazi',
  'фашист',
  'гитлер',

  // Common offensive patterns
  'penis',
  'vagina',
  'sex',
  'porn',
  'секс',
  'порно',

  // Hate speech indicators
  'kill',
  'die',
  'death',
  'убить',
  'смерть',
  'умри',
];

filter.addWords(...customBadWords);

export const validateNickname = (nickname) => {
  const cleanNickname = nickname.toLowerCase().trim();

  // Check for inappropriate words
  if (filter.isProfane(cleanNickname)) {
    return {
      isValid: false,
      reason: 'Никнейм содержит неприемлемые слова',
    };
  }

  // Check for consecutive special characters (spam pattern)
  if (/[_]{3,}|[0-9]{8,}/.test(cleanNickname)) {
    return {
      isValid: false,
      reason: 'Никнейм не должен содержать подряд более 2 одинаковых символов',
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /^[0-9]+$/, // Only numbers
    /^[_]+$/, // Only underscores
    /admin/i, // Contains admin
    /mod/i, // Contains mod
    /bot$/i, // Ends with bot
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(cleanNickname)) {
      return {
        isValid: false,
        reason: 'Никнейм имеет недопустимый формат',
      };
    }
  }

  // Check minimum meaningful length (after cleaning)
  const meaningfulChars = cleanNickname.replace(/[_0-9]/g, '');
  if (meaningfulChars.length < 2) {
    return {
      isValid: false,
      reason: 'Никнейм должен содержать минимум 2 буквы',
    };
  }

  return {
    isValid: true,
    reason: null,
  };
};

// Validate email with additional checks
export const validateEmail = (email) => {
  if (!validator.isEmail(email)) {
    return {
      isValid: false,
      reason: 'Некорректный формат email',
    };
  }

  // Check for disposable email domains
  const disposableDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com',
    'temp-mail.org',
  ];

  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(emailDomain)) {
    return {
      isValid: false,
      reason: 'Временные email адреса не разрешены',
    };
  }

  return {
    isValid: true,
    reason: null,
  };
};

// Enhanced password validation
export const validatePassword = (password) => {
  const issues = [];

  if (password.length < 8) {
    issues.push('минимум 8 символов');
  }

  if (!/[a-z]/.test(password)) {
    issues.push('строчные буквы');
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('заглавные буквы');
  }

  if (!/[0-9]/.test(password)) {
    issues.push('цифры');
  }

  if (!/[\W_]/.test(password)) {
    issues.push('специальные символы');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password',
    '12345678',
    'qwerty123',
    'admin123',
    'пароль123',
    'password1',
    '123456789',
    'qwertyui',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      isValid: false,
      reason: 'Пароль слишком простой. Используйте более сложную комбинацию.',
    };
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    return {
      isValid: false,
      reason: 'Пароль не должен содержать более 2 одинаковых символов подряд',
    };
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      reason: `Пароль должен содержать: ${issues.join(', ')}`,
    };
  }

  return {
    isValid: true,
    reason: null,
  };
};
