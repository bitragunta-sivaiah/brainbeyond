import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes and validate session
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Get token from header
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify token and decode payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Fetch user from DB and explicitly include the sessionToken for comparison
      const user = await User.findById(decoded.id).select('+sessionToken');

      // 4. Check if user exists
      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // 5. CRUCIAL: Compare the session token from the JWT with the one in the database
      if (user.sessionToken !== decoded.session) {
        // This is the key logic: if they don't match, the session is invalid
        return res.status(401).json({ success: false, message: 'Session has expired. Please log in again.' });
      }
      
      // 6. If all checks pass, attach user to request and proceed
      req.user = user;
      next();

    } catch (error) {
      // Catches errors like expired tokens or malformed JWTs
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Middleware to authorize based on role (no changes needed here)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

export { protect, authorize };