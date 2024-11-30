

const express = require('express');
const router = express.Router();
const DocumentModel = require('../models/documentModel');
const authenticateToken = require('../middleware/authenticateToken');
const { SUCCESS, ERROR } = require('../middleware/handler');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');
const SliderModel = require('../models/sliderModel');
const MetaServiceModel = require('../models/metaServiceModel');


// File Server 


const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

// MySQL Connection Pool (you'll need to replace with your actual DB config)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'files_server');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with UUID and original extension
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    // Allow only image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
    }
};

// Configure multer upload
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1 * 1024 * 1024 // 1MB file size limit
    }
}).array('documents', 5); // Allow up to 5 files per upload





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

// GET /api/sliders/userwithall/:uid - Fetch paginated list of sliders for a specific user + sliders for 'ALL'
router.get('/sliders/userwithall/:uid', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { uid } = req.params;
    const offset = (page - 1) * limit;

    try {
        // Fetch sliders for the specific user
        const userSliders = await SliderModel.getSlidersForUser(uid, parseInt(limit), parseInt(offset));
        // Fetch sliders where send_type is 'ALL'
        const allSliders = await SliderModel.getAllSlidersWithTypeAll(parseInt(limit), parseInt(offset));

        // Merge both sets of sliders (user-specific and 'ALL' sliders)
        const combinedSliders = [...userSliders, ...allSliders];

        // Calculate the total count for the combined sliders
        const totalUserSliders = await SliderModel.getSlidersForUserCount(uid);
        const totalAllSliders = await SliderModel.getAllSlidersWithTypeAllCount();
        const total = totalUserSliders + totalAllSliders;

        // Pagination details
        const totalPages = Math.ceil(total / limit);

        if (combinedSliders.length === 0) {
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

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.SLIDERS_FETCHED,
            data: {
                sliders: combinedSliders,
                pagination: {
                    total: total,
                    total_pages: totalPages,
                    current_page: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching sliders for user and ALL:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
            data: null
        });
    }
});




router.get('/meta-service/:feature_code', async (req, res) => {
    const { feature_code } = req.params;

    try {
        const featureData = await MetaServiceModel.getFeatureByCode(feature_code);

        if (!featureData) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
        }

        // Return data as-is
        res.json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: "Meta service data fetched successfully",
            data: featureData
        });
    } catch (error) {
        console.error(error);
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
});


// Single file upload route (for backwards compatibility)
router.post('/upload-document', authenticateToken, (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                status: false,
                message: err.message,
                data: null
            });
        }

        // Log the entire request body and files for debugging
        console.log('Request Body:', req.body);
        console.log('Request Files:', req.files);

        // Check if files are uploaded using the 'documents' key
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'No document uploaded',
                data: null
            });
        }

        const file = req.files[0];
        
        // Get doc_type from request body, default to 'default'
        const docType = req.body.doc_type || 'default';
        
        // Use path.basename to get just the filename, not the full path
        const filename = path.basename(file.filename);
        
        // Construct the URL path (adjust the base URL as needed)
        const fileUrl = `/files_server/${filename}`;

        res.json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: 'Document uploaded successfully',
            data: {
                url: fileUrl,
                doc_type: docType,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            }
        });
    });
});




module.exports = router;
