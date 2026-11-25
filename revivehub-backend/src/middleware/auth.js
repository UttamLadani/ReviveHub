import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config.js';
import { HttpError, wrap } from '../utils.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: '7d' });
}

// Checks the login token, then loads the user from the database so the role
// always comes from the server, never from anything the browser sends.
export const requireAuth = wrap(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'Please log in.');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Your session expired. Please log in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Your session expired. Please log in again.');
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, 'You do not have access to this.'));
  }
  next();
};
