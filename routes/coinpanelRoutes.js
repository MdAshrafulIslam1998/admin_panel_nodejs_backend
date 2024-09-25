const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel'); // Assuming you have this model
const message = require('../utils/message');
const authenticateToken = require('../middleware/authenticateToken'); // Ensure this import is correct
const { MESSAGES, RESPONSE_CODES } = require('../utils/message'); // Ensure this import is present
const { updateCoinValue } = require('../models/coinModel'); // Make sure this path is correct
const { SUCCESS, ERROR } = require('../middleware/handler'); // Ensure this line is present
const TransactionHistoryModel = require('../models/transactionHistoryModel'); // Adjust the path if necessary
const CategoryModel = require('../models/categoryModel');

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


// Endpoint for editing coin amount
router.put('/coins/edit', authenticateToken, async (req, res) => {
    const { userId, coinType, newCoinValue } = req.body;
  
    // Input validation
    if (!userId || !coinType || newCoinValue === undefined) {
      return res.status(400).json({ 
        responseCode: RESPONSE_CODES.BAD_REQUEST, 
        responseMessage: MESSAGES.VALIDATION_ERROR, 
        data: null 
      });
    }
  
    try {
      // Update coin value
      const updated = await updateCoinValue(userId, coinType, newCoinValue);
      if (updated) {
        return res.status(200).json({ 
          responseCode: RESPONSE_CODES.SUCCESS, 
          responseMessage: MESSAGES.OPERATION_SUCCESS, 
          data: { userId, coinType, newCoinValue } 
        });
      } else {
        return res.status(404).json({ 
          responseCode: RESPONSE_CODES.NOT_FOUND, 
          responseMessage: MESSAGES.ERROR + 'No matching records found to update.', 
          data: null 
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ 
        responseCode: RESPONSE_CODES.SERVER_ERROR, 
        responseMessage: MESSAGES.SERVER_ERROR, 
        data: null 
      });
    }
  });


// GET /api/transactions - Fetch all transaction history user-wise
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await TransactionHistoryModel.getAllUserWiseTransactions();
        
        SUCCESS(res, RESPONSE_CODES.SUCCESS, 'Transaction history fetched successfully', transactions);
    } catch (error) {
        console.error('Error fetching transaction history:', error); // Log the error for debugging
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, 'Failed to fetch transaction history', error);
    }
});


// New API to fetch transaction history categorized by category ID
router.get('/transactions/category', async (req, res) => {
    try {
        const transactions = await TransactionHistoryModel.getTransactionsCategorizedByCategory();
        SUCCESS(res, RESPONSE_CODES.SUCCESS, "Fetched categorized transaction history", transactions);
    } catch (error) {
        console.error("Error fetching categorized transaction history:", error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, "Failed to fetch categorized transaction history", error);
    }
});


// New API to fetch paginated transaction history
router.get('/transactions/paginated', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 15; // Number of records per page
    const offset = (page - 1) * limit; // Calculate offset

    try {
        const transactions = await TransactionHistoryModel.getPaginatedTransactions(limit, offset);
        const totalTransactions = await TransactionHistoryModel.getTotalTransactions();
        
        SUCCESS(res, RESPONSE_CODES.SUCCESS, "Fetched paginated transaction history", {
            currentPage: page,
            totalPages: Math.ceil(totalTransactions / limit),
            totalTransactions,
            transactions
        });
    } catch (error) {
        console.error("Error fetching paginated transaction history:", error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, "Failed to fetch paginated transaction history", error);
    }
});


// API to add a category
router.post('/categories/add', async (req, res) => {
    const { name, image, created_by } = req.body;

    if (!name || !created_by) {
        return ERROR(res, RESPONSE_CODES.BAD_REQUEST, "Name and created_by are required");
    }

    try {
        const result = await CategoriesModel.addCategory(name, image, created_by);
        return SUCCESS(res, RESPONSE_CODES.SUCCESS, "Category added successfully", { id: result.insertId });
    } catch (error) {
        console.error("Error adding category:", error);
        return ERROR(res, RESPONSE_CODES.SERVER_ERROR, "Failed to add category", error);
    }
});


// API to update category
router.put('/categories/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, image, created_by } = req.body; // Make sure to include created_by

    try {
        const result = await CategoriesModel.updateCategory(id, name, image, created_by);
        if (result.affectedRows > 0) {
            SUCCESS(res, RESPONSE_CODES.SUCCESS, "Category updated successfully");
        } else {
            ERROR(res, RESPONSE_CODES.NOT_FOUND, "Category not found");
        }
    } catch (error) {
        console.error("Error updating category:", error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, "Failed to update category", error);
    }
});



// DELETE /api/categories/:id - Delete a category
router.delete('/categories/:id', authenticateToken, async (req, res) => {
    const categoryId = req.params.id;

    try {
        // Check if there are associated transactions
        const hasTransactions = await TransactionHistoryModel.checkTransactionHistoryByCategoryId(categoryId);

        if (hasTransactions) {
            return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.USER_LIST_FETCH_SUCCESSFULLY, 'Associated category cannot be deleted');
        }

        // Proceed to delete the category
        const result = await CategoryModel.deleteCategory(categoryId);

        if (result.affectedRows === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.USER_LIST_FETCH_SUCCESSFULLY, 'Category not found');
        }

        SUCCESS(res, RESPONSE_CODES.SUCCESS, 'Category deleted successfully');
    } catch (error) {
        console.error(error); // Log error for debugging
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, 'Failed to delete category', error);
    }
});



// GET /api/categories - Fetch paginated categories
router.get('/categories', authenticateToken, async (req, res) => {
    const limit = 15; // Number of categories per page
    const page = parseInt(req.query.page) || 1; // Get page from query parameter, default to 1
    const offset = (page - 1) * limit;

    try {
        const categories = await CategoryModel.getPaginatedCategories(limit, offset);
        const totalCategories = await CategoryModel.getTotalCategories();

        // Prepare response data
        const responseData = {
            categories,
            total: totalCategories,
            currentPage: page,
            totalPages: Math.ceil(totalCategories / limit)
        };

        SUCCESS(res, RESPONSE_CODES.SUCCESS, 'Categories fetched successfully', responseData);
    } catch (error) {
        console.error(error); // Log error for debugging
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, 'Failed to fetch categories', error);
    }
});



module.exports = router;
