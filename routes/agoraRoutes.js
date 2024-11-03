const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const authenticateToken = require('../middleware/authenticateToken');
const { SUCCESS, ERROR } = require('../middleware/handler');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

// Load environment variables from .env file
dotenv.config();

// Get Agora credentials from environment variables
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

// POST /api/generateToken - Get New Token using UID and Channel Name
router.post('/agora/generateToken', authenticateToken, async (req, res) => {
  try {
    const { channelName } = req.body;
    const uid = 0; // Let Agora assign the UID

    // Validate the input
    if (!channelName) {
      return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.INVALID_TOKEN_INPUT);
    }

    // Set role and token expiration
    const role = RtcRole.PUBLISHER;
    const expireTimeInSeconds = 36000; // Set token to expire in 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTimestamp + expireTimeInSeconds;

    // Generate the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpireTs
    );

    // Prepare the response data
    const agoraTokenResponse = { token };

    // Respond with success
    SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TOKEN_GENERATE_SUCCESS, agoraTokenResponse);
  } catch (error) {
    console.error(error);
    ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TOKEN_GENERATE_FAILED, error.message);
  }
});

module.exports = router;
