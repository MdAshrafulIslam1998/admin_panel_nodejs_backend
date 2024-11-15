const db = require('../config/db.config'); // Adjust the path as necessary

class TransactionHistoryModel {
    static async getAllTransactions() {
        const query = 'SELECT * FROM transaction_history';
        const [rows] = await db.execute(query);
        return rows;
    }

    static async getPaginatedTransactions(limit, offset) {
        const query = `
            SELECT * FROM transaction_history
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(query, [limit, offset]);
        return rows;
    }

    // Fetch transactions by user ID
    static async getTransactionsByUserId(userId) {
        const query = 'SELECT name, email, coin, date, created_by FROM transaction_history WHERE uid = ?';
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }

    static async getTotalTransactions() {
        const query = 'SELECT COUNT(*) as total FROM transaction_history';
        const [rows] = await db.execute(query);
        return rows[0].total;
    }

    static async getAllUserWiseTransactions() {
        const query = `
            SELECT 
                MIN(name) AS name,
                MIN(email) AS email,
                uid,
                SUM(COALESCE(coin, 0)) AS total_coins
            FROM transaction_history
            GROUP BY uid
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    // Fetch categorized transactions by category and coin type for a specific user
    static async getTransactionsCategorizedByCategory(userId) {
        const query = `
                SELECT cat_id, coin_type, SUM(coin) as total_coins
                FROM transaction_history
                WHERE uid = ?
                GROUP BY cat_id, coin_type
            `;
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }



    // Check if there are any transactions associated with the category ID
    static async checkTransactionHistoryByCategoryId(catId) {
        const query = 'SELECT COUNT(*) as count FROM transaction_history WHERE cat_id = ?';
        const [rows] = await db.execute(query, [catId]);
        return rows[0].count > 0; // Returns true if there are associated transactions
    }


    // Fetch users who used coins in a specific category
    static async getUsersWithCategoryCoins(category, limit, offset) {
        const query = `
            SELECT u.user_id, u.name, u.email, u.level, u.status, u.date,
                SUM(CASE WHEN th.coin_type = 'PRIMARY' THEN th.coin ELSE 0 END) AS primary_total,
                SUM(CASE WHEN th.coin_type = 'SECONDARY' THEN th.coin ELSE 0 END) AS secondary_total
            FROM user u
            JOIN transaction_history th ON u.user_id = th.uid
            WHERE th.cat_id = ?
            GROUP BY u.user_id
            HAVING primary_total > 0 OR secondary_total > 0
            LIMIT ? OFFSET ?
        `;
        const [result] = await db.execute(query, [category, limit, offset]);
        return result;
    }

    // Count the total number of users with coin transactions in the specific category
    static async getTotalUsersWithCategoryCoins(category) {
        const query = `
            SELECT COUNT(DISTINCT u.user_id) AS total
            FROM user u
            JOIN transaction_history th ON u.user_id = th.uid
            WHERE th.cat_id = ?
            AND (th.coin_type = 'PRIMARY' OR th.coin_type = 'SECONDARY')
        `;
        const [result] = await db.execute(query, [category]);
        return result[0].total;
    }


    // Fetch paginated transactions with category name and image by user ID
    static async getPaginatedTransactionsByUserId(userId, limit, offset) {
        const query = `
            SELECT 
                th.id,
                th.cat_id,
                c.name AS category_name,
                c.image,
                th.coin,
                th.date,
                th.name,
                th.email,
                th.created_by,
                th.coin_type
            FROM transaction_history th
            JOIN categories c ON th.cat_id = c.id
            WHERE th.uid = ?
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(query, [userId, limit, offset]);
        return rows;
    }


    // Count total transactions for the user
    static async getTotalTransactionsByUserId(userId) {
        const query = 'SELECT COUNT(*) as total FROM transaction_history WHERE uid = ?';
        const [rows] = await db.execute(query, [userId]);
        return rows[0].total;
    }

    // Fetch paginated transactions by user ID and category ID
    static async getPaginatedTransactionsByUserIdAndCategory(userId, catId, limit, offset) {
        const query = `
        SELECT 
            th.id,
            th.cat_id,
            c.name AS category_name,
            c.image,
            th.coin,
            th.date,
            th.name,
            th.email,
            th.created_by,
            th.coin_type
        FROM transaction_history th
        JOIN categories c ON th.cat_id = c.id
        WHERE th.uid = ? AND th.cat_id = ?  -- Correctly filtering by user_id and cat_id
        LIMIT ? OFFSET ?
    `;
        const [rows] = await db.execute(query, [userId, catId, limit, offset]);
        return rows;
    }


    // Count total transactions for the user in a specific category// Count total transactions for the user in a specific category
    static async getTotalTransactionsByUserIdAndCategory(userId, catId) {
        const query = 'SELECT COUNT(*) as total FROM transaction_history WHERE uid = ? AND cat_id = ?';
        const [rows] = await db.execute(query, [userId, catId]);  // Correctly using userId and catId for filtering
        return rows[0].total;
    }



    static async getPaginatedVerifiedUsers(limit, offset) {
        const query = `
            SELECT 
                u.user_id,
                u.name,
                u.email,
                u.status,
                u.level AS level_id,
                l.level_name
            FROM 
                user u
            JOIN 
                levels l ON u.level = l.levid
            WHERE 
                u.status = 'VERIFIED'
            ORDER BY 
                u.name ASC
            LIMIT ? OFFSET ?
        `;
        const [users] = await db.execute(query, [limit, offset]);
        return users;
    }

    static async getTransactionDetailsForUsers(userIds) {
        if (!userIds.length) return [];
        const placeholders = userIds.map(() => '?').join(', '); // Dynamically generate (?, ?, ?)
        const query = `
            SELECT 
                th.uid AS user_id,
                th.cat_id,
                th.coin_type,
                SUM(th.coin) AS total_coin
            FROM 
                transaction_history th
            WHERE 
                th.uid IN (${placeholders})
            GROUP BY 
                th.uid, th.cat_id, th.coin_type
        `;
        const [transactions] = await db.execute(query, userIds); // Pass the array directly
        return transactions;
    }


    static async getTotalVerifiedUsersCount() {
        const query = `SELECT COUNT(*) as total FROM user WHERE status = 'VERIFIED'`;
        const [result] = await db.execute(query);
        return result[0].total;
    }

    static async getAllCategories() {
        const query = 'SELECT id, name FROM categories';
        const [categories] = await db.execute(query);
        return categories;
    }
    




}


module.exports = TransactionHistoryModel;