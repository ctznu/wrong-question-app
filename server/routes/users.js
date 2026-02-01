const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET api/users
// @desc    Get all users
// @access  Admin or authenticated user
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password field
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Admin or authenticated user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Exclude password field

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Admin or authenticated user
router.put('/:id', async (req, res) => {
  try {
    const { username, email, role } = req.body;

    // Build user object
    const userFields = {};
    if (username) userFields.username = username;
    if (email) userFields.email = email;
    if (role) userFields.role = role;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password'); // Exclude password field

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Admin or authenticated user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndRemove(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;