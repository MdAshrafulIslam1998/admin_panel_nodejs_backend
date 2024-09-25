const db = require('../config/db.config'); // Adjust the path as necessary

class LevelModel {
    static async getAllLevels() {
        const query = 'SELECT level_name, level_value, created_by, date FROM levels';
        const [rows] = await db.execute(query);
        return rows;
    }

    static async getLevelById(id) {
        const [rows] = await db.execute('SELECT level_name, level_value, created_by, date FROM levels WHERE levid = ?', [id]);
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

// models/LevelModel.js
    static async deleteLevelById(levid) {
        const query = 'DELETE FROM levels WHERE levid = ?';
        const [result] = await db.execute(query, [levid]);
        return result.affectedRows > 0; // Returns true if the deletion was successful
    }


    static async updateLevel(levid, levelData) {
        const { level_name, level_value, created_by } = levelData;
        const [result] = await db.execute(
          'UPDATE levels SET level_name = ?, level_value = ?, created_by = ? WHERE levid = ?',
          [level_name, level_value, created_by, levid]
        );
        return result.affectedRows > 0; // Return true if the level was updated
      }
      

}

module.exports = LevelModel;
