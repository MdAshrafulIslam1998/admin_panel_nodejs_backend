
const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const message = require('../utils/message');
const authenticateToken = require('../middleware/authenticateToken');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');
const { getTransactionHistory, getTransactionCount, getTransactionHistoryByCategory, getTransactionCountByCategory, addTransactionHistory } = require('../models/coinModel');
const { SUCCESS, ERROR } = require('../middleware/handler');
const TransactionHistoryModel = require('../models/transactionHistoryModel');
const CategoryModel = require('../models/categoryModel');
const swaggerJSDoc = require('swagger-jsdoc');


// API to fetch users and their categorized transactions
router.get('/users/userwise/transactions', authenticateToken, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        // Fetch paginated users from the user table
        const users = await userModel.getUserList(offset, limit);
        const totalUsers = await userModel.getTotalUserCount();

        // Prepare an array to store the user details along with their transaction data
        let userTransactionData = [];

        for (const user of users) {
            // Fetch categorized transactions for each user
            const transactions = await TransactionHistoryModel.getTransactionsCategorizedByCategory(user.user_id);

            // Structure to hold the categorized coin totals
            let categorizedCoins = {};

            transactions.forEach((transaction) => {
                const { cat_id, coin_type, total_coins } = transaction;

                // Initialize category data if it doesn't exist
                if (!categorizedCoins[cat_id]) {
                    categorizedCoins[cat_id] = { PRIMARY: 0, SECONDARY: 0 };
                }

                // Add coins to the corresponding coin_type (PRIMARY/SECONDARY)
                categorizedCoins[cat_id][coin_type] = total_coins;
            });

            // Prepare user data structure for the response
            userTransactionData.push({
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                status: user.status,
                categories: categorizedCoins
            });
        }

        // Prepare pagination information
        const pagination = {
            total: totalUsers,
            total_pages: Math.ceil(totalUsers / limit),
            current_page: page,
            limit: limit
        };

        // Send paginated response without nesting the user data under an additional 'data' object
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCHED, {
            users: userTransactionData, // Directly place users here
            pagination: pagination
        });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TRANSACTION_HISTORY_FAILED, error.message);
    }
});




// GET /users/paginated-transactions-history-by-category
router.get('/users/paginated-transactions-history-by-category', async (req, res) => {
    const { page = 1, limit = 10, category } = req.query; // Take the category ID as input
    const offset = (page - 1) * limit;

    try {
        // Validate the category parameter
        if (!category) {
            return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.INVALID_INPUT_PROVIDED, { error: "Category ID is required." });
        }

        // Step 1: Get the paginated list of users who have some coins in the specified category
        const usersWithCoins = await TransactionHistoryModel.getUsersWithCategoryCoins(category, +limit, +offset);

        // Step 2: Get total count of users with coins in the category
        const totalUsers = await TransactionHistoryModel.getTotalUsersWithCategoryCoins(category);

        // Prepare pagination information
        const pagination = {
            total: totalUsers,
            total_pages: Math.ceil(totalUsers / limit),
            current_page: +page,
            limit: +limit
        };

        // Step 4: Send the response with the users list and pagination at the bottom
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCHED, {
            category_id: category,
            users: usersWithCoins,
            pagination // Put pagination at the bottom of the response data
        });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TRANSACTION_HISTORY_FAILED, error.message);
    }
});

router.get('/alltransactions', authenticateToken, async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query; // Fetch `page` and `limit` from query params, with defaults
        const parsedLimit = parseInt(limit);       // Parse limit as an integer
        const parsedPage = parseInt(page);         // Parse page as an integer
        const offset = (parsedPage - 1) * parsedLimit;

        // Fetch the paginated transaction history with category name and total count
        const [transactions, total] = await Promise.all([
            TransactionHistoryModel.getPaginatedTransactions(parsedLimit, offset),
            TransactionHistoryModel.getTotalTransactions()
        ]);

        if (transactions.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_TRANSACTIONS_FOUND);
        }

        const total_pages = Math.ceil(total / parsedLimit);  // Calculate total pages

        // Return the response with transactions and pagination info
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCH_SUCCESS, {
            transactions,  // Transactions with category names
            pagination: {  // Pagination info at the bottom
                total,              // Total number of transactions
                total_pages,        // Total pages available
                current_page: parsedPage,  // Current page
                limit: parsedLimit        // Number of records per page
            }
        });
    } catch (error) {
        next(error);  // Pass error to centralized error handler
    }
});



// GET /api/coin/transactions/category - Fetch paginated transaction history by category
router.get('/alltransactions/category', authenticateToken, async (req, res, next) => {
    try {
        const { cat_id, page = 1 } = req.query;  // Defaults to page 1 if not provided
        const limit = 10;
        const offset = (page - 1) * limit;

        if (!cat_id) {
            return ERROR(res, RESPONSE_CODES.VALIDATION_ERROR, MESSAGES.INVALID_CATEGORY_ID);
        }

        // Fetch the paginated transaction history and total count by category
        const [transactions, total] = await Promise.all([
            getTransactionHistoryByCategory(cat_id, limit, offset),
            getTransactionCountByCategory(cat_id)
        ]);

        if (transactions.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_TRANSACTIONS_FOUND);
        }

        const total_Pages = Math.ceil(total / limit);

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCH_SUCCESS, {
            transactions,
            pagination: {
                total,              // Total number of transactions for this category
                total_Pages,        // Total pages available
                current_page: parseInt(page),  // Current page
                limit               // Number of records per page
            }

            // Actual transaction records
        });
    } catch (error) {
        next(error);  // Pass error to centralized error handler
    }
});


router.get('/users/:user_id/transactions', authenticateToken, async (req, res) => {
    const user_id = req.params.user_id;
    const cat_id = req.query.cat_id;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        let transactions;
        let totalTransactions;

        if (cat_id) {
            transactions = await TransactionHistoryModel.getPaginatedTransactionsByUserIdAndCategory(user_id, cat_id, limit, offset);
            totalTransactions = await TransactionHistoryModel.getTotalTransactionsByUserIdAndCategory(user_id, cat_id);
        } else {
            transactions = await TransactionHistoryModel.getPaginatedTransactionsByUserId(user_id, limit, offset);
            totalTransactions = await TransactionHistoryModel.getTotalTransactionsByUserId(user_id);
        }

        const totalPages = Math.ceil(totalTransactions / limit);

        if (transactions.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_TRANSACTIONS_FOUND);
        }

        const userTransactionData = {
            user_id: user_id,
            transactions: transactions.map(transaction => ({
                id: transaction.id,
                category: {
                    id: transaction.cat_id,
                    name: transaction.category_name,
                    image: transaction.image,
                    bgcolor: transaction.bgcolor, // Add bgcolor here
                },
                coin: transaction.coin,
                date: transaction.date,
                name: transaction.name,
                email: transaction.email,
                created_by: transaction.created_by,
                coin_type: transaction.coin_type,
            })),
            pagination: {
                total: totalTransactions,
                total_pages: totalPages,
                current_page: page,
                limit: limit
            }
        };

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCHED, userTransactionData);
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TRANSACTION_HISTORY_FAILED, error.message);
    }
});






// API to add a category
router.post('/categories/add', async (req, res) => {
    const { name, image, created_by, bgcolor } = req.body;

    // Validate required fields
    if (!name || !created_by) {
        return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.CATEGORY_ADD_VALIDATION_ERROR);
    }

    try {
        const result = await CategoryModel.addCategory(name, image, created_by, bgcolor || null);
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.CATEGORY_ADDED_SUCCESS, { id: result.insertId });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.CATEGORY_ADD_FAILED, error.message);
    }
});


// API to update category
router.put('/categories/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, image, created_by, bgcolor } = req.body;

    try {
        const result = await CategoryModel.updateCategory(id, name, image, created_by, bgcolor);
        if (result.affectedRows > 0) {
            SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.CATEGORY_UPDATE_SUCCESS);
        } else {
            ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.CATEGORY_UPDATE_NOT_FOUND);
        }
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.CATEGORY_UPDATE_FAILED, error.message);
    }
});


// DELETE /api/categories/:id - Delete a category
router.delete('/categories/:id', authenticateToken, async (req, res) => {
    const categoryId = req.params.id;

    try {
        const hasTransactions = await TransactionHistoryModel.checkTransactionHistoryByCategoryId(categoryId);
        if (hasTransactions) {
            return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.CATEGORY_DELETE_ASSOCIATED);
        }

        const result = await CategoryModel.deleteCategory(categoryId);
        if (result.affectedRows === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.CATEGORY_DELETE_NOT_FOUND);
        }

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.CATEGORY_DELETED_SUCCESS);
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.CATEGORY_DELETE_FAILED, error.message);
    }
});


router.get('/categories', authenticateToken, async (req, res) => {
    const limit = 15;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        const categories = await CategoryModel.getPaginatedCategories(limit, offset);
        const totalCategories = await CategoryModel.getTotalCategories();

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.CATEGORY_LIST_FETCHED, {
            categories, // Now includes bgcolor
            pagination: {
                total: totalCategories,
                total_pages: Math.ceil(totalCategories / limit),
                current_page: page,
                limit: limit
            }
        });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.CATEGORY_LIST_FAILED, error.message);
    }
});


router.get('/amountdetailsweb', async (req, res, next) => {
    try {
        // Extract pagination params
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Fetch paginated verified users
        const [users, total] = await Promise.all([
            TransactionHistoryModel.getPaginatedVerifiedUsers(parseInt(limit), parseInt(offset)),
            TransactionHistoryModel.getTotalVerifiedUsersCount()
        ]);

        if (users.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_USERS_FOUND);
        }

        // Extract user IDs
        const userIds = users.map(user => user.user_id);

        // Fetch transaction details for these users
        const transactions = await TransactionHistoryModel.getTransactionDetailsForUsers(userIds);

        // Fetch all categories
        const categories = await TransactionHistoryModel.getAllCategories();
        const categoryMap = Object.fromEntries(categories.map(cat => [cat.id, cat.name])); // Map cat_id to name

        // Shape the data: Add transactions to their respective users
        const userMap = users.map(user => {
            const userTransactions = transactions.filter(t => t.user_id === user.user_id);
            const amount = {};

            // Organize transactions by category name and coin type
            userTransactions.forEach(t => {
                const categoryName = categoryMap[t.cat_id] || `Unknown (${t.cat_id})`;
                if (!amount[categoryName]) {
                    amount[categoryName] = { PRIMARY: 0, SECONDARY: 0 };
                }
                amount[categoryName][t.coin_type] = t.total_coin;
            });

            return {
                ...user,
                amount
            };
        });

        // Calculate pagination details
        const totalPages = Math.ceil(total / limit);

        // Return the response
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCH_SUCCESS, {
            users: userMap,
            pagination: {
                total,
                total_pages: totalPages,
                current_page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
});


router.post('/transaction/add', authenticateToken, async (req, res) => {
    const { catId, uid, primary_coin, secondary_coin, createdBy } = req.body;

    // Validate input
    if (!catId || !uid || primary_coin == null || secondary_coin == null || !createdBy) {
        return res.status(400).json({
            responseCode: "BAD404",
            responseMessage: MESSAGES.VALIDATION_ERROR
        });
    }

    try {
        const result = await addTransactionHistory(catId, uid, primary_coin, secondary_coin, createdBy);
        return res.status(200).json({
            responseCode: "S100000",
            responseMessage: MESSAGES.TRANSACTION_ADDED_SUCCESS,
            data: result
        });
    } catch (error) {
        console.error('Error adding transaction:', error.message);
        return res.status(500).json({
            responseCode: "E500000",
            responseMessage: "Internal server error: " + error.message
        });
    }
});


module.exports = router;