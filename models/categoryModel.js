const db = require('../config/db.config'); // Adjust the path as necessary

class CategoryModel {
    // Fetch all categories
    static async getAllCategories() {
        const query = 'SELECT id, name, image, created_by, bgcolor FROM categories';
        const [rows] = await db.execute(query);
        return rows;
    }

    static async addCategory(name, image, created_by, bgcolor) {
        const query = `
            INSERT INTO categories (name, image, created_by, bgcolor)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [name, image, created_by, bgcolor]);
        return result;
    }


    static async updateCategory(id, name, image, created_by, bgcolor) {
        const query = `
            UPDATE categories 
            SET name = ?, image = ?, created_by = ?, bgcolor = ? 
            WHERE id = ?
        `;
        const [result] = await db.execute(query, [name, image, created_by, bgcolor, id]);
        return result;
    }


    static async deleteCategory(id) {
        const query = 'DELETE FROM categories WHERE id = ?';
        const [result] = await db.execute(query, [id]);
        return result;
    }


    static async getPaginatedCategories(limit, offset) {
        const query = `
            SELECT id, name, image, created_by, bgcolor
            FROM categories 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(query, [limit, offset]);
        return rows;
    }


    static async getTotalCategories() {
        const query = 'SELECT COUNT(*) as total FROM categories';
        const [rows] = await db.execute(query);
        return rows[0].total;
    }





}

module.exports = CategoryModel;
