// models/staffLoginModel.js
const db = require('../config/db.config');

// Function to get staff by email
const getStaffByEmail = async (email) => {
    const query = `
        SELECT id, name, email, password, role, status, staff_id 
        FROM staffs 
        WHERE email = ?
    `;
    const [result] = await db.execute(query, [email]);
    return result.length > 0 ? result[0] : null;
};

module.exports = { getStaffByEmail };
