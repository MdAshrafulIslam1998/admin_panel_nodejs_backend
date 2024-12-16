// models/sliderModel.js
const db = require('../config/db.config');

class SliderModel {
    static async createSlider(sliderData) {
        const { title, subtitle, created_by, send_type, send_to, action, from_date, to_date, slider_index, picture, bgColor } = sliderData;
        const [result] = await db.execute(
            'INSERT INTO sliders (title, subtitle, created_by, send_type, send_to, action, from_date, to_date, slider_index, picture, bgColor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, subtitle, created_by, send_type, send_to, action, from_date, to_date, slider_index, picture, bgColor]
        );
        return result.insertId; // Return the ID of the newly inserted slider
    }

    static async getSliders(limit, offset) {
        const [rows] = await db.execute('SELECT * FROM sliders LIMIT ? OFFSET ?', [limit, offset]);
        return rows;
    }

    static async getSlidersCount() {
        const [rows] = await db.execute('SELECT COUNT(*) AS total FROM sliders');
        return rows[0].total;
    }

    // Method to fetch sliders where send_type is 'ALL'
    static async getAllSlidersWithTypeAll(limit, offset) {
        const [rows] = await db.execute(
            `SELECT * 
             FROM sliders 
             WHERE send_type = "ALL" 
               AND from_date <= NOW() 
               AND to_date >= NOW() 
             ORDER BY from_date DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return rows;
    }

    // Method to get count of sliders where send_type is 'ALL'
    static async getAllSlidersWithTypeAllCount() {
        const [[{ count }]] = await db.execute(
            `SELECT COUNT(*) AS count 
             FROM sliders 
             WHERE send_type = "ALL" 
               AND from_date <= NOW() 
               AND to_date >= NOW()`
        );
        return count;
    }


    // Method to fetch sliders for a specific user by uid
    static async getSlidersForUser(uid, limit, offset) {
        const [rows] = await db.execute(
            `SELECT * 
             FROM sliders 
             WHERE send_to = ? 
               AND from_date <= NOW() 
               AND to_date >= NOW() 
             ORDER BY from_date DESC 
             LIMIT ? OFFSET ?`,
            [uid, limit, offset]
        );
        return rows;
    }


    // Method to get count of sliders for a specific user by uid
    static async getSlidersForUserCount(uid) {
        const [[{ count }]] = await db.execute(
            `SELECT COUNT(*) AS count 
             FROM sliders 
             WHERE send_to = ? 
               AND from_date <= NOW() 
               AND to_date >= NOW()`,
            [uid]
        );
        return count;
    }


    // Delete a slider by ID
    static async deleteSliderById(sliderId) {
        const query = 'DELETE FROM sliders WHERE id = ?';
        const [result] = await db.execute(query, [sliderId]);
        return result.affectedRows > 0; // Returns true if a row was deleted
    }


}

module.exports = SliderModel;
