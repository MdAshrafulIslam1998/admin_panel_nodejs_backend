// models/templateModel.js
const db = require('../config/db.config');
const { v4: uuidv4 } = require('uuid'); // For generating unique UIDs

class TemplateModel {
    // Fetch all message templates
    static async getAllTemplates() {
        const query = `
            SELECT 
                t.uid, t.title, t.description, t.category_id, t.create_date, t.created_by,
                c.name AS category_name
            FROM templates t
            LEFT JOIN categories c ON t.category_id = c.id
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    // Add a new message template
    static async addTemplate(title, description, categoryId, createdBy) {
        const query = `
            INSERT INTO templates (title, uid, description, category_id, create_date, created_by)
            VALUES (?, ?, ?, ?, NOW(), ?)
        `;
        const uid = uuidv4(); // Generate a unique UID
        const [result] = await db.execute(query, [title, uid, description, categoryId, createdBy]);
        return { id: result.insertId, title, uid, description, categoryId, createdBy };
    }

    // Fetch templates by category
    static async getTemplatesByCategoryId(categoryId) {
        const query = `
            SELECT 
                t.uid, t.title, t.description, t.category_id, t.create_date, t.created_by,
                c.name AS category_name
            FROM templates t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.category_id = ?
        `;
        const [rows] = await db.execute(query, [categoryId]);
        return rows;
    }
    // Edit a message template
    // Update templateModel.js
    static async updateTemplateByUid(uid, title, description, categoryId) {
        const query = `
        UPDATE templates 
        SET title = ?, description = ?, category_id = ? 
        WHERE uid = ?
    `;
        const [result] = await db.execute(query, [title, description, categoryId, uid]);
        return result.affectedRows > 0;
    }

    // Delete a message template
    // Update templateModel.js
    static async deleteTemplateByUid(uid) {
        const query = `DELETE FROM templates WHERE uid = ?`;
        const [result] = await db.execute(query, [uid]);
        return result.affectedRows > 0;
    }

}

module.exports = TemplateModel;
