/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management for staff
 */

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Add a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               access_list:
 *                 type: array
 *                 description: Access permissions for the role
 *               role_name:
 *                 type: string
 *                 description: Name of the role
 *               created_by:
 *                 type: string
 *                 description: Creator's ID
 *     responses:
 *       200:
 *         description: Role successfully added
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get a list of all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles fetched successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /roles/{role_id}:
 *   put:
 *     summary: Edit an existing role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         description: ID of the role to edit
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               access_list:
 *                 type: array
 *                 description: Updated access permissions
 *               role_name:
 *                 type: string
 *                 description: Updated name of the role
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /roles/{role_id}:
 *   delete:
 *     summary: Delete an existing role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         description: ID of the role to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       400:
 *         description: Role is associated with staff members
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff management
 */

/**
 * @swagger
 * /staffs:
 *   post:
 *     summary: Add a new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Staff member's name
 *               email:
 *                 type: string
 *                 description: Staff member's email
 *               password:
 *                 type: string
 *                 description: Password for the staff member
 *               created_by:
 *                 type: string
 *                 description: ID of the creator
 *               role:
 *                 type: string
 *                 description: Role assigned to the staff member
 *               status:
 *                 type: string
 *                 description: Status of the staff (e.g., Active)
 *     responses:
 *       200:
 *         description: Staff added successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /staffs/{staff_id}/role:
 *   put:
 *     summary: Update the role of a staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staff_id
 *         required: true
 *         description: ID of the staff to update role
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               new_role:
 *                 type: string
 *                 description: New role to assign
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /staffs:
 *   get:
 *     summary: Fetch a paginated list of staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number to fetch
 *     responses:
 *       200:
 *         description: Staff fetched successfully
 *       500:
 *         description: Server error
 */




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
