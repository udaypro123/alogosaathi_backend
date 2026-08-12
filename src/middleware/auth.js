import jwt from "jsonwebtoken"
import User from "../models/User.models.js"
import rateLimit from 'express-rate-limit';
// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;
    // Check for token in headers
    // console.log("req.headers", req)
    // console.log("req.headers", req.headers)
    // console.log("req.cookies", req.cookies)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }
    // console.log("req.cookies.token", req.cookies.token, token)

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      // console.log("process.env.JWT_SECRET", process.env.JWT_SECRET)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("decoded", decoded)
      
      // Get user from the token
      const user = await User.findById(decoded.id);
      // console.log("useruseruser", user)

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    // Skip auth check for preflight CORS requests
    // console.log("Authorizing roles1:", req.method )
    if (req.method === 'OPTIONS') {
      return next();
    }

    // console.log('Authorizing roles1:', roles);
    // console.log('Authorizing req.user', req.user ? req.user.role : 'No user');

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from the token
        const user = await User.findById(decoded.id);

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Check if user owns the resource or is admin
const resourceOwnership = (resourceUserField = 'user') => {
  return (req, res, next) => {
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (req.params.id && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    next();
  };
};

// Rate limiting for authentication routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export {
  protect,
  authorize,
  optionalAuth,
  resourceOwnership,
  authRateLimit
};
