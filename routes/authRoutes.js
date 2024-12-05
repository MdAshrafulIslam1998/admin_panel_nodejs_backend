// routes/authRoutes.js


// routes/authRoutes.js
const jwt = require('jsonwebtoken');
const express = require('express');
const { getUserByEmail, createUser } = require('../models/userModel'); // Import your user model
const { v4: uuidv4 } = require('uuid'); // For generating unique user_id
const { RESPONSE_CODES, MESSAGES } = require('../utils/message'); // Import response codes and messages
const router = express.Router();
const crypto = require('crypto');
const { createTFA, getTFABySessionId, validateTFA, updateUserPassword, checkTfaSession } = require('../models/tfaModel');
const { sendEmail } = require('../utils/emailSender'); // Import the email sender
require('dotenv').config();

// POST /auth/login - User Login
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Check if email and password were provided
    if (!email || !password) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.EMAIL_PASSWORD_REQUIRED
        });
    }

    try {
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.USER_NOT_FOUND
            });
        }

        // Here, you would usually hash the password and compare
        if (user.password !== password) {
            return res.status(401).json({
                responseCode: RESPONSE_CODES.UNAUTHORIZED,
                responseMessage: MESSAGES.INVALID_CREDENTIALS
            });
        }

        // User login successful, create JWT
        const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Modify the response to include the token under "data"
        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.LOGIN_SUCCESS,
            data: {
                token,
                user_id: user.user_id // Add the user_id here
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message
        });
    }
});


// POST /auth/register - User Registration
router.post('/auth/register', async (req, res) => {
    const { name, email, password, phone, documents, dob, gender, address, session_id } = req.body;

    // Validate input
    if (!name || !email || !password || !session_id) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.VALIDATION_ERROR,
            responseMessage: MESSAGES.NAME_EMAIL_PASSWORD_REQUIRED,
            data: { state: false } // Include state: false on validation failure
        });
    }

    try {
        // Fetch the TFA entry by session_id
        const tfaEntry = await getTFABySessionId(session_id);

        // Check if the session is found
        if (!tfaEntry) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.SESSION_NOT_FOUND,
                data: { state: false } // Include state: false when session not found
            });
        }

        // Check if the session is validated or expired
        if (tfaEntry.status !== 'VALIDATED') {
            if (tfaEntry.status === 'EXPIRED') {
                return res.status(403).json({
                    responseCode: RESPONSE_CODES.FORBIDDEN,
                    responseMessage: MESSAGES.TFA_CODE_EXPIRED,
                    data: { state: false } // Include state: false when TFA expired
                });
            } else {
                return res.status(403).json({
                    responseCode: RESPONSE_CODES.FORBIDDEN,
                    responseMessage: MESSAGES.INVALID_TFA_CODE,
                    data: { state: false } // Include state: false when TFA is invalid
                });
            }
        }

        // Check if the user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                responseCode: RESPONSE_CODES.UNAUTHORIZED,
                responseMessage: MESSAGES.EMAIL_ALREADY_EXISTS,
                data: { state: false } // Include state: false when email already exists
            });
        }

        // Create a unique user ID
        const userId = uuidv4();

        // Prepare user data
        const userData = {
            name: name,
            email: email,
            password: password,  // Ensure to hash this in production
            phone: phone || null, // Optional
            documents: documents || null, // Optional
            user_id: userId,
            dob: dob || null, // Optional
            gender: gender || null, // Default to 'OTHER' if not provided
            address: address || null, // Optional
            level: null // Default to null as no level provided
        };

        // Create new user
        await createUser(userData);

        return res.status(201).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.REGISTRATION_SUCCESS,
            data: { user_id: userId } // Return user_id in response
        });
    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
            data: { state: false } // Include state: false on server error
        });
    }
});






// Helper function to generate random TFA code
const generateTFACode = () => Math.floor(100000 + Math.random() * 900000).toString();



// POST /api/send-verification - Send verification code
router.post('/auth/send-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.INVALID_INPUT_PROVIDED
        });
    }

    try {
        const tfaCode = generateTFACode();
        const sessionId = crypto.randomUUID();
        const createdAt = new Date();
        const expiredAt = new Date(createdAt.getTime() + 5 * 60 * 1000); // Expires in 5 minutes

        // Save TFA record in the database
        await createTFA(tfaCode, email, sessionId, expiredAt);

        // Send the verification code via email
        const subject = 'Your GlobiPay Verification Code';
        const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlobiPay Verification</title>
    <style>
        body {
            font-family: 'Inter', Arial, sans-serif;
            background-color: #f4f6f9;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .email-container {
            max-width: 500px;
            width: 100%;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 30px;
            text-align: center;
            border: 1px solid #e0e6ed;
        }
        .logo {
            margin-bottom: 20px;
        }
        .verification-title {
            color: #007BFF;
            margin-bottom: 15px;
        }
        .verification-code {
            background-color: #f0f4ff;
            border: 2px dashed #007BFF;
            color: #007BFF;
            font-size: 28px;
            font-weight: 700;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            letter-spacing: 4px;
            margin: 20px 0;
        }
        .instruction {
            color: #555;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .warning {
            font-size: 12px;
            color: #888;
            margin-top: 20px;
        }
        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo">
    <img 
        src="https://www.projectzerotwofour.cloudns.ch/files_server/app_logo.png" 
        alt="GlobiPay" 
        width="162" 
        height="105" 
    />
</div>
        
        <h2 class="verification-title">Verify Your Account</h2>
        
        <p class="instruction">
            <strong>Security Verification</strong><br>
            The verification code will expire in 5 minutes.
        </p>
        
        <div class="verification-code">
            ${tfaCode}
        </div>
        
        <p class="instruction">
            Enter this code on the verification page to complete your account creation process.
            Do not share this code with anyone.
        </p>
        
        <p class="warning">
            If you did not request this verification, please contact our support immediately.
        </p>
        
        <div class="footer">
            © 2024 GlobiPay | Secure Verification Service
        </div>
    </div>
</body>
</html>
`;
        await sendEmail(email, subject, html);


        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.TFA_CODE_SENT,
            data: { session_id: sessionId }
        });
    } catch (error) {
        console.error('Error sending verification code:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR
        });
    }
});



// POST /auth/verify-code - Verify the TFA code
router.post('/auth/verify-code', async (req, res) => {
    const { session_id, tfa_code } = req.body;

    if (!session_id || !tfa_code) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.INVALID_INPUT_PROVIDED
        });
    }

    try {
        // Retrieve the TFA record by session ID
        const tfaRecord = await getTFABySessionId(session_id);

        if (!tfaRecord) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.SESSION_NOT_FOUND
            });
        }

        // Check if the code matches and hasn't expired
        const now = new Date();
        if (tfaRecord.tfa_code !== tfa_code) {
            return res.status(401).json({
                responseCode: RESPONSE_CODES.UNAUTHORIZED,
                responseMessage: MESSAGES.INVALID_TFA_CODE
            });
        } else if (tfaRecord.expired_at < now) {
            return res.status(400).json({
                responseCode: RESPONSE_CODES.BAD_REQUEST,
                responseMessage: MESSAGES.TFA_CODE_EXPIRED
            });
        }

        // Mark the TFA as validated
        await validateTFA(session_id);

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.TFA_VALIDATED
        });
    } catch (error) {
        console.error('Error during code verification:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR
        });
    }
});


// POST /api/reset-password - Reset Password
router.post('/auth/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    // Validate input
    if (!email || !newPassword) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.EMAIL_PASSWORD_REQUIRED
        });
    }

    try {
        // Fetch user by email
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.USER_NOT_FOUND
            });
        }

        // Update the password in the database (as plain text)
        await updateUserPassword(email, newPassword);

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.PASSWORD_RESET_SUCCESS
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR
        });
    }
});

module.exports = router;