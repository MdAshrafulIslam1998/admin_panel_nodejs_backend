/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Fetch paginated user list
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Successfully fetched user list
 *       404:
 *         description: No users found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   get:
 *     summary: Fetch user profile information
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Successfully fetched user profile
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/levels/addlevel:
 *   post:
 *     summary: Add a new level
 *     tags: [Levels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level_name:
 *                 type: string
 *               level_value:
 *                 type: integer
 *               created_by:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully added a new level
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/editlevel/{userid}:
 *   put:
 *     summary: Update user level
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User level updated successfully
 *       404:
 *         description: User level update failed
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/changestatus/{userId}:
 *   post:
 *     summary: Change user status
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VERIFIED, PENDING, REJECTED, BLOCKED, DELETED]
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/levels:
 *   get:
 *     summary: Fetch all level data
 *     tags: [Levels]
 *     responses:
 *       200:
 *         description: Successfully fetched level data
 *       404:
 *         description: No levels found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/levels/{levid}:
 *   delete:
 *     summary: Delete a level by levid
 *     tags: [Levels]
 *     parameters:
 *       - in: path
 *         name: levid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the level
 *     responses:
 *       200:
 *         description: Successfully deleted the level
 *       404:
 *         description: Level not found
 *       400:
 *         description: Level has associated users
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/levels/edit/{levid}:
 *   put:
 *     summary: Edit level and update associated users
 *     tags: [Levels]
 *     parameters:
 *       - in: path
 *         name: levid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the level
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level_name:
 *                 type: string
 *               level_value:
 *                 type: integer
 *               created_by:
 *                 type: string
 *     responses:
 *       200:
 *         description: Level updated successfully
 *       404:
 *         description: Level not found
 *       500:
 *         description: Server error
 */




const express = require('express');
const router = express.Router();  
const authenticateToken = require('../middleware/authenticateToken'); 
const { getUserList, getUserById, updateUserLevel, updateUserStatus, getTotalUserCount, fetchUserProfileById } = require('../models/userModel');
const { createLevel, getAllLevels, getLevelById, deleteLevelById, updateLevel } = require('../models/levelModel');
const DocumentModel = require('../models/documentModel');
const UserModel = require('../models/userModel');
const { SUCCESS, ERROR } = require('../middleware/handler');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');

// GET /api/users - Fetch paginated user list
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Fetch total user count
        const totalUsers = await getTotalUserCount();
        const totalPages = Math.ceil(totalUsers / limit);

        // Fetch paginated users
        const users = await getUserList(offset, limit);
        if (!users || users.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_USERS_FOUND);
        }

        // Prepare response data
        const responseData = {
            users,
            pagination: {
                total: totalUsers,
                total_pages: totalPages,
                current_page: page,
                limit: limit
            }
        };

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.USER_LIST_FETCH_SUCCESSFULLY, responseData);
    } catch (error) {
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
});


// GET /api/users/profile/:userId - Fetch user profile information
router.get('/users/profile/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await getUserById(userId);
        if (!user) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
        }

        const documents = await DocumentModel.getDocumentsByUserId(userId);
        const responseData = {
            username: user.name,
            email: user.email,
            phone: user.phone,
            dob: user.dob,
            gender: user.gender,
            address: user.address,
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

        if (!level_name || level_value === undefined || !created_by) {
            return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.MISSING_REQUIRED_FIELDS);
        }

        const levelId = await createLevel({ level_name, level_value, created_by });
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.LEVEL_ADDED_SUCCESSFULLY, { level_name, level_value, created_by });
    } catch (error) {
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
});

// PUT /api/users/editlevel/:userid - Update user level
router.put('/users/editlevel/:userid', authenticateToken, async (req, res) => {
    const userId = req.params.userid;
    const { level } = req.body;

    try {
        const updated = await updateUserLevel(userId, level);

        if (updated) {
            SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.USER_LEVEL_UPDATED_SUCCESSFULLY);
        } else {
            ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.USER_LEVEL_UPDATE_FAILED);
        }
    } catch (error) {
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
});

// POST /api/users/changestatus/:userId - Change user status
router.post('/users/changestatus/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
    const validStatuses = ['VERIFIED', 'PENDING', 'REJECTED', 'BLOCKED', 'DELETED'];

    if (!validStatuses.includes(status)) {
        return ERROR(res, RESPONSE_CODES.BAD_REQUEST, MESSAGES.INVALID_STATUS);
    }

    try {
        const result = await updateUserStatus(userId, status);

        if (result.affectedRows === 0) {
            ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
        } else {
            SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.STATUS_UPDATE_SUCCESS);
        }
    } catch (error) {
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
});

// GET /api/levels - Fetch all level data
router.get('/levels', authenticateToken, async (req, res) => {
    try {
        const levels = await getAllLevels();

        if (!levels || levels.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_LEVELS_FOUND);
        }

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.LEVELS_FETCH_SUCCESSFULLY, { levels });
    } catch (error) {
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
});

// DELETE /api/levels/:levid - Delete a level by levid
router.delete('/levels/:levid', authenticateToken, async (req, res) => {
    const { levid } = req.params;

    try {
        const level = await getLevelById(levid);
        if (!level) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.LEVEL_NOT_FOUND);
        }

        const usersWithLevel = await UserModel.getUsersByLevelId(levid);
        if (usersWithLevel.length > 0) {
            return ERROR(res, RESPONSE_CODES.LEVEL_HAS_ASSOCIATED_USERS, MESSAGES.LEVEL_HAS_ASSOCIATED_USERS);
        }

        await deleteLevelById(levid);
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.LEVEL_DELETED_SUCCESSFULLY, { levid });
    } catch (error) {
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
});

// PUT /api/levels/edit/:levid - Edit level and update associated users
router.put('/levels/edit/:levid', authenticateToken, async (req, res) => {
    const { levid } = req.params;
    const { level_name, level_value, created_by } = req.body;

    try {
        const levelUpdated = await updateLevel(levid, { level_name, level_value, created_by });

        if (!levelUpdated) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.LEVEL_NOT_FOUND);
        }

        const usersUpdated = await UserModel.updateUsersLevelByLevid(levid);
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.LEVEL_UPDATED_SUCCESSFULLY, { level_name, level_value, usersUpdated });
    } catch (error) {
        ERROR(res, RESPONSE_CODES.SERVER_ERROR, MESSAGES.SERVER_ERROR, error.message);
    }
});


// GET /api/user/profile/:userId - Fetch user profile details
router.get('/user/apphome_profile/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const userProfileData = await fetchUserProfileById(userId);
        if (!userProfileData) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.USER_NOT_FOUND
            });
        }

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.USER_PROFILE_FETCH_SUCCESS,
            data: userProfileData
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR
        });
    }
});





module.exports = router;
