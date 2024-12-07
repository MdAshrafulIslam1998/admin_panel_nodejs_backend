const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = require("../config/db.config"); // Adjust the path as necessary
const authenticateToken = require("../middleware/authenticateToken");
const { SUCCESS, ERROR } = require("../middleware/handler");
const { MESSAGES, RESPONSE_CODES } = require("../utils/message");
// Initialize Firebase Admin if not already initialized in app.js
if (!admin.apps.length) {
  const serviceAccount = require("../config/firebase-service-account.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Endpoint to Send Notification
router.post("/send-call-notification", authenticateToken, async (req, res) => {
  try {
    const {
      token,
      title,
      body,
      image,
      caller_name,
      caller_image,
      channel,
      video_token,
      type
    } = req.body;

    // Validate required fields
    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: token, title, and body are mandatory",
      });
    }

    const messageData = {
      "title":title,
      "body":body,
      "image": image || "",
      "type": type,
      "callerName": caller_name || "",
      "callerImage": caller_image || "",
      "channelName": channel || "",
      "videoToken": video_token || "",
      "isJoin": "true",
    };

    const response = await admin.messaging().send({
      token,
      notification: { title, body },
      data: {
        "title":title,
        "body":body,
        "image": image || "",
        "type": type,
        "callerName": caller_name || "",
        "callerImage": caller_image || "",
        "channelName": channel || "",
        "videoToken": video_token || "",
        "isJoin": "true"
      }
    });

    // Respond with success
    SUCCESS(
      res,
      RESPONSE_CODES.SUCCESS,
      MESSAGES.NOTIFICATION_CREATED_SUCCESSFULLY,
      response
    );
  } catch (error) {
    console.error(error);
    ERROR(
      res,
      RESPONSE_CODES.SERVER_ERROR,
      MESSAGES.NOTIFICATION_CREATED_FAILED,
      error.message
    );
  }
});

module.exports = router;
