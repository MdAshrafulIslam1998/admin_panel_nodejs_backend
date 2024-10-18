// routes/authRoutes.js

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               phone:
 *                 type: string
 *                 example: 1234567890
 *               documents:
 *                 type: string
 *                 example: doc1,doc2
 *               dob:
 *                 type: string
 *                 example: 1990-01-01
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               address:
 *                 type: string
 *                 example: 123 Main St
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 responseCode:
 *                   type: string
 *                   example: S100000
 *                 responseMessage:
 *                   type: string
 *                   example: Login successful.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR...
 *       400:
 *         description: Email and password are required.
 *       401:
 *         description: Invalid credentials.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */


// routes/authRoutes.js
const jwt = require('jsonwebtoken');
const express = require('express');
const { getUserByEmail, createUser } = require('../models/userModel'); // Import your user model
const { v4: uuidv4 } = require('uuid'); // For generating unique user_id
const { RESPONSE_CODES, MESSAGES } = require('../utils/message'); // Import response codes and messages



const router = express.Router();     
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
                token
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
// POST /auth/register - User Registration
router.post('/auth/register', async (req, res) => {
    const { name, email, password, phone, documents, dob, gender, address } = req.body;

    // Validate input
    if (!name || !email || !password) {
        return res.status(400).json({ 
            responseCode: RESPONSE_CODES.BAD_REQUEST, 
            responseMessage: MESSAGES.NAME_EMAIL_PASSWORD_REQUIRED 
        });
    }

    try {
        // Check if the user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ 
                responseCode: RESPONSE_CODES.UNAUTHORIZED, 
                responseMessage: MESSAGES.EMAIL_ALREADY_EXISTS 
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
            responseMessage: MESSAGES.SUCCESS 
        });
    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ 
            responseCode: RESPONSE_CODES.SERVER_ERROR, 
            responseMessage: MESSAGES.SERVER_ERROR + error.message 
        });
    }
});


module.exports = router;
