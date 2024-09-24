// routes/userRoutes.js
const express = require('express');
const { getUserById } = require('../models/userModel');
const { getCoinsByUserId } = require('../models/coinModel');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// GET /api/user/:userId - Fetch user data and coin data
router.get('/user/:userId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Fetch user data
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        statusCode: 'E10001',
        message: 'User not found',
        data: null
      });
    }

    // Fetch user's coins and sum them
    const coins = await getCoinsByUserId(userId);

    // Prepare the response data
    const responseData = {
      full_name: user.name,
      email: user.email,
      primary_coin: coins.primary_coin || 0,
      secondary_coin: coins.secondary_coin || 0,
      level: user.level,
      date: user.date,
      status: user.status
    };

    res.status(200).json({
      statusCode: 'S10000',
      message: 'Fetch Successfully',
      data: responseData
    });
  } catch (error) {
    next(error); // Forward the error to centralized error handler
  }
});

module.exports = router;
