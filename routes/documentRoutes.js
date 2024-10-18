/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document management
 */

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Add a new document for a user
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doc_type:
 *                 type: string
 *                 description: Type of the document (e.g., ID, passport)
 *               uid:
 *                 type: string
 *                 description: User ID the document is associated with
 *               path:
 *                 type: string
 *                 description: Path to the document file
 *     responses:
 *       200:
 *         description: Document added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Document ID
 *                     doc_type:
 *                       type: string
 *                       description: Type of the document
 *                     uid:
 *                       type: string
 *                       description: User ID the document is associated with
 *                     path:
 *                       type: string
 *                       description: Path to the document file
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 */



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

module.exports = router;
