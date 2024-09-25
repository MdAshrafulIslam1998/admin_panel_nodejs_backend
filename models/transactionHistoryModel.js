const db = require('../config/db.config'); // Adjust the path as necessary

class TransactionHistoryModel {
    static async getAllTransactions() {
        const query = 'SELECT * FROM transaction_history';
        const [rows] = await db.execute(query);
        return rows;
    }

    // Add more methods as needed (update, fetch by user ID, etc.)
}

module.exports = TransactionHistoryModel;
