import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.hasPremiumAccess()) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required',
        code: 'PREMIUM_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Premium middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!req.user.hasFeatureAccess(featureName)) {
        return res.status(403).json({
          success: false,
          message: `Access to ${featureName} feature requires premium subscription`,
          code: 'FEATURE_ACCESS_DENIED',
          feature: featureName
        });
      }

      next();
    } catch (error) {
      console.error('Feature middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
