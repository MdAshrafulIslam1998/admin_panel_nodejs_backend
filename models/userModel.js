// models/userModel.js
const db = require('../config/db.config');

const getUserById = async (userId) => {
  const query = `
      SELECT name AS username, email, phone, dob, gender, address, level, status 
      FROM user 
      WHERE user_id = ?
  `;
  const [result] = await db.execute(query, [userId]);
  return result.length > 0 ? result[0] : null;
};



const getUserList = async (offset, limit) => {
  const query = `
    SELECT 
      u.user_id, 
      u.name, 
      u.email, 
      u.level AS level_id,  -- Keep the level ID for reference
      l.level_name,         -- Join to get level_name
      u.status, 
      u.date 
    FROM 
      user u
    LEFT JOIN 
      levels l ON u.level = l.levid  -- Join levels table based on level
    LIMIT ? OFFSET ?`;

  const [result] = await db.execute(query, [limit, offset]);
  return result;
};


const getUserProfileById = async (userId) => {
  const query = `
    SELECT 
      name AS username, 
      email, 
      phone, 
      dob, 
      gender, 
      address, 
      level, 
      status 
    FROM user 
    WHERE user_id = ?`;

  const [result] = await db.execute(query, [userId]);
  return result.length > 0 ? result[0] : null;
};


const updateUserLevel = async (userId, newLevel) => {
  // Validate that the newLevel exists in the levels table
  const [levelCheck] = await db.execute('SELECT levid FROM levels WHERE levid = ?', [newLevel]);
  if (levelCheck.length === 0) {
    throw new Error('Invalid level ID'); // or return null
  }

  const query = `
      UPDATE user 
      SET level = ? 
      WHERE user_id = ?
  `;
  const [result] = await db.execute(query, [newLevel, userId]);
  return result.affectedRows > 0; // Returns true if the update was successful
};


const updateUserStatus = async (userId, status) => {
  const query = 'UPDATE user SET status = ? WHERE user_id = ?';
  const [result] = await db.execute(query, [status, userId]);
  return result;
};


// models/userModel.js
const getUsersByLevelId = async (levid) => {
  const query = 'SELECT user_id FROM user WHERE level = ?';
  const [result] = await db.execute(query, [levid]);
  return result; // Returns an array of users associated with the level
};


// Update all users who are associated with a specific levid
const updateUsersLevelByLevid = async (levid) => {
  const query = 'UPDATE user SET level = ? WHERE level = ?';
  const [result] = await db.execute(query, [levid, levid]);  // Update all users with the new levid
  return result.affectedRows; // Return the number of rows updated
};



// models/userModel.js
const getTotalUserCount = async () => {
  const query = `SELECT COUNT(*) AS total FROM user`;
  const [result] = await db.execute(query);
  return result[0].total;
};

const getUserByEmail = async (email) => {
  const query =
    `SELECT user_id, name, email, phone, dob, gender, address, level, status, password 
       FROM user 
       WHERE email = ?`;
  const [result] = await db.execute(query, [email]);
  return result.length > 0 ? result[0] : null;
};


// Function to update the pushToken in the database
const updatePushToken = async (userId, pushToken) => {
  const query = `UPDATE user SET push_token = ? WHERE user_id = ?`;
  await db.execute(query, [pushToken, userId]);
};



// Function to check if a user already exists by email
const checkUserByEmail = async (email) => {
  const query = `SELECT * FROM user WHERE email = ?`;
  const [result] = await db.execute(query, [email]);
  return result.length > 0 ? result[0] : null;
};

// Function to create a new user
const createUser = async (userData) => {
  const query = `
      INSERT INTO user (
          name, email, password, phone, documents, user_id, dob, gender, address, level, status, approved_by, push_token, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const { name, email, password, phone, documents, user_id, dob, gender, address, level } = userData;

  await db.execute(query, [
    name,
    email,
    password,
    phone || null,             // Optional fields set to null if not provided
    documents || null,         // Optional fields set to null if not provided
    user_id,                   // UUID for user_id
    dob || null,               // Optional fields set to null if not provided
    gender,                    // Required
    address || null,           // Optional fields set to null if not provided
    level || null,             // Optional fields set to null if not provided
    'INITIATED',               // Default status
    null,                      // approved_by - set to null as not provided
    null,                      // push_token - set to null as not provided
    new Date()                 // Set current timestamp
  ]);

  return { name, email }; // Return only the necessary information
};

// Function to fetch user profile by user ID
const fetchUserProfileById = async (userId) => {
  // Query to get user details
  const userQuery = `
      SELECT user_id,name AS username, email, phone, dob, gender, address, level, status, approved_by
      FROM user
      WHERE user_id = ?
  `;
  const [userResult] = await db.execute(userQuery, [userId]);
  const userProfile = userResult.length > 0 ? userResult[0] : null;

  if (!userProfile) {
    return null; // User not found
  }

  // Query to get the level name based on level ID
  const levelQuery = `
      SELECT level_name
      FROM levels
      WHERE levid = ?
  `;
  const [levelResult] = await db.execute(levelQuery, [userProfile.level]);
  userProfile.level_name = levelResult.length > 0 ? levelResult[0].level_name : null;

  // Query to calculate total primary coins
  const primaryCoinsQuery = `
      SELECT SUM(coin) AS total_primary_coins
      FROM transaction_history
      WHERE uid = ? AND coin_type = 'PRIMARY'
  `;
  const [primaryCoinsResult] = await db.execute(primaryCoinsQuery, [userId]);
  userProfile.total_primary_coins = primaryCoinsResult[0].total_primary_coins || 0;

  // Query to calculate total secondary coins
  const secondaryCoinsQuery = `
      SELECT SUM(coin) AS total_secondary_coins
      FROM transaction_history
      WHERE uid = ? AND coin_type = 'SECONDARY'
  `;
  const [secondaryCoinsResult] = await db.execute(secondaryCoinsQuery, [userId]);
  userProfile.total_secondary_coins = secondaryCoinsResult[0].total_secondary_coins || 0;

  // Query to get the profile picture path from the documents table
  const profilePicQuery = `
      SELECT path
      FROM documents
      WHERE uid = ? AND doc_type = 'SELFIE'
      LIMIT 1
  `;
  const [profilePicResult] = await db.execute(profilePicQuery, [userId]);
  userProfile.profile_pic = profilePicResult.length > 0 ? profilePicResult[0].path : null;

  return userProfile;
};

const getVerifiedUsersWithCoins = async (offset, limit) => {
  const query = `
      SELECT 
          u.user_id,
          u.name,
          u.email,
          u.level AS level_id,
          l.level_name,
          u.status,
          u.date,
          u.phone,
          COALESCE(SUM(CASE WHEN th.coin_type = 'PRIMARY' THEN th.coin ELSE 0 END), 0) AS \`primary\`,
          COALESCE(SUM(CASE WHEN th.coin_type = 'SECONDARY' THEN th.coin ELSE 0 END), 0) AS secondary
      FROM user u
      LEFT JOIN levels l ON u.level = l.levid
      LEFT JOIN transaction_history th ON u.user_id = th.uid
      WHERE u.status = 'VERIFIED'
      GROUP BY u.user_id
      LIMIT ? OFFSET ?;
  `;

  const [users] = await db.execute(query, [limit, offset]);
  return users;
};


// Count total verified users for pagination
const getTotalVerifiedUserCount = async () => {
  const query = `SELECT COUNT(*) AS total FROM user WHERE status = 'VERIFIED'`;
  const [result] = await db.execute(query);
  return result[0].total;
};


// New function to get paginated pending users
const getPendingUsers = async (offset, limit) => {
  const query = `
      SELECT 
          u.user_id,
          u.name,
          u.email,
          u.status,
          u.date
      FROM user u
      WHERE u.status = 'PENDING'
      GROUP BY u.user_id
      LIMIT ? OFFSET ?;
  `;

  const [users] = await db.execute(query, [limit, offset]);
  return users;
};

// Count total pending users for pagination
const getTotalPendingUserCount = async () => {
  const query = `SELECT COUNT(*) AS total FROM user WHERE status = 'PENDING'`;
  const [result] = await db.execute(query);
  return result[0].total;
};

const updateUserStatusPending = async (userId) => {
  // Query to fetch the current user status
  const statusQuery = `
      SELECT user_id, status
      FROM user
      WHERE user_id = ?
  `;
  const [statusResult] = await db.execute(statusQuery, [userId]);

  if (statusResult.length === 0) {
    return null; // Return null to let the endpoint handle the response
  }

  const user = statusResult[0];
  let statusChanged = false; // Flag to track if status was updated

  if (user.status === "INITIATED") {
    // Update status to PENDING
    const updateStatusQuery = `
          UPDATE user
          SET status = 'PENDING'
          WHERE user_id = ?
      `;
    await db.execute(updateStatusQuery, [userId]);

    user.status = "PENDING"; // Update the status in the returned object
    statusChanged = true; // Set flag to true, indicating the update
  }

  return { ...user, statusChanged }; // Return user data along with the flag
};





const getBlockedUsers = async (offset, limit) => {
  const query = `
      SELECT 
          u.user_id,
          u.name,
          u.email,
          u.status,
          u.date
      FROM user u
      WHERE u.status = 'BLOCKED'
      GROUP BY u.user_id
      LIMIT ? OFFSET ?;
  `;

  const [users] = await db.execute(query, [limit, offset]);
  return users;
};

// Count total pending users for pagination
const getTotalBlockedUserCount = async () => {
  const query = `SELECT COUNT(*) AS total FROM user WHERE status = 'BLOCKED'`;
  const [result] = await db.execute(query);
  return result[0].total;
};


const updateUserDetails = async (userId, userDetails) => {
  // Destructure fields from userDetails
  const { phone, dob, gender, address } = userDetails;

  // Check if the user exists
  const userQuery = `
      SELECT user_id, phone, dob, gender, address, documents
      FROM user
      WHERE user_id = ?
  `;
  const [userResult] = await db.execute(userQuery, [userId]);

  if (userResult.length === 0) {
    return null; // User not found
  }

  // Fetch documents for the user
  const documentsQuery = `
      SELECT doc_type, path
      FROM documents
      WHERE uid = ?
  `;
  const [documentsResult] = await db.execute(documentsQuery, [userId]);

  // Convert documents to JSON format: { doc_type: path }
  const documentsJson = {};
  documentsResult.forEach(doc => {
    documentsJson[doc.doc_type] = doc.path;
  });

  // Update the user table
  const updateQuery = `
      UPDATE user
      SET phone = ?, dob = ?, gender = ?, address = ?, documents = ?
      WHERE user_id = ?
  `;
  await db.execute(updateQuery, [
    phone,
    dob,
    gender,
    address,
    JSON.stringify(documentsJson),
    userId,
  ]);

  // Return the updated data
  return {
    user_id: userId,
    phone,
    dob,
    gender,
    address,
    documents: documentsJson,
  };
};

const updateUserColumns = async (userId, updates) => {
  // Step 1: Fetch column structure of the user table
  const tableStructureQuery = `DESCRIBE user`;
  const [columns] = await db.execute(tableStructureQuery);

  // Map column names to their types
  const validColumns = {};
  columns.forEach((col) => {
    validColumns[col.Field] = col.Type;
  });

  // Step 2: Validate columns in the request body
  const invalidColumns = [];
  const mismatchedColumns = [];
  const valuesToUpdate = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!validColumns[key]) {
      invalidColumns.push(key); // Column not found in the table
    } else {
      // Validate type (simplified: handle enums and general types)
      const columnType = validColumns[key];
      const isStringType = columnType.startsWith("varchar") || columnType.startsWith("char") || columnType.startsWith("text") || columnType.startsWith("enum");
      const isNumberType = columnType.startsWith("int") || columnType.startsWith("decimal") || columnType.startsWith("float");
      const isEnumType = columnType.startsWith("enum");

      if (
        (isStringType && typeof value !== "string") ||
        (isNumberType && typeof value !== "number") ||
        (isEnumType && typeof value !== "string")
      ) {
        mismatchedColumns.push({ column: key, expected: columnType, received: typeof value });
      } else {
        valuesToUpdate.push({ column: key, value });
      }
    }
  }

  // Step 3: Handle errors
  if (invalidColumns.length > 0) {
    return { error: "INVALID_COLUMNS", details: invalidColumns };
  }

  if (mismatchedColumns.length > 0) {
    return { error: "TYPE_MISMATCH", details: mismatchedColumns };
  }

  // Step 4: If no errors, update the database
  if (valuesToUpdate.length > 0) {
    const updateQuery = `
          UPDATE user
          SET ${valuesToUpdate.map((v) => `${v.column} = ?`).join(", ")}
          WHERE user_id = ?
      `;
    const params = [...valuesToUpdate.map((v) => v.value), userId];

    const [updateResult] = await db.execute(updateQuery, params);

    if (updateResult.affectedRows === 0) {
      return { error: "USER_NOT_FOUND", details: `No user found with user_id: ${userId}` };
    }

    // Fetch the updated user data
    const fetchUpdatedUserQuery = `
          SELECT * FROM user WHERE user_id = ?
      `;
    const [updatedUser] = await db.execute(fetchUpdatedUserQuery, [userId]);

    return { updatedUser: updatedUser[0] };
  }

  return { error: "NO_UPDATES", details: "No valid data provided for update." };
};


/**
 * Function to search users with fuzzy matching and pagination.
 * @param {string} searchQuery - The text to search for (name, email, address, level, or status).
 * @param {number} page - The current page number for pagination.
 * @param {number} limit - The number of records to return per page.
 * @returns {object} - An object containing the search results and pagination data.
 */
const searchUsers = async (searchQuery, page, limit) => {
  const offset = (page - 1) * limit;

  // Define the SQL query with fuzzy search using LIKE.
  const query = `
      SELECT 
          user_id, name, email, dob, gender, address, level, status, approved_by, push_token, date
      FROM 
          user
      WHERE 
          name LIKE ? OR
          email LIKE ? OR
          address LIKE ? OR
          level LIKE ? OR
          status LIKE ?
      ORDER BY 
          date DESC
      LIMIT ? OFFSET ?;
  `;

  // Total count query for pagination
  const countQuery = `
      SELECT COUNT(*) AS total
      FROM user
      WHERE 
          name LIKE ? OR
          email LIKE ? OR
          address LIKE ? OR
          level LIKE ? OR
          status LIKE ?;
  `;

  // Fuzzy search pattern
  const searchPattern = `%${searchQuery}%`;

  // Execute the main query
  const [users] = await db.execute(query, [
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      limit,
      offset,
  ]);

  // Execute the count query
  const [countResult] = await db.execute(countQuery, [
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
  ]);
  const total = countResult[0]?.total || 0;

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  return {
      users,
      pagination: {
          total,
          total_pages: totalPages,
          current_page: page,
          limit,
      },
  };
};


// Function to update user password

module.exports = {
  getUserProfileById,
  getTotalUserCount,
  updateUsersLevelByLevid,
  getUserById,
  updateUserLevel,
  getUsersByLevelId,
  updateUserStatus,
  getUserList,
  getTotalBlockedUserCount,
  getBlockedUsers,
  getUserByEmail,
  searchUsers,
  checkUserByEmail,
  getTotalVerifiedUserCount,
  getVerifiedUsersWithCoins,
  fetchUserProfileById,
  getTotalPendingUserCount,
  getPendingUsers,
  createUser,
  updateUserStatusPending,
  updateUserDetails,
  updatePushToken,
  updateUserColumns
};