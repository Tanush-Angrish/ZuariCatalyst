const jwt = require('jsonwebtoken');

/**
 * Reads auth_token from the httpOnly cookie, verifies it, and
 * attaches the decoded payload to req.user.
 *
 * Skipped automatically for public routes (auth endpoints).
 */
function authMiddleware(req, res, next) {
  // Parse auth_token from Cookie header without needing cookie-parser
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').find(c => c.trim().startsWith('auth_token='));
  const token = match ? match.trim().slice('auth_token='.length) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name, role, organization }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = authMiddleware;
