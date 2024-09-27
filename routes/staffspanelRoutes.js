// routes/staffspanelRoutes.js
const express = require('express');
const { addRole, getRoles, editRole, deleteRole } = require('../models/roleModel');
const { addStaff, editStaffRole,  getPaginatedStaff,getTotalStaffCount} = require('../models/staffModel');
const authenticateToken = require('../middleware/authenticateToken');
const { SUCCESS, ERROR } = require('../middleware/handler');
const { MESSAGES, RESPONSE_CODES } = require('../utils/message');
const router = express.Router();

// Add new role
router.post('/roles', authenticateToken, async (req, res, next) => {
  try {
    const { access_list, role_name, created_by } = req.body;
    const roleId = await addRole(access_list, role_name, created_by);
    SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.ROLE_ADDED, { roleId });
  } catch (error) {
    next(error);
  }
});

// Show all roles
router.get('/roles', authenticateToken, async (req, res, next) => {
  try {
    const roles = await getRoles();
    SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.ROLES_FETCHED, { roles });
  } catch (error) {
    next(error);
  }
});

// Edit role
router.put('/roles/:role_id', authenticateToken, async (req, res, next) => {
  try {
    const { role_id } = req.params;
    const { access_list, role_name } = req.body;
    const updated = await editRole(role_id, access_list, role_name);
    if (updated) {
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.ROLE_UPDATED, null);
    } else {
      ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.ROLE_NOT_FOUND);
    }
  } catch (error) {
    next(error);
  }
});

// Delete role (check if associated staff exists)
router.delete('/roles/:role_id', authenticateToken, async (req, res, next) => {
  try {
    const { role_id } = req.params;
    const deleted = await deleteRole(role_id);
    if (deleted) {
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.ROLE_DELETED, null);
    } else {
      ERROR(res, RESPONSE_CODES.VALIDATION_ERROR, MESSAGES.ROLE_ASSOCIATED_WITH_STAFF);
    }
  } catch (error) {
    next(error);
  }
});

// Add new staff
router.post('/staffs', authenticateToken, async (req, res, next) => {
  try {
    const { name, email, password, created_by, role, status } = req.body;
    const staffId = await addStaff(name, email, password, created_by, role, status);
    SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.STAFF_ADDED, { staffId });
  } catch (error) {
    next(error);
  }
});

// Edit staff role
router.put('/staffs/:staff_id/role', authenticateToken, async (req, res, next) => {
  try {
    const { staff_id } = req.params;
    const { new_role } = req.body;
    const updated = await editStaffRole(staff_id, new_role);
    if (updated) {
      SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.STAFF_ROLE_UPDATED, null);
    } else {
      ERROR(res, RESPONSE_CODES.NOT_FOUND, MESSAGES.STAFF_NOT_FOUND);
    }
  } catch (error) {
    next(error);
  }
});



// Show paginated staff list with role details
router.get('/staffs', authenticateToken, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = 10; // Number of records per page
        const staffs = await getPaginatedStaff(page, limit);
        const total = await getTotalStaffCount();

        SUCCESS(res, RESPONSE_CODES.SUCCESS, MESSAGES.STAFFS_FETCHED, {
            total,
            page,
            limit,
            data: staffs,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
