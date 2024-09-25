const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel'); // Assuming you have this model
const message = require('../utils/message');
const authenticateToken = require('../middleware/authenticateToken'); // Ensure this import is correct

// Endpoint to fetch user list with pagination
router.get('/coins', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to 10 if not provided
        const offset = (page - 1) * limit; // Calculate offset

        const users = await userModel.getUserList(offset, limit); // Fetch users with pagination
        const totalUsers = await userModel.getTotalUserCount(); // Ensure this method exists in your userModel

        // Prepare the response
        res.status(200).json({
            statusCode: "S10000", // Use a standard success code
            message: message.MESSAGES.USER_LIST_FETCH_SUCCESSFULLY,
            data: {
                users,
                total: totalUsers,
                page,
                limit
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            statusCode: "E10005", // General error code
            message: message.MESSAGES.ERROR + error.message,
            data: null
        });
    }
});

// Other routes...

module.exports = router;
