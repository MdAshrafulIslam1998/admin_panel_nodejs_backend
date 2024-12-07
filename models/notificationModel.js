const db = require('../config/db.config');

// Insert new notification into the database
// this is a comment
// another comment
const createNotification = async (notificationData) => {
  const { content, type, created_by, send_type, send_to, action, image_path, uid } = notificationData;
  
  const query = `
    INSERT INTO notification 
    (content, type, created_by, created_at, send_type, send_to, action, image_path, uid) 
    VALUES (?, ?, ?, UTC_TIMESTAMP(), ?, ?, ?, ?, ?)
  `;
  
  const [result] = await db.execute(query, [content, type, created_by, send_type, send_to, action, image_path, uid]);
  return result.insertId; // Returns the inserted notification's ID
};
// Fetch paginated notifications with search functionality
const getNotificationsList = async (offset, limit, searchQuery) => {
    const query = `
      SELECT 
        id, 
        content, 
        type, 
        created_by, 
        created_at, 
        send_type, 
        send_to, 
        action, 
        image_path, 
        uid 
      FROM notification 
      WHERE content LIKE ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?`;
  
    const [result] = await db.execute(query, [`%${searchQuery}%`, limit, offset]);
  
    // Count total notifications for pagination
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM notification 
      WHERE content LIKE ?`;
    
    const [countResult] = await db.execute(countQuery, [`%${searchQuery}%`]);
    const totalProducts = countResult[0].total; // Total number of notifications
  
    return { notifications: result, totalProducts }; // Return notifications and total count
  };

  // Fetch paginated notifications with search functionality and filtering by uid
const getNotificationsListByUser = async (uid, offset, limit, searchQuery) => {
    const query = `
      SELECT 
        id, 
        content, 
        type, 
        created_by, 
        created_at, 
        send_type, 
        send_to, 
        action, 
        image_path, 
        uid 
      FROM notification 
      WHERE content LIKE ? 
      AND uid = ? -- Filter by current user's uid
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?`;
  
    const [result] = await db.execute(query, [`%${searchQuery}%`, uid, limit, offset]);
  
    // Count total notifications for pagination, filtered by uid
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM notification 
      WHERE content LIKE ? 
      AND uid = ?`;
  
    const [countResult] = await db.execute(countQuery, [`%${searchQuery}%`, uid]);
    const totalProducts = countResult[0].total; // Total number of notifications
  
    return { notifications: result, totalProducts }; // Return notifications and total count
  };
  
  
  module.exports = {
    createNotification,
    getNotificationsList ,
    getNotificationsListByUser
  };
  
