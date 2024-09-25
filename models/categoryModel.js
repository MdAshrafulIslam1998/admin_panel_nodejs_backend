const db = require('../config/db.config'); // Adjust the path as necessary

class CategoryModel {
    // Fetch all categories
    static async getAllCategories() {
        const query = 'SELECT id, name, image, created_by FROM categories';
        const [rows] = await db.execute(query);
        return rows;
    }

    static async addCategory(name, image, created_by) {
        const query = `
            INSERT INTO categories (name, image, created_by)
            VALUES (?, ?, ?)
        `;
        const [result] = await db.execute(query, [name, image, created_by]);
        return result;
    }


   
}

module.exports = CategoryModel;
