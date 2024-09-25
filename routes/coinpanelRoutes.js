// routes/coinpanelRoutes.js
const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const coinModel = require('../models/coinModel');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message'); // Adjusted import

// API to fetch users with their coin data
router.get('/users/coins', async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0; // Default to 0 if not provided
        const limit = parseInt(req.query.limit) || 10;  // Default to 10 if not provided

        // Fetch users
        const users = await userModel.getUserList(offset, limit);
        
        if (!users.length) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.NO_USERS_FOUND,
                data: []
            });
        }

        // Fetch coins for each user
        const userWithCoins = await Promise.all(users.map(async (user) => {
            const coinData = await coinModel.getCoinsByUserId(user.user_id);
            return {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                level: user.level_name, // Assuming you want level_name from the join
                status: user.status,
                coins: coinData
            };
        }));

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.USER_COIN_LIST_FETCHED,
            data: userWithCoins
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR,
            data: {}
        });
    }
});

module.exports = router;
