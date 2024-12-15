const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = require("../config/db.config");
const authenticateToken = require("../middleware/authenticateToken");
const { SUCCESS, ERROR } = require('../middleware/handler');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require("../config/firebase-service-account.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Create a new notification
router.post("/notifications", authenticateToken, async (req, res) => {
  const {
    title,
    details,
    rich_media_url,
    deep_link,
    type,
    time,
    days_of_week,
    start_date,
    interval_minutes,
  } = req.body;

  if (!title || !details || !type) {
    return ERROR(res, "E10001", "Title, details, and type are mandatory.");
  }

  try {
    const query = `
      INSERT INTO notifications 
      (title, details, rich_media_url, deep_link, type, time, days_of_week, start_date, interval_minutes, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'running')`;
    const values = [
      title,
      details,
      rich_media_url || null,
      deep_link || null,
      type,
      time || null,
      days_of_week || null,
      start_date || null,
      interval_minutes || null,
    ];

    const [result] = await db.execute(query, values);

    SUCCESS(res, "S10001", "Notification created successfully.", { id: result.insertId });
  } catch (err) {
    console.error("Error creating notification:", err);
    ERROR(res, "E10002", "Failed to create notification.", err.message);
  }
});

// Fetch all notifications
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM notifications ORDER BY created_at DESC");
    SUCCESS(res, "S10002", "Notifications fetched successfully.", rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    ERROR(res, "E10003", "Failed to fetch notifications.", err.message);
  }
});



router.post("/notifications/send", authenticateToken, async (req, res) => {
  const { token, title, details, rich_media_url, deep_link } = req.body;

  // Validate input
  if (!token || !title || !details) {
    return ERROR(res, "E10005", "Token, title, and details are mandatory.");
  }

  try {
    // Generate a random notification ID
    const notificationId = Math.floor(Math.random() * 1e12); // Random number (12 digits)

    // Prepare the message payload
    const message = {
      token,
      notification: { title, body: details },
      data: { title, details, deep_link, image: rich_media_url || "" },
    };

    // Send the notification
    const response = await admin.messaging().send(message);

    // Log the notification in the notification_logs table
    const logData = {
      notification_id: notificationId,
      target_id: token,
      status: "delivered",
      error_message: "none", // Update error_message for success
      sent_at: new Date(),
    };
    await db.query("INSERT INTO notification_logs SET ?", logData);

    // Insert into the notifications table
    const notificationData = {
      notification_id: notificationId,
      title,
      details,
      rich_media_url: rich_media_url || null,
      deep_link: deep_link || null,
      type: "instant",
      time: new Date(), // Current time
      days_of_week: null, // Default null
      start_date: null, // Default null
      interval_minutes: null, // Default null
      last_sent_at: new Date(), // Current timestamp
      status: "sent", // Status 'sent'
      target_id: token,
      created_at: new Date(), // Current timestamp
      updated_at: new Date(), // Current timestamp
    };
    await db.query("INSERT INTO notifications SET ?", notificationData);

    // Return success response
    SUCCESS(res, "S10003", "Instant notification sent successfully.", response);
  } catch (err) {
    console.error("Error sending notification:", err);

    // Generate random notification ID for logging the failure
    const notificationId = Math.floor(Math.random() * 1e12); // Random number (12 digits)

    // Log the failure in the notification_logs table
    const logData = {
      notification_id: notificationId,
      target_id: token,
      status: "failed",
      error_message: err.message,
      sent_at: new Date(),
    };
    await db.query("INSERT INTO notification_logs SET ?", logData);

    // Return error response
    ERROR(res, "E10006", "Failed to send instant notification.", err.message);
  }
});



// Fetch all notifications for a specific target_id
router.post("/notifications/fetch-by-target", authenticateToken, async (req, res) => {
  const { target_id } = req.body;

  // Validate input
  if (!target_id) {
    return ERROR(res, "E10005", "Target ID is mandatory.");
  }

  try {
    // Fetch notifications for the given target_id
    const [notifications] = await db.query(
      `SELECT 
        id,
        notification_id,
        title,
        details,
        rich_media_url,
        deep_link,
        type,
        time,
        days_of_week,
        start_date,
        interval_minutes,
        last_sent_at,
        status,
        target_id,
        created_at,
        updated_at 
      FROM notifications 
      WHERE target_id = ? 
      ORDER BY created_at DESC`,
      [target_id]
    );

    // Return success response with the notifications
    SUCCESS(res, "S10003", "Notifications fetched successfully.", { notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    ERROR(res, "E10006", "Failed to fetch notifications.", err.message);
  }
});




// Stop a running notification
router.post("/notifications/stop/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const query = "UPDATE notifications SET status = 'stopped' WHERE id = ?";
    await db.execute(query, [id]);

    SUCCESS(res, "S10004", "Notification stopped successfully.");
  } catch (err) {
    console.error("Error stopping notification:", err);
    ERROR(res, "E10007", "Failed to stop notification.", err.message);
  }
});

module.exports = router;
