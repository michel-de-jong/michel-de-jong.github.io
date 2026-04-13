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
import { registerRateLimit, loginRateLimit } from '../middleware/security.js';

const router = express.Router();

router.post('/register', registerRateLimit, register);
router.post('/login', loginRateLimit, login);

router.use(authenticateToken);
router.post('/logout', logout);
router.get('/verify', getProfile);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/refresh-token', refreshToken);

export default router;
