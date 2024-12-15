const cron = require("node-cron");
const db = require("../config/db.config");
const admin = require("firebase-admin");


// Cron job to run every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // Format: HH:MM
  const currentDay = now.getDay(); // Sunday = 0, Monday = 1, etc.

  try {
    // Handle 'daily' notifications
    const [dailyNotifications] = await db.execute(
      "SELECT * FROM notifications WHERE type = 'daily' AND status = 'running' AND time = ?",
      [currentTime]
    );
    await sendNotifications(dailyNotifications);

    // Handle 'weekly' notifications
    const [weeklyNotifications] = await db.execute(
      "SELECT * FROM notifications WHERE type = 'weekly' AND status = 'running' AND FIND_IN_SET(?, days_of_week) > 0 AND time = ?",
      [currentDay, currentTime]
    );
    await sendNotifications(weeklyNotifications);

    // Handle 'repeated' notifications
    const [repeatedNotifications] = await db.execute(
      "SELECT * FROM notifications WHERE type = 'repeated' AND status = 'running'"
    );
    for (const notification of repeatedNotifications) {
      const lastSent = new Date(notification.last_sent_at || notification.start_date);
      const nextSendTime = new Date(lastSent.getTime() + notification.interval_minutes * 60000);

      if (nextSendTime <= now) {
        await sendNotification(notification);
        await db.execute("UPDATE notifications SET last_sent_at = ? WHERE id = ?", [now, notification.id]);
      }
    }
  } catch (err) {
    console.error("Error in cron job:", err);
  }
});

async function sendNotifications(notifications) {
  for (const notification of notifications) {
    await sendNotification(notification);
  }
}

async function sendNotification(notification) {
  try {
    // Replace with actual FCM logic
    console.log(`Sending notification: ${notification.title}`);
  } catch (err) {
    console.error("Error sending notification:", err.message);
  }
}

module.exports = cron;
