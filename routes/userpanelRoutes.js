const express = require("express");
const router = express.Router();
const db = require('../config/db.config');
const authenticateToken = require("../middleware/authenticateToken");
const {
    getUserList,
    getUserById,
    updateUserLevel,
    updateUserStatus,
    getTotalUserCount,
    getVerifiedUsersWithCoins,
    getTotalVerifiedUserCount,
    getPendingUsers,
    getBlockedUsers,
    getTotalBlockedUserCount,
    getTotalPendingUserCount,
    fetchUserProfileById,
    updateUserStatusPending,
    updateUserDetails,
    updateUserColumns
} = require("../models/userModel");
const {
    createLevel,
    getAllLevels,
    getLevelById,
    deleteLevelById,
    updateLevel,
    getUserLevelWithXP
} = require("../models/levelModel");
const DocumentModel = require("../models/documentModel");
const UserModel = require("../models/userModel");
const { SUCCESS, ERROR } = require("../middleware/handler");
const { MESSAGES, RESPONSE_CODES } = require("../utils/message");
const LevelModel = require("../models/levelModel");

// GET /api/users - Fetch paginated user list
router.get("/users", authenticateToken, async (req, res) => {
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
                limit: limit,
            },
        };

        SUCCESS(
            res,
            RESPONSE_CODES.SUCCESS,
            MESSAGES.USER_LIST_FETCH_SUCCESSFULLY,
            responseData
        );
    } catch (error) {
        ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});

// GET /api/users/profile/:userId - Fetch user profile information
router.get("/users/profile/:userId", authenticateToken, async (req, res) => {
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
            selfie_path:
                documents.find((doc) => doc.doc_type === "SELFIE")?.path || null,
            front_id_path:
                documents.find((doc) => doc.doc_type === "FRONT ID")?.path || null,
            back_id_path:
                documents.find((doc) => doc.doc_type === "BACK ID")?.path || null,
        };

        SUCCESS(
            res,
            RESPONSE_CODES.SUCCESS,
            MESSAGES.PROFILE_FETCH_SUCCESS,
            responseData
        );
    } catch (error) {
        ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});


// POST /api/levels/addlevel - Add a new level
router.post("/levels/addlevel", authenticateToken, async (req, res) => {
    try {
        const { level_name, level_value, min_thresh, max_thresh, created_by } = req.body;

        // Validate that all required fields are provided
        if (
            !level_name ||
            level_value === undefined ||
            min_thresh === undefined ||
            max_thresh === undefined ||
            !created_by
        ) {
            return ERROR(
                res,
                RESPONSE_CODES.BAD_REQUEST,
                MESSAGES.MISSING_REQUIRED_FIELDS
            );
        }

        // Call the model to create the level
        const levelId = await createLevel({
            level_name,
            level_value,
            min_thresh,
            max_thresh,
            created_by,
        });

        // Return success response
        SUCCESS(
            res,
            RESPONSE_CODES.SUCCESS,
            MESSAGES.LEVEL_ADDED_SUCCESSFULLY,
            {
                level_name,
                level_value,
                min_thresh,
                max_thresh,
                created_by,
            }
        );
    } catch (error) {
        ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});


// PUT /api/users/editlevel/:userid - Update user level
router.put("/users/editlevel/:userid", authenticateToken, async (req, res) => {
    const userId = req.params.userid;
    const { level } = req.body;

    try {
        const updated = await updateUserLevel(userId, level);

        if (updated) {
            SUCCESS(
                res,
                RESPONSE_CODES.SUCCESS,
                MESSAGES.USER_LEVEL_UPDATED_SUCCESSFULLY
            );
        } else {
            ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.USER_LEVEL_UPDATE_FAILED);
        }
    } catch (error) {
        ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});

// POST /api/users/changestatus/:userId - Change user status
router.post(
    "/users/changestatus/:userId",
    authenticateToken,
    async (req, res) => {
        const { userId } = req.params;
        const { status } = req.body;
        const validStatuses = [
            "VERIFIED",
            "PENDING",
            "REJECTED",
            "BLOCKED",
            "DELETED",
        ];

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
            ERROR(
                res,
                RESPONSE_CODES.SERVER_ERROR,
                MESSAGES.SERVER_ERROR,
                error.message
            );
        }
    }
);

// GET /api/levels - Fetch all level data
router.get("/levels", authenticateToken, async (req, res) => {
    try {
        const levels = await getAllLevels();

        if (!levels || levels.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.NO_LEVELS_FOUND);
        }

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.LEVELS_FETCH_SUCCESSFULLY, {
            levels, // Includes levid now
        });
    } catch (error) {
        ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});


// DELETE /api/levels/:levid - Delete a level by levid
router.delete("/levels/:levid", authenticateToken, async (req, res) => {
    const { levid } = req.params;

    try {
        const level = await getLevelById(levid);
        if (!level) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.LEVEL_NOT_FOUND);
        }

        const usersWithLevel = await UserModel.getUsersByLevelId(levid);
        if (usersWithLevel.length > 0) {
            return ERROR(
                res,
                RESPONSE_CODES.LEVEL_HAS_ASSOCIATED_USERS,
                MESSAGES.LEVEL_HAS_ASSOCIATED_USERS
            );
        }

        await deleteLevelById(levid);
        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.LEVEL_DELETED_SUCCESSFULLY, {
            levid,
        });
    } catch (error) {
        ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});

// PUT /api/levels/edit/:levid - Edit level and update associated users
router.put("/levels/edit/:levid", authenticateToken, async (req, res) => {
    const { levid } = req.params;
    const { level_name, level_value, min_thresh, max_thresh, created_by } = req.body;

    try {
        // Update the level with new fields
        const levelUpdated = await updateLevel(levid, {
            level_name,
            level_value,
            min_thresh,
            max_thresh,
            created_by,
        });

        if (!levelUpdated) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.LEVEL_NOT_FOUND);
        }

        // Update users associated with the level
        const usersUsedThisLevel = await UserModel.updateUsersLevelByLevid(levid);

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.LEVEL_UPDATED_SUCCESSFULLY, {
            level_name,
            level_value,
            min_thresh,
            max_thresh,
            usersUsedThisLevel: usersUsedThisLevel,
        });
    } catch (error) {
        ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});



router.get("/levels/user/:userId", authenticateToken, async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch the user's level with XP calculation
        const level = await LevelModel.getUserLevelWithXP(userId);

        if (!level) {
            return ERROR(
                res,
                RESPONSE_CODES.NOT_FOUND,
                MESSAGES.NO_LEVELS_FOUND_FOR_USER
            );
        }

        // Send the level and XP in the desired response structure
        res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.LEVELS_FETCHED_SUCCESSFULLY,
            data: level
        });
    } catch (error) {
        res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR,
            error: error.message
        });
    }
});





router.get("/user/apphome_profile/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const userProfileData = await fetchUserProfileById(userId);
        if (!userProfileData) {
            return res.status(404).json({
                responseCode: RESPONSE_CODES.NOT_FOUND,
                responseMessage: MESSAGES.USER_NOT_FOUND,
            });
        }

        return res.status(200).json({
            responseCode: RESPONSE_CODES.SUCCESS,
            responseMessage: MESSAGES.USER_PROFILE_FETCH_SUCCESS,
            data: userProfileData,
        });
    } catch (error) {
        console.error("Error fetching user profile:", error); // Logs full error details to the server console

        // Return the raw error message in the response for debugging (use only in development)
        return res.status(500).json({
            responseCode: RESPONSE_CODES.SERVER_ERROR,
            responseMessage: MESSAGES.SERVER_ERROR,
            error: error.message, // Include the raw error message
            stack: error.stack,  // Optionally include the stack trace
        });
    }
});




router.get("/user/verifiedusersweb/:staff_id", authenticateToken, async (req, res) => {
    const { staff_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const roleFieldAccess = {
        1: ["user_id", "name", "email", "level_id", "phone", "level_name", "status", "date", "primary", "secondary"], // admin 
        3: ["user_id", "name", "level_id", "level_name", "status", "date", "primary", "secondary"], //subadmin 
        4: ["user_id", "name", "level_id", "level_name", "status", "date", "primary", "secondary"], //moderator 
    };

    try {
        // Fetch staff role
        const [rows] = await db.execute(
            "SELECT role FROM staffs WHERE staff_id = ?",
            [staff_id]
        );
        const staff = rows[0];

        if (!staff) {
            console.log(`Staff not found for staff_id: ${staff_id}`);
            return res.status(404).json({
                responseCode: "S100001",
                responseMessage: "Staff not found",
            });
        }

        const role = parseInt(staff.role, 10);
        console.log(`Retrieved role for staff_id ${staff_id}: ${role}`);

        const allowedFields = roleFieldAccess[role];
        if (!allowedFields) {
            console.log(`Unauthorized access attempt by role: ${role}`);
            return res.status(403).json({
                responseCode: "S100002",
                responseMessage: "Role not authorized to access data",
            });
        }

        // Fetch total count of verified users for pagination
        const totalVerifiedUsers = await getTotalVerifiedUserCount();
        const totalPages = Math.ceil(totalVerifiedUsers / limit);

        // Fetch users
        const users = await getVerifiedUsersWithCoins(offset, limit);

        // Filter fields based on role access
        const filteredUsers = users.map(user => {
            const filteredUser = {};
            allowedFields.forEach(field => {
                if (user[field] !== undefined) {
                    filteredUser[field] = user[field];
                }
            });
            return filteredUser;
        });

        const responseData = {
            users: filteredUsers,
            pagination: {
                total: totalVerifiedUsers,
                total_pages: totalPages,
                current_page: page,
                limit: limit,
            },
        };

        return SUCCESS(
            res,
            RESPONSE_CODES.SUCCESS,
            MESSAGES.USER_LIST_FETCH_SUCCESSFULLY,
            responseData
        );
    } catch (error) {
        console.error(`Error occurred: ${error.message}`);
        return ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});





// GET /api/user/pendingusersweb - Fetch paginated pending user list
router.get("/user/pendingusersweb/:staff_id", authenticateToken, async (req, res) => {
    const { staff_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const roleFieldAccess = {
        1: ["user_id", "name", "email", "status", "date"], // Admin
        3: ["user_id", "name", "status", "date"], // Subadmin
        4: ["user_id", "name", "status", "date"], // Moderator
    };

    try {
        // Fetch staff role
        const [rows] = await db.execute(
            "SELECT role FROM staffs WHERE staff_id = ?",
            [staff_id]
        );
        const staff = rows[0];

        if (!staff) {
            console.log(`Staff not found for staff_id: ${staff_id}`);
            return res.status(404).json({
                responseCode: "S100001",
                responseMessage: "Staff not found",
            });
        }

        const role = parseInt(staff.role, 10);
        console.log(`Retrieved role for staff_id ${staff_id}: ${role}`);

        const allowedFields = roleFieldAccess[role];
        if (!allowedFields) {
            console.log(`Unauthorized access attempt by role: ${role}`);
            return res.status(403).json({
                responseCode: "S100002",
                responseMessage: "Role not authorized to access data",
            });
        }

        // Fetch total count of pending users for pagination
        const totalPendingUsers = await getTotalPendingUserCount();
        const totalPages = Math.ceil(totalPendingUsers / limit);

        // Fetch paginated pending users
        const users = await getPendingUsers(offset, limit);

        if (!users || users.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
        }

        // Filter fields based on role access
        const filteredUsers = users.map(user => {
            const filteredUser = {};
            allowedFields.forEach(field => {
                if (user[field] !== undefined) {
                    filteredUser[field] = user[field];
                }
            });
            return filteredUser;
        });

        // Prepare response data
        const responseData = {
            users: filteredUsers,
            pagination: {
                total: totalPendingUsers,
                total_pages: totalPages,
                current_page: page,
                limit: limit,
            },
        };

        return SUCCESS(
            res,
            RESPONSE_CODES.SUCCESS,
            MESSAGES.USER_LIST_FETCH_SUCCESSFULLY,
            responseData
        );
    } catch (error) {
        console.error(`Error occurred: ${error.message}`);
        return ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});

// GET /api/user/blockedusersweb/:staff_id - Fetch paginated blocked user list
router.get("/user/blockedusersweb/:staff_id", authenticateToken, async (req, res) => {
    const { staff_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const roleFieldAccess = {
        1: ["user_id", "name", "email", "status", "date"], // Admin
        3: ["user_id", "name", "status", "date"], // Subadmin
        4: ["user_id", "name", "status", "date"], // Moderator
    };

    try {
        // Fetch staff role
        const [rows] = await db.execute(
            "SELECT role FROM staffs WHERE staff_id = ?",
            [staff_id]
        );
        const staff = rows[0];

        if (!staff) {
            console.log(`Staff not found for staff_id: ${staff_id}`);
            return res.status(404).json({
                responseCode: "S100001",
                responseMessage: "Staff not found",
            });
        }

        const role = parseInt(staff.role, 10);
        console.log(`Retrieved role for staff_id ${staff_id}: ${role}`);

        const allowedFields = roleFieldAccess[role];
        if (!allowedFields) {
            console.log(`Unauthorized access attempt by role: ${role}`);
            return res.status(403).json({
                responseCode: "S100002",
                responseMessage: "Role not authorized to access data",
            });
        }

        // Fetch total count of blocked users for pagination
        const totalBlockedUsers = await getTotalBlockedUserCount();
        const totalPages = Math.ceil(totalBlockedUsers / limit);

        // Fetch paginated blocked users
        const users = await getBlockedUsers(offset, limit);

        if (!users || users.length === 0) {
            return ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
        }

        // Filter fields based on role access
        const filteredUsers = users.map(user => {
            const filteredUser = {};
            allowedFields.forEach(field => {
                if (user[field] !== undefined) {
                    filteredUser[field] = user[field];
                }
            });
            return filteredUser;
        });

        // Prepare response data
        const responseData = {
            users: filteredUsers,
            pagination: {
                total: totalBlockedUsers,
                total_pages: totalPages,
                current_page: page,
                limit: limit,
            },
        };

        return SUCCESS(
            res,
            RESPONSE_CODES.SUCCESS,
            MESSAGES.USER_LIST_FETCH_SUCCESSFULLY,
            responseData
        );
    } catch (error) {
        console.error(`Error occurred: ${error.message}`);
        return ERROR(
            res,
            RESPONSE_CODES.SERVER_ERROR,
            MESSAGES.SERVER_ERROR,
            error.message
        );
    }
});

router.patch("/user/update_status/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const result = await updateUserStatusPending(userId);

        if (!result) {
            return res.status(404).json({
                responseCode: "E404000",
                responseMessage: MESSAGES.USER_NOT_FOUND,
                data: null,
            });
        }

        if (result.statusChanged) {
            return res.status(200).json({
                responseCode: "S100000",
                responseMessage: MESSAGES.STATUS_UPDATED_SUCCESS,
                data: {
                    user_id: result.user_id,
                    status: result.status,
                },
            });
        } else {
            return res.status(400).json({
                responseCode: "E400000",
                responseMessage: MESSAGES.STATUS_NOT_INITIATED,
                data: {
                    user_id: result.user_id,
                    status: result.status,
                },
            });
        }
    } catch (error) {
        console.error("Error in update_status API:", error);

        return res.status(500).json({
            responseCode: "E500000",
            responseMessage: MESSAGES.SERVER_ERROR,
            error: error.message,
            stack: error.stack,
        });
    }
});


router.put("/user/add_details/:userId", async (req, res) => {
    const userId = req.params.userId;
    const userDetails = req.body; // Extract data from the request body

    try {
        const updatedUser = await updateUserDetails(userId, userDetails);

        if (!updatedUser) {
            return res.status(404).json({
                responseCode: "E404000",
                responseMessage: MESSAGES.USER_NOT_FOUND,
                data: null,
            });
        }

        return res.status(200).json({
            responseCode: "S100000",
            responseMessage: MESSAGES.USER_DETAILS_UPDATED,
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error in add_details API:", error);

        return res.status(500).json({
            responseCode: "E500000",
            responseMessage: MESSAGES.SERVER_ERROR,
            error: error.message,
            stack: error.stack,
        });
    }
});



router.put("/user/update_columns/:userId", async (req, res) => {
    const userId = req.params.userId;
    const updates = req.body; // Data to update

    try {
        const result = await updateUserColumns(userId, updates);

        if (result.error === "INVALID_COLUMNS") {
            return res.status(400).json({
                responseCode: "E400001",
                responseMessage: MESSAGES.INVALID_COLUMNS,
                data: result.details,
            });
        }

        if (result.error === "TYPE_MISMATCH") {
            return res.status(400).json({
                responseCode: "E400002",
                responseMessage: MESSAGES.TYPE_MISMATCH,
                data: result.details,
            });
        }

        if (result.error === "USER_NOT_FOUND") {
            return res.status(404).json({
                responseCode: "E404000",
                responseMessage: MESSAGES.USER_NOT_FOUND,
                data: null,
            });
        }

        if (result.error === "NO_UPDATES") {
            return res.status(400).json({
                responseCode: "E400003",
                responseMessage: MESSAGES.NO_UPDATES_PROVIDED,
                data: null,
            });
        }

        return res.status(200).json({
            responseCode: "S100000",
            responseMessage: MESSAGES.UPDATE_SUCCESS_FULLY,
            data: result.updatedUser,
        });
    } catch (error) {
        console.error("Error in update_columns API:", error);

        return res.status(500).json({
            responseCode: "E500000",
            responseMessage: MESSAGES.SERVER_ERROR,
            error: error.message,
        });
    }
});

module.exports = router;

