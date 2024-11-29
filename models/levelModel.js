const db = require('../config/db.config'); // Adjust the path as necessary

class LevelModel {
    static async getAllLevels() {
        const query = 'SELECT level_name, level_value, min_thresh, max_thresh, created_by, date FROM levels';
        const [rows] = await db.execute(query);
        return rows;
    }


    static async getLevelById(id) {
        const [rows] = await db.execute(
            'SELECT level_name, level_value, min_thresh, max_thresh, created_by, date FROM levels WHERE levid = ?',
            [id]
        );
        return rows[0];
    }


    static async createLevel(levelData) {
        const { level_name, level_value, min_thresh, max_thresh, created_by } = levelData;
        const [result] = await db.execute(
            'INSERT INTO levels (level_name, level_value, min_thresh, max_thresh, created_by, date) VALUES (?, ?, ?, ?, ?, NOW())',
            [level_name, level_value, min_thresh, max_thresh, created_by]
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
        const { level_name, level_value, min_thresh, max_thresh, created_by } = levelData;
        const [result] = await db.execute(
            'UPDATE levels SET level_name = ?, level_value = ?, min_thresh = ?, max_thresh = ?, created_by = ? WHERE levid = ?',
            [level_name, level_value, min_thresh, max_thresh, created_by, levid]
        );
        return result.affectedRows > 0; // Return true if the level was updated
    }

    static async getUserLevelWithXP(userId) {
        const query = `
            SELECT
                l.level_name,
                l.min_thresh,
                l.max_thresh,
                l.created_by,
                l.date,
                -- Calculate total_primary_coins for the user
                (
                    SELECT COALESCE(SUM(th.coin), 0)
                    FROM transaction_history th
                    WHERE th.uid = u.user_id AND th.coin_type = 'PRIMARY'
                ) AS total_primary_coins,
                -- Calculate XP as a percentage of the level range
                (
                    (
                        (SELECT COALESCE(SUM(th.coin), 0)
                         FROM transaction_history th
                         WHERE th.uid = u.user_id AND th.coin_type = 'PRIMARY') - l.min_thresh
                    ) / (l.max_thresh - l.min_thresh) * 100
                ) AS xp
            FROM
                levels l
            INNER JOIN
                user u
            ON
                u.level = l.levid
            WHERE
                u.user_id = ?
            LIMIT 1`; // Ensure only one record is returned

        const [rows] = await db.execute(query, [userId]);
        if (rows[0]) {
            // Ensure XP is capped between 0 and 100
            rows[0].xp = Math.min(Math.max(rows[0].xp, 0), 100);
        }
        return rows[0] || null; // Return the first record or null if no result
    }





}


module.exports = LevelModel;
