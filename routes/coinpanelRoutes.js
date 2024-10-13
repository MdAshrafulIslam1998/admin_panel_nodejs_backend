const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const message = require('../utils/message');
const authenticateToken = require('../middleware/authenticateToken');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');
const { getTransactionHistory, getTransactionCount, getTransactionHistoryByCategory, getTransactionCountByCategory } = require('../models/coinModel');
const { SUCCESS, ERROR } = require('../middleware/handler');
const TransactionHistoryModel = require('../models/transactionHistoryModel');
const CategoryModel = require('../models/categoryModel');



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
                level_id: user.level_id,
                status: user.status,
                date: user.date,
                categories: categorizedCoins
            });
        }

        // Send paginated response
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCHED, {
            total: totalUsers,
            page: page,
            limit: limit,
            users: userTransactionData
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
        // Step 1: Get the paginated list of users who have some coins in the specified category
        const usersWithCoins = await TransactionHistoryModel.getUsersWithCategoryCoins(category, +limit, +offset);

        // Step 2: Get total count of users with coins in the category
        const totalUsers = await TransactionHistoryModel.getTotalUsersWithCategoryCoins(category);

        // Step 3: Send the paginated response
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCHED, {
            total: totalUsers,
            page: +page,
            limit: +limit,
            category_id: category,
            data: usersWithCoins,
        });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TRANSACTION_HISTORY_FAILED, error.message);
    }
});


// GET /api/coin/transactions - Fetch paginated transaction history
router.get('/alltransactions', authenticateToken, async (req, res, next) => {
    try {
      const { page = 1 } = req.query;  // Defaults to page 1 if not provided
      const limit = 10;
      const offset = (page - 1) * limit;
  
      // Fetch the paginated transaction history and total count
      const [transactions, total] = await Promise.all([
        getTransactionHistory(limit, offset),
        getTransactionCount()
      ]);
  
      if (transactions.length === 0) {
        return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_TRANSACTIONS_FOUND);
      }
  
      const totalPages = Math.ceil(total / limit);  // Calculate total pages
  
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCH_SUCCESS, {
        total,          // Total number of transactions
        page: parseInt(page), // Current page
        limit,          // Number of records per page
        totalPages,     // Total pages available
        transactions    // Actual transaction records
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
  
      const totalPages = Math.ceil(total / limit);
  
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCH_SUCCESS, {
        total,          // Total number of transactions for this category
        page: parseInt(page), // Current page
        limit,          // Number of records per page
        totalPages,     // Total pages available
        transactions    // Actual transaction records
      });
    } catch (error) {
      next(error);  // Pass error to centralized error handler
    }
  });



  // API to fetch all transaction lists for a specific user with pagination
router.get('/users/:user_id/transactions', authenticateToken, async (req, res) => {
    const user_id = req.params.user_id;
    const limit = parseInt(req.query.limit) || 20;  // Default limit is 20
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        // Fetch paginated transactions for the given user_id
        const transactions = await TransactionHistoryModel.getPaginatedTransactionsByUserId(user_id, limit, offset);
        const totalTransactions = await TransactionHistoryModel.getTotalTransactionsByUserId(user_id);
        const totalPages = Math.ceil(totalTransactions / limit);

        // Check if the user has any transactions
        if (transactions.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_TRANSACTIONS_FOUND);
        }

        // Prepare paginated response
        const userTransactionData = {
            user_id: user_id,
            transactions: transactions.map(transaction => ({
                id: transaction.id,
                category: {
                    id: transaction.cat_id,
                    name: transaction.category_name,  // Use category_name here
                    image: transaction.image,
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

        // Send the response with paginated transactions
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCHED, userTransactionData);
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TRANSACTION_HISTORY_FAILED, error.message);
    }
});




// API to fetch user's transactions history by category with pagination
router.get('/users/:user_id/transactions-by-category', authenticateToken, async (req, res) => {
    const user_id = req.params.user_id;
    const cat_id = req.query.cat_id;  // Category ID input from query params
    const limit = parseInt(req.query.limit) || 20;  // Default limit is 20
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        // Fetch paginated transactions for the given user_id and category
        const transactions = await TransactionHistoryModel.getPaginatedTransactionsByUserIdAndCategory(user_id, cat_id, limit, offset);
        const totalTransactions = await TransactionHistoryModel.getTotalTransactionsByUserIdAndCategory(user_id, cat_id);
        const totalPages = Math.ceil(totalTransactions / limit);

        // Check if the user has any transactions in the category
        if (transactions.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_TRANSACTIONS_FOUND);
        }

        // Prepare paginated response
        const userTransactionData = {
            user_id: user_id,
            category_id: cat_id,
            transactions: transactions.map(transaction => ({
                id: transaction.id,
                category: {
                    id: transaction.cat_id,
                    name: transaction.category_name,
                    image: transaction.image,
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

        // Send the response with paginated transactions
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCHED, userTransactionData);
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TRANSACTION_HISTORY_FAILED, error.message);
    }
});



  

// API to add a category
router.post('/categories/add', async (req, res) => {
    const { name, image, created_by } = req.body;

    if (!name || !created_by) {
        return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.CATEGORY_ADD_VALIDATION_ERROR);
    }

    try {
        const result = await CategoryModel.addCategory(name, image, created_by);
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.CATEGORY_ADDED_SUCCESS, { id: result.insertId });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.CATEGORY_ADD_FAILED, error.message);
    }
});

// API to update category
router.put('/categories/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, image, created_by } = req.body;

    try {
        const result = await CategoryModel.updateCategory(id, name, image, created_by);
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

// GET /api/categories - Fetch paginated categories
router.get('/categories', authenticateToken, async (req, res) => {
    const limit = 15;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        const categories = await CategoryModel.getPaginatedCategories(limit, offset);
        const totalCategories = await CategoryModel.getTotalCategories();

          // Modify response to have pagination data in a separate object
          SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.CATEGORY_LIST_FETCHED, {
            categories,  // List of categories
            pagination: {
                total: totalCategories,           // Total categories available
                total_pages: Math.ceil(totalCategories / limit),  // Total number of pages
                current_page: page,               // Current page
                limit: limit                      // Limit per page
            }
        });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.CATEGORY_LIST_FAILED, error.message);
    }
});

module.exports = router;
