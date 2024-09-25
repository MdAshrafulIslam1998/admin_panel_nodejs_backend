const db = require('../config/db.config'); // Adjust the path as necessary

class LevelModel {
    static async getAllLevels() {
        const [rows] = await db.execute('SELECT * FROM levels');
        return rows;
    }

    static async getLevelById(id) {
        const [rows] = await db.execute('SELECT * FROM levels WHERE id = ?', [id]);
        return rows[0];
    }

    static async createLevel(levelData) {
        const { level_name, level_value, created_by } = levelData;
        const [result] = await db.execute(
            'INSERT INTO levels (level_name, level_value, created_by, date) VALUES (?, ?, ?, NOW())',
            [level_name, level_value, created_by]
        );
        return result.insertId; // Return the ID of the newly inserted level
    }


    

    // Add more methods as needed (update, delete, etc.)
}

module.exports = LevelModel;
