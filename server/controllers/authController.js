import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validation.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, company } = req.body;

  const sanitizedEmail = sanitizeInput(email);
  const sanitizedFirstName = sanitizeInput(firstName);
  const sanitizedLastName = sanitizeInput(lastName);
  const sanitizedCompany = sanitizeInput(company);

  if (!validateEmail(sanitizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: passwordValidation.message
    });
  }

  const existingUser = await User.findOne({ email: sanitizedEmail });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const user = new User({
    email: sanitizedEmail,
    password,
    profile: {
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      company: sanitizedCompany
    }
  });

  await user.save();

  const token = generateToken(user._id);
  
  if (process.env.NODE_ENV === 'production') {
    setTokenCookie(res, token);
  }

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token: process.env.NODE_ENV === 'production' ? undefined : token
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const sanitizedEmail = sanitizeInput(email);

  if (!validateEmail(sanitizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  const user = await User.findOne({ email: sanitizedEmail });
  
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
  
  if (process.env.NODE_ENV === 'production') {
    setTokenCookie(res, token);
  }

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token: process.env.NODE_ENV === 'production' ? undefined : token
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
  if (process.env.NODE_ENV === 'production') {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});
