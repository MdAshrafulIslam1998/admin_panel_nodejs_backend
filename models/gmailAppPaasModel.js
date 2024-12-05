const db = require('../config/db.config'); // Import the database pool

/**
 * Update email credentials in the database
 * @param {string} email_user - New email user
 * @param {string} email_pass - New email password
 * @returns {boolean} - True if the update was successful, otherwise false
 */
const updateGmailAppPassCredentials = async (email_user, email_pass) => {
    const query = `
        UPDATE gmail_app
        SET email_user = ?, email_pass = ?
        WHERE id = 1; -- Assuming there's only one row to update
    `;
    const [result] = await db.execute(query, [email_user, email_pass]);
    return result.affectedRows > 0; // Returns true if the update was successful
};

module.exports = { updateGmailAppPassCredentials: updateGmailAppPassCredentials };
