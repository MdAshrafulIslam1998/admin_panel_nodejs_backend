// routes/userRoutes.js
const express = require('express');
const { getUserById } = require('../models/userModel');
const { getCoinsByUserId } = require('../models/coinModel');
const authenticateToken = require('../middleware/authenticateToken');
const {SUCCESS,ERROR} = require('../middleware/handler');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');
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

    SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.USER_SUCCESS_DETAILS, responseData);
  } catch (error) {
    next(error);  // Pass to errorHandler
  }
});

module.exports = router;
