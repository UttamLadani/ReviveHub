import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { HttpError, wrap } from '../utils.js';

const router = Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// used so a wrong email takes about as long as a wrong password
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const str = (v) => (typeof v === 'string' ? v.trim() : '');

router.post(
  '/register',
  wrap(async (req, res) => {
    const name = str(req.body.name);
    const business = str(req.body.business);
    const email = str(req.body.email).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = req.body.role;

    // admins can never be created here, only through the seed script
    if (role !== 'seller' && role !== 'buyer') throw new HttpError(400, 'Choose Seller or Buyer.');
    if (!name || !business) throw new HttpError(400, 'Please enter your name and business name.');
    if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, 'Enter a valid email address.');
    if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
    if (password.length > 72) throw new HttpError(400, 'Password is too long (maximum 72 characters).');

    if (await User.exists({ email })) {
      throw new HttpError(409, 'An account with this email already exists. Try logging in.');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await User.create({ name, business, email, passwordHash, role });
    } catch (e) {
      if (e.code === 11000) throw new HttpError(409, 'An account with this email already exists. Try logging in.');
      throw e;
    }
    res.status(201).json({ token: signToken(user), user });
  })
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const email = str(req.body.email).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, 'Wrong email or password.');
    res.json({ token: signToken(user), user });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
