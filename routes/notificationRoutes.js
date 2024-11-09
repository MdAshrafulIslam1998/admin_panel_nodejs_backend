// notificationRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = require('../config/db.config'); // Adjust the path as necessary

// Initialize Firebase Admin if not already initialized in app.js
if (!admin.apps.length) {
    const serviceAccount = require('../config/firebase-service-account.json');
    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Endpoint to Send Notification
router.post('/send-notification', async (req, res) => {
  try {
    const { 
      token, 
      title, 
      body, 
      image, 
      caller_name, 
      caller_image, 
      channel, 
      video_token 
    } = req.body;

    // Validate required fields
    if (!token || !title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: token, title, and body are mandatory' 
      });
    }

    const message = {
      token,
      notification: { title, body },
      data: {
        title,
        body,
        image: image || '',
        type: "call",
        callerName: caller_name || '',
        callerImage: caller_image || '',
        channelName: channel || '',
        videoToken: video_token || '',
        isJoin: "true"
      }
    };
    
    const response = await admin.messaging().send(message);
    
    res.json({ 
      success: true, 
      message: 'Notification sent successfully!',
      messageId: response
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;