const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'mySecretKey';

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // 获取完整的用户信息（排除密码）
    const userWithoutPassword = await User.findById(user.id).select('-password');

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;

        res.json({
          token,
          user: userWithoutPassword.toJSON()
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
      role: role || 'parent'
    });

    await user.save();

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // 获取完整的用户信息（排除密码）
    const userWithoutPassword = await User.findById(user.id).select('-password');

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;

        res.json({
          token,
          user: userWithoutPassword.toJSON()
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/auth/update
// @desc    Update user data
// @access  Private
router.put('/update', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    console.log('Update request received, token:', token ? 'exists' : 'missing');
    
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded user id:', decoded.user.id);
    const { studentName, currentGrade } = req.body;
    console.log('Update data:', { studentName, currentGrade });

    const user = await User.findById(decoded.user.id);
    console.log('Found user:', user ? 'yes' : 'no');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (studentName !== undefined) {
      user.studentName = studentName;
    }
    if (currentGrade !== undefined) {
      user.currentGrade = currentGrade;
    }

    console.log('Saving user...');
    await user.save();
    console.log('User saved successfully');

    const userWithoutPassword = await User.findById(decoded.user.id).select('-password');
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Update error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
});

module.exports = router;