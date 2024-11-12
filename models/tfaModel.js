// models/tfaModel.js
const db = require('../config/db.config');

// Function to create a new TFA entry
const createTFA = async (tfaCode, recipientEmail, sessionId, expiredAt) => {
    const query = `
        INSERT INTO tfa (tfa_code, recipient_email, session_id, expired_at) 
        VALUES (?, ?, ?, ?)
    `;
    await db.execute(query, [tfaCode, recipientEmail, sessionId, expiredAt]);
    return { tfaCode, recipientEmail, sessionId, expiredAt };
};

// Function to get TFA entry by session ID
const getTFABySessionId = async (sessionId) => {
    const query = `
        SELECT tfa_code, recipient_email, session_id, created_at, expired_at, status
        FROM tfa
        WHERE session_id = ?
    `;
    const [result] = await db.execute(query, [sessionId]);
    return result.length > 0 ? result[0] : null;
};

// Function to update TFA status to validated
const validateTFA = async (sessionId) => {
    const query = `UPDATE tfa SET status = 'VALIDATED' WHERE session_id = ?`;
    await db.execute(query, [sessionId]);
};



const updateUserPassword = async (email, password) => {
    const query = 'UPDATE user SET password = ? WHERE email = ?';
    const [result] = await db.execute(query, [password, email]);
    return result.affectedRows > 0; // Returns true if the update was successful
  };


  // Function to check if a TFA session is validated
const checkTfaSession = async (sessionId) => {
    const query = `
        SELECT tfa_code, recipient_email, session_id, created_at, expired_at, status
        FROM tfa
        WHERE session_id = ? AND status = 'VALIDATED'
    `;
    const [result] = await db.execute(query, [sessionId]);
    return result.length > 0 ? result[0] : null;  // Return TFA record if validated
};
  

module.exports = { createTFA, getTFABySessionId, validateTFA, updateUserPassword, checkTfaSession};