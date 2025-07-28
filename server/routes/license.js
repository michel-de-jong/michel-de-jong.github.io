import express from 'express';
import {
  getLicenseStatus,
  checkFeatureAccess,
  getLicensePlans,
  upgradeLicense,
  getPaymentHistory,
  cancelSubscription
} from '../controllers/licenseController.js';
import { authenticateToken, requirePremium } from '../middleware/auth.js';

const router = express.Router();

router.get('/plans', getLicensePlans);

router.use(authenticateToken);
router.get('/status', getLicenseStatus);
router.get('/feature/:feature', checkFeatureAccess);
router.get('/payments', getPaymentHistory);
router.post('/upgrade', upgradeLicense);
router.post('/cancel', cancelSubscription);

export default router;
