// routes/authRoutes.js
const jwt = require('jsonwebtoken');
const { getUserByEmail } = require('../models/userModel'); // Make sure this is correct
const secretKey = process.env.JWT_SECRET; // Secret for JWT

router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Check if email and password were provided
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Fetch user by email
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the password matches (note: no hashing in this case)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if the user's status is INITIATED or VERIFIED
        if (user.status !== 'INITIATED' && user.status !== 'VERIFIED') {
            return res.status(403).json({ message: 'User not eligible to log in' });
        }

        // Create token payload
        const tokenPayload = {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            level: user.level,
            status: user.status
        };

        // Sign the token
        const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '1h' });

        // Respond with the JWT token
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
