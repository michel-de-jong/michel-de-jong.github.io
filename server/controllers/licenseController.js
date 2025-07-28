import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getLicenseStatus = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      license: user.license,
      hasPremiumAccess: user.hasPremiumAccess(),
      features: user.license.features,
      daysRemaining: user.license.expiresAt ? 
        Math.max(0, Math.ceil((user.license.expiresAt - new Date()) / (1000 * 60 * 60 * 24))) : 
        null
    }
  });
});

export const checkFeatureAccess = asyncHandler(async (req, res) => {
  const { feature } = req.params;
  const user = req.user;

  const hasAccess = user.hasFeatureAccess(feature);

  res.json({
    success: true,
    data: {
      feature,
      hasAccess,
      licenseType: user.license.type,
      requiresPremium: !['calculator'].includes(feature)
    }
  });
});

export const getLicensePlans = asyncHandler(async (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'EUR',
      period: null,
      features: ['calculator'],
      description: 'Basic ROI calculations',
      limitations: [
        'Basic calculator only',
        'No advanced features',
        'No data export'
      ]
    },
    {
      id: 'monthly',
      name: 'Professional Monthly',
      price: 29,
      currency: 'EUR',
      period: 'monthly',
      features: [
        'calculator',
        'scenarios', 
        'monte-carlo',
        'waterfall',
        'portfolio',
        'historical',
        'saved',
        'export'
      ],
      description: 'Full access to all premium features',
      popular: false
    },
    {
      id: 'yearly',
      name: 'Professional Yearly',
      price: 290,
      currency: 'EUR',
      period: 'yearly',
      originalPrice: 348,
      savings: 58,
      features: [
        'calculator',
        'scenarios',
        'monte-carlo', 
        'waterfall',
        'portfolio',
        'historical',
        'saved',
        'export'
      ],
      description: 'Full access with 2 months free',
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime License',
      price: 990,
      currency: 'EUR',
      period: 'lifetime',
      features: [
        'calculator',
        'scenarios',
        'monte-carlo',
        'waterfall', 
        'portfolio',
        'historical',
        'saved',
        'export'
      ],
      description: 'One-time payment, lifetime access',
      popular: false,
      badge: 'Best Value'
    }
  ];

  res.json({
    success: true,
    data: {
      plans
    }
  });
});

export const upgradeLicense = asyncHandler(async (req, res) => {
  const { licenseType, period } = req.body;
  const user = req.user;

  let expiresAt = null;

  if (licenseType === 'subscription') {
    const now = new Date();
    if (period === 'monthly') {
      expiresAt = new Date(now.setMonth(now.getMonth() + 1));
    } else if (period === 'yearly') {
      expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
    }
  }

  await user.updateLicense(licenseType, expiresAt);

  res.json({
    success: true,
    message: 'License upgraded successfully',
    data: {
      license: user.license,
      hasPremiumAccess: user.hasPremiumAccess()
    }
  });
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select('-webhookEvents -metadata')
    .limit(50);

  res.json({
    success: true,
    data: {
      payments
    }
  });
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.license.type !== 'subscription') {
    return res.status(400).json({
      success: false,
      message: 'No active subscription to cancel'
    });
  }

  user.license.cancelledAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Subscription will be cancelled at the end of the current period',
    data: {
      license: user.license
    }
  });
});
