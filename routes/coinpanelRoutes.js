const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const message = require('../utils/message');
const authenticateToken = require('../middleware/authenticateToken');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');
const { updateCoinValue } = require('../models/coinModel');
const { SUCCESS, ERROR } = require('../middleware/handler');
const TransactionHistoryModel = require('../models/transactionHistoryModel');
const CategoryModel = require('../models/categoryModel');

// Endpoint to fetch user list with pagination
router.get('/coins', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const users = await userModel.getUserList(offset, limit);
        const totalUsers = await userModel.getTotalUserCount();

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.USER_LIST_FETCHED, {
            users,
            total: totalUsers,
            page,
            limit
        });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.USER_LIST_FETCH_FAILED, error.message);
    }
});

// Endpoint for editing coin amount
router.put('/coins/edit', authenticateToken, async (req, res) => {
    const { userId, coinType, newCoinValue } = req.body;

    if (!userId || !coinType || newCoinValue === undefined) {
        return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.COIN_UPDATE_VALIDATION_ERROR);
    }

    try {
        const updated = await updateCoinValue(userId, coinType, newCoinValue);
        if (updated) {
            SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.COIN_UPDATE_SUCCESS, { userId, coinType, newCoinValue });
        } else {
            ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.COIN_UPDATE_NO_RECORDS);
        }
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.COIN_UPDATE_FAILED, error.message);
    }
});

// GET /api/transactions - Fetch all transaction history user-wise
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await TransactionHistoryModel.getAllUserWiseTransactions();
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_FETCHED, transactions);
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TRANSACTION_HISTORY_FAILED, error.message);
    }
});

// New API to fetch transaction history categorized by category ID
router.get('/transactions/category', async (req, res) => {
    try {
        const transactions = await TransactionHistoryModel.getTransactionsCategorizedByCategory();
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_CATEGORIZED_FETCHED, transactions);
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TRANSACTION_HISTORY_CATEGORIZED_FAILED, error.message);
    }
});

// New API to fetch paginated transaction history
router.get('/transactions/paginated', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    try {
        const transactions = await TransactionHistoryModel.getPaginatedTransactions(limit, offset);
        const totalTransactions = await TransactionHistoryModel.getTotalTransactions();

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.TRANSACTION_HISTORY_PAGINATED_FETCHED, {
            currentPage: page,
            totalPages: Math.ceil(totalTransactions / limit),
            totalTransactions,
            transactions
        });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.TRANSACTION_HISTORY_PAGINATED_FAILED, error.message);
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

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.CATEGORY_LIST_FETCHED, {
            categories,
            total: totalCategories,
            currentPage: page,
            totalPages: Math.ceil(totalCategories / limit)
        });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.CATEGORY_LIST_FAILED, error.message);
    }
});

module.exports = router;
