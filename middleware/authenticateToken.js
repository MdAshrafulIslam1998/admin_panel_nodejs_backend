const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

// Secret key for verifying the token from .env file
const secretKey = process.env.JWT_SECRET; // Use the secret from .env

const authenticateToken = (req, res, next) => {
    // Get the token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1];
    console.log('Received token:', token);

    // If there is no token, respond with 401 Unauthorized
    if (!token) return res.status(401).json({ statusCode: "E10004", message: "Invalid token", data: null });

    // Verify the token
    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(403).json({ statusCode: "E10004", message: "Invalid token", data: null });
        }
        // Save user information in request for use in other routes
        req.user = user;
        next(); // Call the next middleware or route handler
    });
};

module.exports = authenticateToken;
