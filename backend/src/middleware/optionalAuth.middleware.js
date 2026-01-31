const jwt = require('jsonwebtoken');

const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue as unauthenticated user
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    // Try to verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Contains { id, email, role }
    } catch (err) {
      // Invalid or expired token - continue as unauthenticated
      req.user = null;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { optionalAuthenticate };
