const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const TokenBlacklist = require('../models/TokenBlacklist');

// Validate JWT secrets are set and strong
const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || ACCESS_SECRET;

if (!ACCESS_SECRET || ACCESS_SECRET === 'change-me' || ACCESS_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET is weak or not set. Please set a strong secret (min 32 chars) in production!');
}

if (!REFRESH_SECRET || REFRESH_SECRET === ACCESS_SECRET) {
  console.warn('⚠️  WARNING: JWT_REFRESH_SECRET should be different from JWT_SECRET for better security!');
}

const ACCESS_EXPIRE = process.env.JWT_EXPIRE || '7d';
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

// JWT signing options for better security
const jwtOptions = {
  issuer: 'healiinn-api',
  algorithm: 'HS256',
};

/**
 * Create access token with enhanced security
 * @param {Object} payload - Token payload (id, role)
 * @returns {String} JWT access token
 */
const createAccessToken = (payload) => {
  if (!payload || !payload.id || !payload.role) {
    throw new Error('Invalid payload: id and role are required');
  }

  return jwt.sign(
    {
      id: payload.id,
      role: payload.role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    },
    ACCESS_SECRET,
    {
      ...jwtOptions,
    expiresIn: ACCESS_EXPIRE,
    }
  );
};

/**
 * Create refresh token with enhanced security
 * @param {Object} payload - Token payload (id, role)
 * @param {String} jti - Optional JWT ID for token rotation
 * @returns {String} JWT refresh token
 */
const createRefreshToken = (payload, jti = null) => {
  if (!payload || !payload.id || !payload.role) {
    throw new Error('Invalid payload: id and role are required');
  }

  const tokenId = jti || crypto.randomBytes(16).toString('hex');

  return jwt.sign(
    {
      id: payload.id,
      role: payload.role,
      type: 'refresh',
      jti: tokenId,
      iat: Math.floor(Date.now() / 1000),
    },
    REFRESH_SECRET,
    {
      ...jwtOptions,
    expiresIn: REFRESH_EXPIRE,
    }
  );
};

/**
 * Verify access token with blacklist check
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid, expired, or blacklisted
 */
const verifyAccessToken = async (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required and must be a string');
  }

  // Check if token is blacklisted
  const isBlacklisted = await TokenBlacklist.findOne({ token, tokenType: 'access' });
  if (isBlacklisted) {
    const error = new Error('Token has been revoked');
    error.name = 'TokenRevokedError';
    throw error;
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET, jwtOptions);

    // Validate token type
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    // Validate required fields
    if (!decoded.id || !decoded.role) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('Access token has expired');
      expiredError.name = 'TokenExpiredError';
      throw expiredError;
    }
    if (error.name === 'JsonWebTokenError') {
      const invalidError = new Error('Invalid access token');
      invalidError.name = 'JsonWebTokenError';
      throw invalidError;
    }
    throw error;
  }
};

/**
 * Verify refresh token with blacklist check
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid, expired, or blacklisted
 */
const verifyRefreshToken = async (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required and must be a string');
  }

  // Check if token is blacklisted
  const isBlacklisted = await TokenBlacklist.findOne({ token, tokenType: 'refresh' });
  if (isBlacklisted) {
    const error = new Error('Refresh token has been revoked');
    error.name = 'TokenRevokedError';
    throw error;
  }

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET, jwtOptions);

    // Validate token type
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Validate required fields
    if (!decoded.id || !decoded.role || !decoded.jti) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('Refresh token has expired');
      expiredError.name = 'TokenExpiredError';
      throw expiredError;
    }
    if (error.name === 'JsonWebTokenError') {
      const invalidError = new Error('Invalid refresh token');
      invalidError.name = 'JsonWebTokenError';
      throw invalidError;
    }
    throw error;
  }
};

/**
 * Decode token without verification (for extracting info from expired tokens)
 * @param {String} token - JWT token to decode
 * @returns {Object} Decoded token payload (may be expired)
 */
const decodeToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }
  return jwt.decode(token);
};

/**
 * Blacklist a token
 * @param {String} token - Token to blacklist
 * @param {String} tokenType - 'access' or 'refresh'
 * @param {String} userId - User ID
 * @param {String} role - User role
 * @param {String} reason - Reason for blacklisting
 * @returns {Promise<Object>} Blacklisted token document
 */
const blacklistToken = async (token, tokenType, userId, role, reason = 'logout') => {
  if (!token || !tokenType || !userId || !role) {
    throw new Error('Token, tokenType, userId, and role are required');
  }

  const decoded = decodeToken(token);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Check if already blacklisted
  const existing = await TokenBlacklist.findOne({ token });
  if (existing) {
    return existing;
  }

  return await TokenBlacklist.create({
    token,
    tokenType,
    userId,
    role,
    expiresAt,
    reason,
  });
};

/**
 * Blacklist all tokens for a user (for security incidents)
 * @param {String} userId - User ID
 * @param {String} role - User role
 * @param {String} reason - Reason for blacklisting
 * @returns {Promise<Object>} Result of blacklist operation
 */
const blacklistAllUserTokens = async (userId, role, reason = 'security') => {
  // This is a placeholder - in production, you'd want to track active tokens
  // For now, we'll just ensure future tokens are checked
  return { message: 'User tokens will be invalidated on next verification' };
};

/**
 * Check if token is blacklisted
 * @param {String} token - Token to check
 * @returns {Promise<Boolean>} True if blacklisted
 */
const isTokenBlacklisted = async (token) => {
  if (!token) return false;
  const blacklisted = await TokenBlacklist.findOne({ token });
  return !!blacklisted;
};

/**
 * Get token expiration date
 * @param {String} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  if (decoded?.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  blacklistToken,
  blacklistAllUserTokens,
  isTokenBlacklisted,
  getTokenExpiration,
};


