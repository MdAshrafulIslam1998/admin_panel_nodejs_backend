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


// 1. Fetch all notifications
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM notifications ORDER BY created_at DESC");
    SUCCESS(res, "S100000", "Notifications fetched successfully.", rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    ERROR(res, "E10003", "Failed to fetch notifications.", err.message);
  }
});


// 2. API to create a new topic
router.post("/topics", authenticateToken, async (req, res) => {
  const { topic_name } = req.body;

  if (!topic_name) {
    return ERROR(res, "E20001", "Topic name is mandatory.");
  }

  try {
    // Insert topic into database
    const [result] = await db.query("INSERT INTO fcm_topics (topic_name, created_at) VALUES (?, NOW())", [topic_name]);

    SUCCESS(res, "S20001", "Topic created successfully.", { id: result.insertId, topic_name });
  } catch (err) {
    console.error("Error creating topic:", err);
    ERROR(res, "E20002", "Failed to create topic.", err.message);
  }
});


// 3. sucscribe
router.post("/topics/:topic_name/subscribe", authenticateToken, async (req, res) => {
  const { topic_name } = req.params;
  const { user_ids } = req.body; // Array of user IDs

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return ERROR(res, "E20003", "User IDs array is mandatory.");
  }

  try {
    // Step 1: Check if the topic exists in `fcm_topics` table
    const [topicResult] = await db.query(
      `SELECT topic_name FROM fcm_topics WHERE topic_name = ?`,
      [topic_name]
    );

    if (topicResult.length === 0) {
      return ERROR(res, "E20006", `Topic '${topic_name}' does not exist.`);
    }

    // Step 2: Fetch user tokens from the database
    const [users] = await db.query(
      `SELECT user_id, push_token FROM user WHERE user_id IN (?) AND push_token IS NOT NULL`,
      [user_ids]
    );

    const tokens = users.map(user => user.push_token);
    const subscribedUsers = users.map(user => user.user_id);

    if (tokens.length === 0) {
      return ERROR(res, "E20005", "No valid push tokens found for the provided user IDs.");
    }

    // Step 3: Batch tokens into groups of 1,000 for FCM
    const batchSize = 1000;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      await admin.messaging().subscribeToTopic(batch, topic_name);
    }

    // Step 4: Insert subscriptions into the `fcm_subscriptions` table
    const subscriptionData = subscribedUsers.map(user_id => [user_id, topic_name]);
    await db.query(
      `INSERT INTO fcm_subscriptions (user_id, topic_name) VALUES ? 
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      [subscriptionData]
    );

    // Success response
    SUCCESS(res, "S20002", "Users subscribed to topic successfully.", {
      topic_name,
      user_count: tokens.length,
    });
  } catch (err) {
    console.error("Error subscribing users to topic:", err);
    ERROR(res, "E20004", "Failed to subscribe users to topic.", err.message);
  }
});





// 4. API to fetch all topics and their subscribed user tokens
router.get("/topics/subscriptions", authenticateToken, async (req, res) => {
  try {
    // Step 1: Fetch all topics from the `fcm_topics` table
    const [topics] = await db.query("SELECT topic_name FROM fcm_topics");

    if (topics.length === 0) {
      return SUCCESS(res, "S20004", "No topics found.", []);
    }

    // Step 2: Initialize response data
    const responseData = [];

    // Step 3: For each topic, fetch subscribed users and their tokens
    for (const topic of topics) {
      const topicName = topic.topic_name;

      try {
        // Fetch subscriptions from the `fcm_subscriptions` table
        const [subscriptions] = await db.query(
          `SELECT user.user_id, user.push_token 
           FROM fcm_subscriptions 
           JOIN user ON fcm_subscriptions.user_id = user.user_id 
           WHERE fcm_subscriptions.topic_name = ? AND user.push_token IS NOT NULL`,
          [topicName]
        );

        // Calculate total token count and extract the first 5 tokens
        const totalTokens = subscriptions.length;
        const tokens = subscriptions.map((sub) => sub.push_token);
        const displayTokens = tokens.slice(0, 5);
        const continuationSign = totalTokens > 5 ? "..." : "";

        responseData.push({
          topic_name: topicName,
          total_subscribed_users: totalTokens,
          subscribed_tokens: [...displayTokens, continuationSign].filter(Boolean), // Include "..." if there are more tokens
        });
      } catch (err) {
        console.error(`Error fetching subscriptions for topic ${topicName}:`, err);
        responseData.push({
          topic_name: topicName,
          total_subscribed_users: 0,
          subscribed_tokens: [],
          error: "Failed to fetch subscriptions",
        });
      }
    }

    // Step 4: Send response
    SUCCESS(res, "S20005", "Topics and subscriptions fetched successfully.", responseData);
  } catch (err) {
    console.error("Error fetching topics and subscriptions:", err);
    ERROR(res, "E20007", "Failed to fetch topics and subscriptions.", err.message);
  }
});





// 5. API to unsubscribe
router.post("/topics/:topic_name/unsubscribe", authenticateToken, async (req, res) => {
  const { topic_name } = req.params;
  const { user_ids } = req.body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return ERROR(res, "E20008", "User IDs array is mandatory.");
  }

  try {
    // Step 1: Validate the topic exists in the database
    const [topics] = await db.query("SELECT topic_name FROM fcm_topics WHERE topic_name = ?", [topic_name]);
    if (topics.length === 0) {
      return ERROR(res, "E20010", `Topic '${topic_name}' not found.`);
    }

    // Step 2: Check if any of the user_ids are subscribed to the topic in the `fcm_subscriptions` table
    const [subscriptions] = await db.query(
      `SELECT fcm_subscriptions.user_id, user.push_token 
      FROM fcm_subscriptions 
      JOIN user ON user.user_id = fcm_subscriptions.user_id 
      WHERE fcm_subscriptions.topic_name = ? AND fcm_subscriptions.user_id IN (?)`,
      [topic_name, user_ids]
    );

    if (subscriptions.length === 0) {
      return ERROR(
        res,
        "E20011",
        "No subscriptions found for the provided user IDs in the given topic."
      );
    }

    const tokens = subscriptions.map((sub) => sub.push_token);
    const subscribedUserIds = subscriptions.map((sub) => sub.user_id);

    // Step 3: Validate that all provided user_ids have valid subscriptions (no partial unsubscribes)
    if (subscribedUserIds.length !== user_ids.length) {
      return ERROR(
        res,
        "E20012",
        "Partial unsubscribe not allowed. Ensure all provided user IDs are valid and unsubscribable."
      );
    }

    // Step 4: Unsubscribe tokens from the topic in FCM
    const batchSize = 1000;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      await admin.messaging().unsubscribeFromTopic(batch, topic_name);
    }

    // Step 5: Remove the entries from the `fcm_subscriptions` table
    await db.query(
      `DELETE FROM fcm_subscriptions WHERE topic_name = ? AND user_id IN (?)`,
      [topic_name, user_ids]
    );

    // Step 6: Fetch the remaining subscribed user count for the topic
    const [remainingSubscriptions] = await db.query(
      `SELECT COUNT(*) AS remaining_users FROM fcm_subscriptions WHERE topic_name = ?`,
      [topic_name]
    );
    const remainingUsers = remainingSubscriptions[0]?.remaining_users || 0;

    // Step 7: Send success response
    SUCCESS(res, "S20006", "Users unsubscribed from topic successfully.", {
      topic_name,
      unsubscribed_user_count: tokens.length,
      remaining_users: remainingUsers,
    });
  } catch (err) {
    console.error("Error unsubscribing users from topic:", err);
    ERROR(res, "E20009", "Failed to unsubscribe users from topic.", err.message);
  }
});



// 6. delete topic
router.delete("/topics/:topic_name", authenticateToken, async (req, res) => {
  const { topic_name } = req.params;

  try {
    // Delete the topic and its subscriptions from the database
    // await db.query(`DELETE FROM fcm_topic_subscriptions WHERE topic_name = ?`, [topic_name]);
    await db.query(`DELETE FROM fcm_topics WHERE topic_name = ?`, [topic_name]);

    SUCCESS(res, "S20007", "Topic deleted successfully.", { topic_name });
  } catch (err) {
    console.error("Error deleting topic:", err);
    ERROR(res, "E20010", "Failed to delete topic.", err.message);
  }
});




// 6. API to send notification to a topic
router.post("/topics/:topic_name/send", authenticateToken, async (req, res) => {
  const { topic_name } = req.params;
  const { title, details, rich_media_url, deep_link } = req.body;

  if (!title || !details) {
    return ERROR(res, "E20005", "Title and details are mandatory.");
  }

  try {
    // Generate a random notification ID
    const notificationId = Math.floor(Math.random() * 1e12);

    // Prepare the message payload
    const message = {
      topic: topic_name,
      notification: { title, body: details },
      data: {
        title,
        body: details,
        deep_link: deep_link || "",
        image: rich_media_url || "",
      },
    };

    // Send the notification
    const response = await admin.messaging().send(message);

    // Log the notification in the database
    await db.query(
      `INSERT INTO notifications (notification_id, title, details, rich_media_url, deep_link, type, status, target_type, target_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'instant', 'sent', 'ALL', ?, NOW(), NOW())`,
      [
        notificationId,
        title,
        details,
        rich_media_url || null,
        deep_link || null,
        topic_name,
      ]
    );

    SUCCESS(res, "S20003", "Notification sent to topic successfully.", response);
  } catch (err) {
    console.error("Error sending notification to topic:", err);
    ERROR(res, "E20006", "Failed to send notification to topic.", err.message);
  }
});




// instant notification
router.post("/notifications/send", authenticateToken, async (req, res) => {
  const { token, user_id, title, details, rich_media_url, deep_link } = req.body;


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
      data: { title, user_id, body: details, deep_link, image: rich_media_url || "" },
    };

    // Send the notification
    const response = await admin.messaging().send(message);

    // Log the notification in the notification_logs table
    const logData = {
      notification_id: notificationId,
      target_id: user_id,
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
      target_id: user_id,
      created_at: new Date(), // Current timestamp
      updated_at: new Date(), // Current timestamp
    };
    await db.query("INSERT INTO notifications SET ?", notificationData);

    // Return success response
    SUCCESS(res, "S100000", "Instant notification sent successfully.", response);
  } catch (err) {
    console.error("Error sending notification:", err);

    // Generate random notification ID for logging the failure
    const notificationId = Math.floor(Math.random() * 1e12); // Random number (12 digits)

    // Log the failure in the notification_logs table
    const logData = {
      notification_id: notificationId,
      target_id: user_id,
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
    SUCCESS(res, "S100000", "Notifications fetched successfully.", { notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    ERROR(res, "E10006", "Failed to fetch notifications.", err.message);
  }
});



module.exports = router;
