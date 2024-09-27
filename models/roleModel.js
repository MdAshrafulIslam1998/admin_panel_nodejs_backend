// models/roleModel.js
const db = require('../config/db.config');

// Add new role
const addRole = async (access_list, role_name, created_by) => {
  const query = `INSERT INTO roles (access_list, role_name, created_by) VALUES (?, ?, ?)`;
  const [result] = await db.execute(query, [access_list, role_name, created_by]);
  return result.insertId; // Return the new role's ID
};

// Get all roles
const getRoles = async () => {
  const query = `SELECT * FROM roles`;
  const [results] = await db.execute(query);
  return results;
};

// Edit role
const editRole = async (role_id, access_list, role_name) => {
  const query = `UPDATE roles SET access_list = ?, role_name = ? WHERE id = ?`;
  const [result] = await db.execute(query, [access_list, role_name, role_id]);
  return result.affectedRows > 0; // Return true if update is successful
};

// Delete role (Check for associated staffs)
const deleteRole = async (role_id) => {
  const checkQuery = `SELECT COUNT(*) as staffCount FROM staffs WHERE role = ?`;
  const [result] = await db.execute(checkQuery, [role_id]);

  if (result[0].staffCount > 0) {
    return false; // Cannot delete if staff are associated
  }

  const deleteQuery = `DELETE FROM roles WHERE id = ?`;
  const [deleteResult] = await db.execute(deleteQuery, [role_id]);
  return deleteResult.affectedRows > 0; // Return true if deletion is successful
};

module.exports = {
  addRole,
  getRoles,
  editRole,
  deleteRole,
};
