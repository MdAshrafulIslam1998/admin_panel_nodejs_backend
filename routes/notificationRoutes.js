const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');  // Token authentication middleware
const { createNotification,getNotificationsList ,getNotificationsListByUser } = require('../models/notificationModel'); // Import the model function
const { SUCCESS, ERROR } = require('../middleware/handler');  // Response handlers
const { MESSAGES, RESPONSE_CODES } = require('../utils/message'); // Centralized messages and response codes

// POST /api/notifications - Create a new notification
router.post('/notifications/insert', authenticateToken, async (req, res) => {
  try {
    const { content, type, created_by, send_type, send_to, action, image_path, uid } = req.body;

    // Validate required fields
    if (!created_by || !send_type) {
      return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.MISSING_REQUIRED_FIELDS);
    }

    // Insert notification into the database
    const notificationId = await createNotification({
      content,
      type,
      created_by,
      send_type,
      send_to,
      action,
      image_path,
      uid
    });

    // Return success response with notification ID
    SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.NOTIFICATION_CREATED_SUCCESSFULLY, { notificationId });
    
  } catch (error) {
    // Handle errors
    ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
  }
});
//    const uid = req.user.uid;
// GET /api/notifications - Fetch paginated notifications with search
router.get('/notifications/admin', authenticateToken, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Get the current page number
      const limit = parseInt(req.query.limit) || 10; // Get the limit from query params
      const searchQuery = req.query.search || ''; // Get search term from query params
      const offset = (page - 1) * limit; // Calculate the offset for pagination
  
      // Fetch paginated notification data from the model
      const { notifications, totalProducts } = await getNotificationsList(offset, limit, searchQuery);
  
      const totalPages = Math.ceil(totalProducts / limit); // Calculate total pages
  
      if (!notifications || notifications.length === 0) {
        return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_NOTIFICATIONS_FOUND);
      }
  
      // Send success response with paginated notifications
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.NOTIFICATIONS_FETCH_SUCCESSFULLY, {
        notifications,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
      });
    } catch (error) {
      ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
  });

  // GET /api/notifications - Fetch paginated notifications with search, limit, and filtering by uid
router.get('/notifications/user', authenticateToken, async (req, res) => {
    try {
        const uid = req.user.uid; // Get current user uid
        const page = parseInt(req.query.page) || 1; // Get the current page number
        const limit = parseInt(req.query.limit) || 10; // Get the limit from query params
        const searchQuery = req.query.search || ''; // Get search term from query params
        const offset = (page - 1) * limit; // Calculate the offset for pagination
    
        // Fetch paginated notification data from the model filtered by uid
        const { notifications, totalProducts } = await getNotificationsList(uid, offset, limit, searchQuery);
    
        const totalPages = Math.ceil(totalProducts / limit); // Calculate total pages
    
        if (totalProducts === 0 || !notifications || notifications.length === 0) {
          // If no notifications found, return empty array with "No data found" message
          return SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.NO_DATA_FOUND, {
            notifications: [],
            currentPage: page,
            totalPages: 0,
            totalProducts: 0,
          });
        }
    
        // Send success response with paginated notifications
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.NOTIFICATIONS_FETCH_SUCCESSFULLY, {
          notifications,
          currentPage: page,
          totalPages: totalPages,
          totalProducts: totalProducts,
        });
      } catch (error) {
        // If something goes wrong, send server error
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
      }
  });
  
// POST /api/push_notification/topic
router.post('/push_notification/topic', authenticateToken, async (req, res) => {
    try {
      const { topic, title, body, dataPayload } = req.body;
  
      if (!topic || !title || !body || !dataPayload) {
        return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.MISSING_REQUIRED_FIELDS);
      }
  
      const message = {
        data: {
          title: title,
          body: body,
          ...dataPayload // Custom data
        },
        topic: topic // Send to the specific topic
      };
  
      // Send the notification
      const response = await admin.messaging().send(message);
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.NOTIFICATION_SENT_SUCCESSFULLY, { response });
    } catch (error) {
      ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
  });
  
 // POST /api/push_notification/user
router.post('/push_notification/user', authenticateToken, async (req, res) => {
    try {
      const { token, title, body, dataPayload } = req.body;
  
      if (!token || !title || !body || !dataPayload) {
        return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.MISSING_REQUIRED_FIELDS);
      }
  
      const message = {
        data: {
          title: title,
          body: body,
          ...dataPayload // Custom data
        },
        token: token // Send to the specific user's token
      };
  
      // Send the notification
      const response = await admin.messaging().send(message);
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.NOTIFICATION_SENT_SUCCESSFULLY, { response });
    } catch (error) {
      ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
  });
  
  
module.exports = router;
