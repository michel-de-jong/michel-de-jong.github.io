import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, company } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const user = new User({
    email,
    password,
    profile: {
      firstName,
      lastName,
      company
    }
  });

  await user.save();

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token
    }
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toJSON()
    }
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, company, country, currency, language, emailNotifications } = req.body;

  const user = req.user;

  if (firstName !== undefined) user.profile.firstName = firstName;
  if (lastName !== undefined) user.profile.lastName = lastName;
  if (company !== undefined) user.profile.company = company;
  if (country !== undefined) user.profile.country = country;

  if (currency !== undefined) user.preferences.currency = currency;
  if (language !== undefined) user.preferences.language = language;
  if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toJSON()
    }
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const user = req.user;
  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      token
    }
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});
