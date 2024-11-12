

const express = require('express');
const router = express.Router();
const DocumentModel = require('../models/documentModel');
const authenticateToken = require('../middleware/authenticateToken');
const { SUCCESS, ERROR } = require('../middleware/handler');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');

// POST /api/documents - Add a new document for a user
router.post('/documents', authenticateToken, async (req, res) => {
    try {
        const { doc_type, uid, path } = req.body;

        // Validate the input
        if (!doc_type || !uid || !path) {
            return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.DOCUMENT_INVALID_INPUT);
        }

        // Create a new document entry
        const documentId = await DocumentModel.createDocument({ doc_type, uid, path });

        // Prepare the response data
        const documentData = {
            id: documentId,
            doc_type,
            uid,
            path
        };

        // Respond with success
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.DOCUMENT_ADDED_SUCCESSFULLY, documentData);
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.DOCUMENT_ADD_FAILED, error.message);
    }
});



// POST /api/sliders - Add a new slider
router.post('/sliders', async (req, res) => {
    const { title, subtitle, created_by, send_type, send_to, action, from_date, to_date, slider_index, picture } = req.body;

    // Validate input
    if (!title || !created_by || !send_type) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.INVALID_INPUT_PROVIDED
        });
    }

    try {
        // Prepare slider data
        const sliderData = {
            title,
            subtitle,
            created_by,
            send_type,
            send_to: send_to || null,
            action,
            from_date: from_date || null,
            to_date: to_date || null,
            slider_index: slider_index || null,
            picture
        };

        // Create new slider
        const newSliderId = await SliderModel.createSlider(sliderData);

        return res.status(201).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.SUCCESS,
            data: { id: newSliderId }
        });
    } catch (error) {
        console.error('Error adding slider:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message
        });
    }
});

// GET /api/sliders - Fetch paginated list of sliders
router.get('/sliders', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Fetch sliders from the SliderModel
        const sliders = await SliderModel.getSliders(parseInt(limit), parseInt(offset));
        const total = await SliderModel.getSlidersCount(); // Implement this function to get total count

        if (sliders.length === 0) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.SLIDERS_NOT_FOUND,
                data: null,
                pagination: {
                    total: 0,
                    total_pages: 0,
                    current_page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        }

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.SLIDERS_FETCHED,
            data: {
                sliders: sliders,
                pagination: {
                    total: total,
                    total_pages: totalPages,
                    current_page: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching sliders:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
            data: null
        });
    }
});



// GET /api/sliders/all - Fetch paginated list of sliders where send_type is ALL
router.get('/sliders/all', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Fetch sliders where send_type is 'ALL'
        const sliders = await SliderModel.getAllSlidersWithTypeAll(parseInt(limit), parseInt(offset));
        const total = await SliderModel.getAllSlidersWithTypeAllCount();

        if (sliders.length === 0) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.SLIDERS_NOT_FOUND,
                data: null,
                pagination: {
                    total: 0,
                    total_pages: 0,
                    current_page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        }

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.SLIDERS_FETCHED,
            data: {
                sliders: sliders,
                pagination: {
                    total: total,
                    total_pages: totalPages,
                    current_page: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching sliders:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
            data: null
        });
    }
});


// GET /api/sliders/user/:uid - Fetch paginated list of sliders for a specific user by uid
router.get('/sliders/user/:uid', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { uid } = req.params;
    const offset = (page - 1) * limit;

    try {
        // Fetch sliders for the specific user
        const sliders = await SliderModel.getSlidersForUser(uid, parseInt(limit), parseInt(offset));
        const total = await SliderModel.getSlidersForUserCount(uid);

        if (sliders.length === 0) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.SLIDERS_NOT_FOUND,
                data: null,
                pagination: {
                    total: 0,
                    total_pages: 0,
                    current_page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        }

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.SLIDERS_FETCHED,
            data: {
                sliders: sliders,
                pagination: {
                    total: total,
                    total_pages: totalPages,
                    current_page: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching sliders for user:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
            data: null
        });
    }
});


module.exports = router;
