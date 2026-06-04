const rateLimit = require('express-rate-limit');

// General rate limiter - Increased limits for development
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000; // 1 minute
// In development, use much higher limits to prevent 429 errors during rapid navigation
const defaultMax = process.env.NODE_ENV === 'production' ? 120 : 1000; // 1000 requests per minute in development
const max = Number(process.env.RATE_LIMIT_MAX) || defaultMax;

const limiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  // Skip successful requests in development to be more lenient
  skipSuccessfulRequests: process.env.NODE_ENV === 'development',
  // Skip rate limiting entirely in development if DISABLE_RATE_LIMIT is set
  skip: (req, res) => {
    return process.env.DISABLE_RATE_LIMIT === 'true';
  },
});

// Stricter rate limiter for authentication endpoints (login, signup)
const authWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX) || 5;

const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
  // Skip rate limiting in development/test mode or if DISABLE_AUTH_RATE_LIMIT is set
  skip: (req, res) => {
    return process.env.NODE_ENV === 'development' || 
           process.env.NODE_ENV === 'test' ||
           process.env.DISABLE_AUTH_RATE_LIMIT === 'true';
  },
});

// Rate limiter for password reset endpoints
const passwordResetWindowMs = Number(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000; // 1 hour
const passwordResetMax = Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX) || 3;

const passwordResetRateLimiter = rateLimit({
  windowMs: passwordResetWindowMs,
  max: passwordResetMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.',
  },
});

// Rate limiter for OTP endpoints
const otpWindowMs = Number(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000; // 5 minutes
const otpMax = Number(process.env.OTP_RATE_LIMIT_MAX) || 3;

const otpRateLimiter = rateLimit({
  windowMs: otpWindowMs,
  max: otpMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 5 minutes.',
  },
  // Skip rate limiting in development/test mode or if DISABLE_OTP_RATE_LIMIT is set
  skip: (req, res) => {
    return process.env.NODE_ENV === 'development' || 
           process.env.NODE_ENV === 'test' ||
           process.env.DISABLE_OTP_RATE_LIMIT === 'true';
  },
});

module.exports = limiter;
module.exports.authRateLimiter = authRateLimiter;
module.exports.passwordResetRateLimiter = passwordResetRateLimiter;
module.exports.otpRateLimiter = otpRateLimiter;

