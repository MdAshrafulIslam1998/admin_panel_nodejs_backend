const express = require('express');
const { RESPONSE_CODES, MESSAGES } = require('../utils/message'); // Import centralized messages
const { updateGmailAppPassCredentials: updateGmailAppPassCredentials } = require('../models/gmailAppPaasModel'); // Import the model function
const router = express.Router();

/**
 * PUT /api/update-email-credentials - Update email credentials
 */
router.put('/api/update-gmailAppPassword-credentials', async (req, res) => {
    const { email_user, email_pass } = req.body;

    // Validate input
    if (!email_user || !email_pass) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.INVALID_INPUT_PROVIDED,
        });
    }

    try {
        // Update the email credentials in the database
        const isUpdated = await updateGmailAppPassCredentials(email_user, email_pass);

        if (!isUpdated) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.GMAIL_APPPASS_UPDATE_FAILED, // Add a message like "Failed to update email credentials"
            });
        }

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.GMAIL_APPPASS_UPDATE_SUCCESS, // Add a message like "Email credentials updated successfully"
        });
    } catch (error) {
        console.error('Error updating email credentials:', error.message);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR, // Use a generic server error message
        });
    }
});

module.exports = router;
