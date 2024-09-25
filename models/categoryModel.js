const db = require('../config/db.config'); // Adjust the path as necessary

class CategoryModel {
    // Fetch all categories
    static async getAllCategories() {
        const query = 'SELECT id, name, image, created_by FROM categories';
        const [rows] = await db.execute(query);
        return rows;
    }

   
}

module.exports = CategoryModel;
