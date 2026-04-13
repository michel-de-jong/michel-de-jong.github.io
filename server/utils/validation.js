export const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password must not exceed 128 characters'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }

  return {
    isValid: true,
    message: 'Password is valid'
  };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>&"'/]/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
      };
      return entities[char];
    });
};

export const sanitizeProfileField = (input, maxLength = 100) => {
  if (typeof input !== 'string') return input;
  return sanitizeInput(input).slice(0, maxLength);
};

const ALLOWED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'CNY', 'SEK', 'NZD'];
const ALLOWED_LANGUAGES = ['nl', 'en', 'de', 'fr'];
const ALLOWED_COUNTRIES = ['NL', 'BE', 'DE', 'FR', 'GB', 'US', 'CA', 'AU'];

export const validateCurrency = (currency) => {
  return typeof currency === 'string' && ALLOWED_CURRENCIES.includes(currency.toUpperCase());
};

export const validateLanguage = (language) => {
  return typeof language === 'string' && ALLOWED_LANGUAGES.includes(language.toLowerCase());
};

export const validateCountry = (country) => {
  return typeof country === 'string' && ALLOWED_COUNTRIES.includes(country.toUpperCase());
};
