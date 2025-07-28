export const LICENSE_TYPES = {
  FREE: 'free',
  SUBSCRIPTION: 'subscription', 
  LIFETIME: 'lifetime'
};

export const SUBSCRIPTION_PERIODS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled',
  REFUNDED: 'refunded'
};

export const FEATURES = {
  CALCULATOR: 'calculator',
  SCENARIOS: 'scenarios',
  MONTE_CARLO: 'monte-carlo',
  WATERFALL: 'waterfall',
  PORTFOLIO: 'portfolio',
  HISTORICAL: 'historical',
  SAVED: 'saved',
  EXPORT: 'export'
};

export const FREE_FEATURES = [FEATURES.CALCULATOR];

export const PREMIUM_FEATURES = [
  FEATURES.SCENARIOS,
  FEATURES.MONTE_CARLO,
  FEATURES.WATERFALL,
  FEATURES.PORTFOLIO,
  FEATURES.HISTORICAL,
  FEATURES.SAVED,
  FEATURES.EXPORT
];

export const PRICING = {
  MONTHLY: 2900, // €29.00
  YEARLY: 29000, // €290.00
  LIFETIME: 99000 // €990.00
};

export const CURRENCIES = ['EUR', 'USD', 'GBP'];

export const COUNTRIES = [
  'NL', 'BE', 'DE', 'FR', 'GB', 'US', 'CA', 'AU'
];

export const DEFAULT_PREFERENCES = {
  currency: 'EUR',
  language: 'nl',
  emailNotifications: true
};
