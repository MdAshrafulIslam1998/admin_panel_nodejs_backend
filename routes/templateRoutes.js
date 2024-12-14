// routes/templateRoutes.js
const express = require('express');
const TemplateModel = require('../models/templateModel');
const { RESPONSE_CODES, MESSAGES } = require('../utils/message');
const { auth } = require('firebase-admin');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

// 1. Fetch all message templates
router.get('/templates',authenticateToken, async (req, res) => {
    try {
        const templates = await TemplateModel.getAllTemplates();

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.TEMPLATES_FETCHED,
            data: { templates },
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
        });
    }
});


// 2. Add a new message template
router.post('/templates/add', authenticateToken, async (req, res) => {
    const { title, description, categoryId, createdBy } = req.body;

    if (!title || !categoryId || !createdBy) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.MISSING_FIELDS,
        });
    }

    try {
        const template = await TemplateModel.addTemplate(title, description, categoryId, createdBy);
        return res.status(201).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.TEMPLATE_ADDED,
            data: template,
        });
    } catch (error) {
        console.error('Error adding template:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
        });
    }
});

// 3. Fetch templates by category
router.get('/templates/category/:categoryId',authenticateToken, async (req, res) => {
    const { categoryId } = req.params;

    try {
        const templates = await TemplateModel.getTemplatesByCategoryId(categoryId);

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.TEMPLATES_BY_CATEGORY_FETCHED,
            data: { templates },
        });
    } catch (error) {
        console.error('Error fetching templates by category:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
        });
    }
});


// 4. Edit a message template
// Update the PUT /templates/:uid route in templateRoutes.js
router.put('/templates/:uid', authenticateToken, async (req, res) => {
    const { uid } = req.params;
    const { title, description, categoryId } = req.body;

    if (!title || !description || !categoryId) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.MISSING_FIELDS,
        });
    }

    try {
        const isUpdated = await TemplateModel.updateTemplateByUid(uid, title, description, categoryId);

        if (!isUpdated) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.TEMPLATE_NOT_FOUND,
            });
        }

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.TEMPLATE_UPDATED,
        });
    } catch (error) {
        console.error('Error updating template:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
        });
    }
});

// 5. Delete a message template
router.delete('/templates/:uid',authenticateToken, async (req, res) => {
    const { uid } = req.params;

    try {
        const isDeleted = await TemplateModel.deleteTemplateByUid(uid);

        if (!isDeleted) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.TEMPLATE_NOT_FOUND,
            });
        }

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.TEMPLATE_DELETED,
        });
    } catch (error) {
        console.error('Error deleting template:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
        });
    }
});

module.exports = router;
