
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
const db = require('../config/db.config');

router.get('/alltransactions/userwise/:staff_id', authenticateToken, async (req, res, next) => {
    try {
        const { staff_id } = req.params; // Get staff_id from the route params
        const { page = 1, limit = 10 } = req.query; // Fetch pagination parameters
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        // Define role-based access to fields
        const roleFieldAccess = {
            1: ["id", "cat_id", "uid", "coin", "date", "name", "email", "created_by", "coin_type", "category_name"], // Admin
            3: ["id", "cat_id", "uid", "coin", "date", "name", "created_by", "coin_type", "category_name"],          // Subadmin
            4: ["id", "cat_id", "uid", "coin", "date", "name", "created_by", "coin_type", "category_name"],         // Moderator
        };

        // Fetch the staff's role from the database
        const [staffRows] = await db.execute(
            "SELECT role FROM staffs WHERE staff_id = ?",
            [staff_id]
        );
        const staff = staffRows[0];

        if (!staff) {
            return res.status(404).json({
                responseCode: "S100001",
                responseMessage: "Staff not found",
            });
        }

        const role = parseInt(staff.role, 10);
        const allowedFields = roleFieldAccess[role];

        if (!allowedFields) {
            return res.status(403).json({
                responseCode: "S100002",
                responseMessage: "Role not authorized to access data",
            });
        }

        // Fetch users and transactions data
        const [users, totalUsers] = await Promise.all([
            userModel.getUserList(offset, parsedLimit),
            userModel.getTotalUserCount(),
        ]);

        if (users.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_USERS_FOUND);
        }

        // Prepare transactions data based on the new requirements
        const transactions = await Promise.all(users.map(async (user) => {
            // Fetch transactions categorized by category for each user
            const transactionsData = await TransactionHistoryModel.getTransactionsCategorizedWithCategoryName(user.user_id);

            // Combine the coin data into the required string format
            const coin = transactionsData.map(transaction => {
                const { category_name, PRIMARY, SECONDARY } = transaction;
                return `${category_name} : \nprimary ${PRIMARY || 0}\nsecondary ${SECONDARY || 0}`;
            }).join("\n\n");




            const transaction = {
                id: 0, // Hardcoded
                cat_id: 0, // Hardcoded
                uid: user.user_id,
                coin, // Formatted string
                date: new Date().toISOString(), // Current date
                name: user.name,
                email: user.email,
                created_by: "Globipay", // Hardcoded
                coin_type: "primary & secondary", // Hardcoded
                category_name: "all", // Hardcoded
            };

            // Filter transaction fields based on role access
            const filteredTransaction = {};
            allowedFields.forEach(field => {
                if (transaction[field] !== undefined) {
                    filteredTransaction[field] = transaction[field];
                }
            });

            return filteredTransaction;
        }));

        // Calculate total pages for pagination
        const totalPages = Math.ceil(totalUsers / parsedLimit);

        // Return the restructured response
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.USERWISE_TRANSACTION_HISTORY_FETCHED, {
            transactions,
            pagination: {
                total: totalUsers,
                total_pages: totalPages,
                current_page: parsedPage,
                limit: parsedLimit,
            },
        });
    } catch (error) {
        console.error(`Error fetching userwise transactions: ${error.message}`);
        next(error); // Pass error to centralized error handler
    }
});




// GET /alltransactions/categorywise
router.get('/alltransactions/categorywise/:staff_id', authenticateToken, async (req, res, next) => {
    try {
        const { staff_id } = req.params;
        const { page = 1, limit = 10, category } = req.query;
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        if (!category) {
            return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.INVALID_INPUT_PROVIDED, { error: "Category ID is required." });
        }

        const roleFieldAccess = {
            1: ["id", "cat_id", "uid", "coin", "date", "name", "email", "created_by", "coin_type", "category_name"], // Admin
            3: ["id", "cat_id", "uid", "coin", "date", "name", "created_by", "coin_type", "category_name"],          // Subadmin
            4: ["id", "cat_id", "uid", "coin", "date", "name", "created_by", "coin_type", "category_name"],         // Moderator
        };

        const [staffRows] = await db.execute("SELECT role FROM staffs WHERE staff_id = ?", [staff_id]);
        const staff = staffRows[0];

        if (!staff) {
            return res.status(404).json({
                responseCode: "S100001",
                responseMessage: "Staff not found",
            });
        }

        const role = parseInt(staff.role, 10);
        const allowedFields = roleFieldAccess[role];

        if (!allowedFields) {
            return res.status(403).json({
                responseCode: "S100002",
                responseMessage: "Role not authorized to access data",
            });
        }

        const usersWithCoins = await TransactionHistoryModel.getUsersWithCategoryCoins(category, parsedLimit, offset);
        const categoryName = await TransactionHistoryModel.getCategoryNameById(category);
        const totalUsers = await TransactionHistoryModel.getTotalUsersWithCategoryCoins(category);

        const formattedUsers = usersWithCoins.map(user => {
            const userObject = {
                id: 0,
                cat_id: category,
                uid: user.user_id,
                coin: `primary_total: ${user.primary_total || 0}\nsecondary_total: ${user.secondary_total || 0}`,
                date: user.date || new Date().toISOString(),
                name: user.name,
                email: user.email, // Ensure email is included
                created_by: "Globipay",
                coin_type: "primary and secondary",
                category_name: categoryName || "Unknown",
            };

            return Object.fromEntries(
                Object.entries(userObject).filter(([key]) => allowedFields.includes(key))
            );
        });

        const pagination = {
            total: totalUsers,
            total_pages: Math.ceil(totalUsers / parsedLimit),
            current_page: parsedPage,
            limit: parsedLimit,
        };

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCHED, {
            transactions: formattedUsers,
            pagination,
        });
    } catch (error) {
        console.error(`Error fetching category-wise transactions: ${error.message}`);
        next(error);
    }
});




router.get('/alltransactions/:staff_id', authenticateToken, async (req, res, next) => {
    try {
        const { staff_id } = req.params; // Get staff_id from route parameter
        const { page = 1, limit = 10 } = req.query; // Fetch `page` and `limit` from query params
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        // Define role-based access to fields
        const roleFieldAccess = {
            1: ["id", "cat_id", "uid", "coin", "date", "name", "email", "created_by", "coin_type", "category_name"], // Admin
            3: ["id", "cat_id", "uid", "coin", "date", "name", "created_by", "coin_type", "category_name"],          // Subadmin
            4: ["id", "cat_id", "uid", "coin", "date", "name", "created_by", "coin_type", "category_name"],         // Moderator
        };

        // Fetch the staff role from the database
        const [staffRows] = await db.execute(
            "SELECT role FROM staffs WHERE staff_id = ?",
            [staff_id]
        );
        const staff = staffRows[0];

        if (!staff) {
            return res.status(404).json({
                responseCode: "S100001",
                responseMessage: "Staff not found",
            });
        }

        const role = parseInt(staff.role, 10);
        const allowedFields = roleFieldAccess[role];

        if (!allowedFields) {
            return res.status(403).json({
                responseCode: "S100002",
                responseMessage: "Role not authorized to access data",
            });
        }

        // Fetch transactions and total count
        const [transactions, total] = await Promise.all([
            TransactionHistoryModel.getPaginatedTransactions(parsedLimit, offset),
            TransactionHistoryModel.getTotalTransactions(),
        ]);

        if (transactions.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_TRANSACTIONS_FOUND);
        }

        // Filter transactions based on allowed fields
        const filteredTransactions = transactions.map(transaction => {
            const filteredTransaction = {};
            allowedFields.forEach(field => {
                if (transaction[field] !== undefined) {
                    filteredTransaction[field] = transaction[field];
                }
            });
            return filteredTransaction;
        });

        const total_pages = Math.ceil(total / parsedLimit);

        // Return the response with filtered transactions and pagination info
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCH_SUCCESS, {
            transactions: filteredTransactions,
            pagination: {
                total,
                total_pages,
                current_page: parsedPage,
                limit: parsedLimit,
            },
        });
    } catch (error) {
        console.error(`Error fetching transactions: ${error.message}`);
        next(error); // Pass error to centralized error handler
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