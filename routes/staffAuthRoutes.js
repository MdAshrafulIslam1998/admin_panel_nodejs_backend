// routes/staffAuthRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { getStaffByEmail } = require('../models/staffLoginModel'); // Import the model
const { RESPONSE_CODES, MESSAGES } = require('../utils/message'); // Standard response codes/messages
require('dotenv').config();

const router = express.Router();

// POST /staffauth/login - Staff Login
router.post('/staffauth/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.EMAIL_PASSWORD_REQUIRED
        });
    }

    try {
        // Fetch staff by email
        const staff = await getStaffByEmail(email);
        if (!staff) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.USER_NOT_FOUND
            });
        }

        // Check staff status
        if (staff.status !== 'ACTIVE') {
            return res.status(403).json({
                responseCode: RESPONSE_CODES.FORBIDDEN,
                responseMessage: MESSAGES.STAFF_INACTIVE
            });
        }

        // Validate password (ensure password hashing in production)
        if (staff.password !== password) {
            return res.status(401).json({
                responseCode: RESPONSE_CODES.UNAUTHORIZED,
                responseMessage: MESSAGES.INVALID_CREDENTIALS
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { staff_id: staff.staff_id, email: staff.email, role: staff.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Respond with success
        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.LOGIN_SUCCESS,
            data: {
                token,
                staff_id: staff.staff_id,
                role: staff.role
            }
        });
    } catch (error) {
        console.error('Error during staff login:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message
        });
    }
});

module.exports = router;
