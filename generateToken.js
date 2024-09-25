// generateToken.js
require('dotenv').config(); // Load environment variables from .env file
const jwt = require('jsonwebtoken');

// User data to encode in the token
const user = { id: 'b7746c19-7a61-11ef-8211-80fa5b888c9a' }; // Use a valid user ID

// Secret key for signing the token from .env
const secretKey = process.env.JWT_SECRET; // Accessing the secret from environment variables

// Check if the secret key is defined
if (!secretKey) {
    console.error('Error: JWT_SECRET is not defined in .env');
    process.exit(1); // Exit if the key is not defined
}

// Generate the token with an expiration of 24 hours
const token = jwt.sign(user, secretKey, { expiresIn: '24h' });

console.log('Generated JWT Token:', token);
