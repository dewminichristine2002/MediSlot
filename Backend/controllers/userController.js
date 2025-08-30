// controllers/userController.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Helper to sign JWT
function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.user_category },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

// Shape safe user response (no password)
function toPublicUser(u) {
  const obj = u.toObject ? u.toObject() : u;
  delete obj.password;
  return obj;
}

/**
 * POST /api/users/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, contact_no, name, password, address, user_category } = req.body;

    const user = await User.create({
      email,
      contact_no,
      name,
      password,
      address,
      user_category,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    if (err?.code === 11000) {
      // duplicate key (email/contact)
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate ${field}` });
    }
    return res.status(400).json({ message: 'Registration failed', error: err.message });
  }
};

/**
 * POST /api/users/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    // hide password before sending
    user.password = undefined;

    return res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    return res.status(400).json({ message: 'Login failed', error: err.message });
  }
};

/**
 * GET /api/users/me
 */
exports.me = async (req, res) => {
  return res.json(toPublicUser(req.user));
};

/**
 * PATCH /api/users/me
 * Editable: name, contact_no, address
 */
exports.updateMe = async (req, res) => {
  try {
    const allowed = ['name', 'contact_no', 'address'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });

    return res.json(toPublicUser(user));
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate ${field}` });
    }
    return res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

/**
 * PATCH /api/users/me/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword; // will be hashed by pre('save')
    await user.save();

    return res.json({ message: 'Password updated' });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to change password', error: err.message });
  }
};

/**
 * GET /api/users (admin)
 * Query: page, limit, q, category
 */
exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const f = {};
    if (req.query.category) f.user_category = req.query.category;

    // simple text filter on name/email/contact
    if (req.query.q) {
      const rx = new RegExp(req.query.q.trim(), 'i');
      f.$or = [{ name: rx }, { email: rx }, { contact_no: rx }];
    }

    const [items, total] = await Promise.all([
      User.find(f).sort({ created_at: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(f),
    ]);

    return res.json({ page, limit, total, pages: Math.ceil(total / limit), items });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to list users', error: err.message });
  }
};

/**
 * GET /api/users/:id (admin or owner)
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    // owner or admin
    if (req.user.user_category !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

/**
 * PATCH /api/users/:id (admin)
 * Admin can update: name, contact_no, address, user_category
 */
exports.updateByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const allowed = ['name', 'contact_no', 'address', 'user_category'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate ${field}` });
    }
    return res.status(400).json({ message: 'Failed to update user', error: err.message });
  }
};

/**
 * DELETE /api/users/:id (admin)
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const del = await User.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'User not found' });

    return res.json({ message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};
