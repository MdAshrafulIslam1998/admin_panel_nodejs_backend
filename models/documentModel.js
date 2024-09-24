const db = require('../config/db.config'); // Adjust the path as necessary

class DocumentModel {
    static async getAllDocuments() {
        const [rows] = await db.execute('SELECT * FROM documents');
        return rows;
    }

    static async getDocumentById(id) {
        const [rows] = await db.execute('SELECT * FROM documents WHERE id = ?', [id]);
        return rows[0];
    }

    static async createDocument(documentData) {
        const { doc_type, uid, path } = documentData;
        const [result] = await db.execute(
            'INSERT INTO documents (doc_type, uid, path) VALUES (?, ?, ?)',
            [doc_type, uid, path]
        );
        return result.insertId; // Return the ID of the newly inserted document
    }

    // Add more methods as needed (update, delete, etc.)
}

module.exports = DocumentModel;
