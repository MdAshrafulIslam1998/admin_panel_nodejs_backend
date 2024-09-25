// models/documentModel.js
const db = require('../config/db.config');

class DocumentModel {
    // Fetch all documents for a given user
    static async getDocumentsByUserId(uid) {
        const [rows] = await db.execute('SELECT doc_type, path FROM documents WHERE uid = ?', [uid]);
        return rows;
    }

    static async getAllDocuments(uid) {
        const [rows] = await db.execute('SELECT * FROM documents WHERE uid = ?', [uid]);
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

    // Additional methods can be added as needed (update, delete, etc.)
}

module.exports = DocumentModel;
