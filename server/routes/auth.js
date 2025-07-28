import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  refreshToken, 
  logout 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/security.js';

const router = express.Router();

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);

router.use(authenticateToken);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

export default router;
