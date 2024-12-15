

const express = require('express');
const router = express.Router();
const DocumentModel = require('../models/documentModel');
const authenticateToken = require('../middleware/authenticateToken');
const { SUCCESS, ERROR } = require('../middleware/handler');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');
const SliderModel = require('../models/sliderModel');
const MetaServiceModel = require('../models/metaServiceModel');



// File Server 
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

const logError = (error) => {
    const logPath = path.join(process.cwd(), 'log.txt');
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ERROR: ${error.message}\n${error.stack}\n\n`;

    // Append to log file
    fs.appendFile(logPath, logEntry, (err) => {
        if (err) {
            console.error('Failed to write to log file', err);
        }
    });
};


// Enhanced logging function
const logEvent = (type, message, additionalData = {}) => {
    const logPath = path.join(process.cwd(), 'log.txt');
    const timestamp = new Date().toISOString();

    // Prepare log entry with additional context
    const logEntry = JSON.stringify({
        timestamp,
        type,
        message,
        ...additionalData
    }) + '\n';

    // Append to log file
    fs.appendFile(logPath, logEntry, (err) => {
        if (err) {
            console.error('Failed to write to log file', err);
        }
    });
};

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.resolve(process.cwd(), 'files_server');

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
router.post('/sliders', authenticateToken, async (req, res) => {
    const { title, subtitle, created_by, send_type, send_to, action, from_date, to_date, slider_index, picture, bgColor } = req.body;

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
            picture,
            bgColor: bgColor || null,
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


// POST /meta-service/add - Add a new meta service entry
router.post('/meta-service/add', authenticateToken, async (req, res) => {
    const { featureCode, type, content } = req.body;

    // Validate required fields
    if (!featureCode || !type) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.MISSING_REQUIRED_FIELDS,
        });
    }

    try {
        const existingService = await MetaServiceModel.getMetaServiceByFeatureCode(featureCode);

        if (existingService) {
            return res.status(409).json({
                responseCode: RESPONSE_CODES.CONFLICT,
                responseMessage: MESSAGES.FEATURE_CODE_ALREADY_EXISTS,
            });
        }

        const newMetaService = await MetaServiceModel.addMetaService(featureCode, type, content);

        return res.status(201).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.META_SERVICE_ADDED,
            data: newMetaService,
        });
    } catch (error) {
        console.error('Error adding meta service:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
        });
    }
});



// GET /meta-service - Fetch all meta services (paginated)
router.get('/meta-service', authenticateToken, async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Convert query params to numbers and calculate offset
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    try {
        const { services, total } = await MetaServiceModel.getPaginatedMetaServices(parsedLimit, offset);

        const totalPages = Math.ceil(total / parsedLimit);

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.META_SERVICES_FETCHED,
            data: {
                services,
                pagination: {
                    total,
                    total_pages: totalPages,
                    current_page: parsedPage,
                    limit: parsedLimit,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching meta services:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
        });
    }
});



// DELETE /meta-service/:serviceId - Delete a meta service by service_id
router.delete('/meta-service/:serviceId', authenticateToken, async (req, res) => {
    const { serviceId } = req.params;

    // Validate serviceId
    if (!serviceId) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.MISSING_SERVICE_ID,
        });
    }

    try {
        const isDeleted = await MetaServiceModel.deleteMetaService(serviceId);

        if (!isDeleted) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.META_SERVICE_NOT_FOUND,
            });
        }

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.META_SERVICE_DELETED,
        });
    } catch (error) {
        console.error('Error deleting meta service:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
        });
    }
});


// Single file upload route (for backwards compatibility)
router.post('/upload-document', authenticateToken, (req, res) => {
    upload(req, res, async (err) => {
        if (err) {

            logEvent('UPLOAD_ERROR', 'Document upload failed', {
                errorMessage: err.message,
                requestBody: req.body
            });


            return res.status(400).json({
                status: false,
                message: err.message,
                data: null
            });
        }

        // Log the entire request body and files for debugging
        console.log('Request Body:', req.body);
        console.log('Request Files:', req.files);
        console.log('Current Working Directory:', process.cwd());
        console.log('Upload Path:', path.resolve(process.cwd(), 'files_server'));

        // Check if files are uploaded using the 'documents' key
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'No document uploaded',
                data: null
            });
        }

        const file = req.files[0];
        logEvent('UPLOAD_SUCCESS', 'Document uploaded successfully', {
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            Current_Working_Directory: process.cwd(),
            Upload_Path: path.resolve(process.cwd(), 'files_server'),
            docType: req.body.doc_type || 'default'
        });

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

// You can also add global error logging
process.on('uncaughtException', (error) => {
    logError(error);
    // Optionally, you might want to exit the process
    // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError(new Error(`Unhandled Rejection at: ${promise}, reason: ${reason}`));
});


// POST /sliders/delete - Delete a slider
router.post('/sliders/delete', authenticateToken, async (req, res) => {
    const { id } = req.body;

    // Validate input
    if (!id) {
        return res.status(400).json({
            responseCode: RESPONSE_CODES.BAD_REQUEST,
            responseMessage: MESSAGES.SLIDER_ID_REQUIRED,
        });
    }

    try {
        const wasDeleted = await SliderModel.deleteSliderById(id);

        if (!wasDeleted) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.SLIDER_NOT_FOUND,
            });
        }

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.SLIDER_DELETED_SUCCESS,
        });
    } catch (error) {
        console.error('Error deleting slider:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR + error.message,
        });
    }
});






module.exports = router;
