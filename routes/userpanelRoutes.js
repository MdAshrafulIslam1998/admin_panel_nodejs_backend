const express = require('express');
const router = express.Router();  // Initialize router
const authenticateToken = require('../middleware/authenticateToken');  // Assuming this is already created
const { getUserList } = require('../models/userModel');  // Import the getUserList function
const { SUCCESS, ERROR } = require('../middleware/handler');  // Response handlers// Centralized messages
const DocumentModel = require('../models/documentModel');  // Import the DocumentModel
const { getUserById } = require('../models/userModel');
const { createLevel } = require('../models/levelModel'); 
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');
const LevelModel = require('../models/levelModel');
const { updateUserLevel } = require('../models/userModel'); // Assuming this function is correctly implemented
const { updateUserStatus } = require('../models/userModel'); // Assuming this function is correctly implemented


// GET /api/users - Fetch paginated user list
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Fetch paginated user data
    const users = await getUserList(offset, limit);

    if (!users || users.length === 0) {
      return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_USERS_FOUND);
    }

    // Send success response with paginated users
    SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.USER_LIST_FETCH_SUCCESSFULLY, { users, page });
  } catch (error) {
    ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
  }
});




// GET /api/users/profile/:userId - Fetch user profile information
router.get('/users/profile/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Fetch user details
        const user = await getUserById(userId);
        if (!user) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
        }

        // Fetch user's documents
        const documents = await DocumentModel.getDocumentsByUserId(userId);

        // Prepare the response data
        const responseData = {
            username: user.name, // Assuming 'name' is the field for username
            email: user.email,
            phone: user.phone, // Make sure this field exists in your user table
            dob: user.dob, // Make sure this field exists in your user table
            gender: user.gender, // Make sure this field exists in your user table
            address: user.address, // Make sure this field exists in your user table
            level: user.level,
            status: user.status,
            selfie_path: documents.find(doc => doc.doc_type === 'SELFIE')?.path || null,
            front_id_path: documents.find(doc => doc.doc_type === 'FRONT ID')?.path || null,
            back_id_path: documents.find(doc => doc.doc_type === 'BACK ID')?.path || null
        };

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.PROFILE_FETCH_SUCCESS, responseData);
    } catch (error) {
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
});


// POST /api/levels/addlevel - Add a new level
router.post('/levels/addlevel', authenticateToken, async (req, res) => {
    try {
      const { level_name, level_value, created_by } = req.body;
  
      // Check if all required fields are provided
      if (!level_name || level_value === undefined || !created_by) {
        return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.MISSING_REQUIRED_FIELDS);
      }
  
      // Create the new level
      const levelId = await createLevel({ level_name, level_value, created_by });
  
      // Send success response
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.LEVEL_ADDED_SUCCESSFULLY, { level_name, level_value, created_by });
    } catch (error) {
      ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
  });


// PUT endpoint to update user level
router.put('/users/editlevel/:userid', authenticateToken, async (req, res) => {
  const userId = req.params.userid; // Extracting userId from request parameters
    const { level } = req.body; // Assuming 'level' is being sent in the body

    try {
        // Call the model function to update the user's level
        const updated = await updateUserLevel(userId, level);
        
        if (updated) {
            return SUCCESS(res, "User level updated successfully", updated);
        } else {
            return ERROR(res, "Failed to update user level", 400);
        }
    } catch (error) {
        return ERROR(res, error.message, 500);
    }
});



// POST /api/users/changestatus/:userId
router.post('/users/changestatus/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  // Validate the incoming status
  const validStatuses = ['VERIFIED', 'PENDING', 'REJECTED', 'BLOCKED', 'DELETED'];
  if (!validStatuses.includes(status)) {
    return ERROR(res, RESPONSE_CODES.BAD_REQUEST, "Invalid status value provided.");
  }

  try {
    // Update the user's status in the database
    const result = await updateUserStatus(userId, status);

    if (result.affectedRows === 0) {
      return ERROR(res, RESPONSE_CODES.NOT_FOUND, "User not found or status not changed.");
    }

    // Send success response
    SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.STATUS_UPDATE_SUCCESS);
  } catch (error) {
    ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
  }
});


// GET /api/levels - Fetch all level data
router.get('/levels', authenticateToken, async (req, res) => {
  try {
      // Fetch all level data
      const levels = await LevelModel.getAllLevels();

      if (!levels || levels.length === 0) {
          return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_LEVELS_FOUND);
      }

      // Send success response with levels
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.LEVELS_FETCH_SUCCESSFULLY, { levels });
  } catch (error) {
      ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
  }
});







  

// Export the router (this should already exist in your file)
module.exports = router;
