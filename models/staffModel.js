// models/staffModel.js
const db = require('../config/db.config');

// Add new staff
const addStaff = async (name, email, password, created_by, role, status) => {
  const query = `INSERT INTO staffs (name, email, password, created_by, role, status) VALUES (?, ?, ?, ?, ?, ?)`;
  const [result] = await db.execute(query, [name, email, password, created_by, role, status]);
  return result.insertId;
};

// Edit staff role
const editStaffRole = async (staff_id, new_role) => {
  const query = `UPDATE staffs SET role = ? WHERE id = ?`;
  const [result] = await db.execute(query, [new_role, staff_id]);
  return result.affectedRows > 0; // Return true if update is successful
};


// Show paginated staff list with role details
const getPaginatedStaff = async (page, limit) => {
    const offset = (page - 1) * limit;
    const query = `
        SELECT 
            s.id AS staff_id,
            s.name,
            s.email,
            s.status,
            r.role_name,
            r.access_list
        FROM staffs s
        LEFT JOIN roles r ON s.role = r.id
        LIMIT ? OFFSET ?;
    `;
    
    const [result] = await db.execute(query, [limit, offset]);
    return result;
};

// Function to get total count of staffs (for pagination)
const getTotalStaffCount = async () => {
    const query = `SELECT COUNT(*) as total FROM staffs;`;
    const [result] = await db.execute(query);
    return result[0].total;
};

module.exports = {
  addStaff,
  getPaginatedStaff,
  getTotalStaffCount,
  editStaffRole
  
};
