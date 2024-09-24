// models/transactionHistoryModel.js
const db = require('../config/db.config'); // Ensure this points to your db configuration

// Function to fetch all transaction history
async function fetchAllTransactions() {
    const query = 'SELECT * FROM transaction_history';
    const [results] = await db.execute(query);
    return results;
}

module.exports = { fetchAllTransactions };
