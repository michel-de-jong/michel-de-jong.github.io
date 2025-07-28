import express from 'express';
import { authenticateToken, requireFeature } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(authenticateToken);

const premiumFeatures = [
  'scenarios',
  'monte-carlo', 
  'waterfall',
  'portfolio',
  'historical',
  'saved',
  'export'
];

router.get('/:feature/access', asyncHandler(async (req, res) => {
  const { feature } = req.params;
  
  if (!premiumFeatures.includes(feature)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid feature'
    });
  }

  const hasAccess = req.user.hasFeatureAccess(feature);

  res.json({
    success: true,
    data: {
      feature,
      hasAccess,
      licenseType: req.user.license.type
    }
  });
}));

router.get('/scenarios/data', requireFeature('scenarios'), asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Scenarios feature accessed',
    data: {
      feature: 'scenarios',
      available: true
    }
  });
}));

router.get('/monte-carlo/data', requireFeature('monte-carlo'), asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Monte Carlo feature accessed',
    data: {
      feature: 'monte-carlo',
      available: true
    }
  });
}));

router.get('/waterfall/data', requireFeature('waterfall'), asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Waterfall feature accessed',
    data: {
      feature: 'waterfall',
      available: true
    }
  });
}));

router.get('/portfolio/data', requireFeature('portfolio'), asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Portfolio feature accessed',
    data: {
      feature: 'portfolio',
      available: true
    }
  });
}));

router.get('/historical/data', requireFeature('historical'), asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Historical feature accessed',
    data: {
      feature: 'historical',
      available: true
    }
  });
}));

router.get('/saved/data', requireFeature('saved'), asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Saved scenarios feature accessed',
    data: {
      feature: 'saved',
      available: true
    }
  });
}));

router.get('/export/data', requireFeature('export'), asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Export feature accessed',
    data: {
      feature: 'export',
      available: true
    }
  });
}));

export default router;
