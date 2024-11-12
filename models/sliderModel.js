// models/sliderModel.js
const db = require('../config/db.config');

class SliderModel {
    static async createSlider(sliderData) {
        const { title, subtitle, created_by, send_type, send_to, action, from_date, to_date, slider_index, picture } = sliderData;
        const [result] = await db.execute(
            'INSERT INTO sliders (title, subtitle, created_by, send_type, send_to, action, from_date, to_date, slider_index, picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, subtitle, created_by, send_type, send_to, action, from_date, to_date, slider_index, picture]
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
            'SELECT * FROM sliders WHERE send_type = "ALL" LIMIT ? OFFSET ?', 
            [limit, offset]
        );
        return rows;
    }

    // Method to get count of sliders where send_type is 'ALL'
    static async getAllSlidersWithTypeAllCount() {
        const [rows] = await db.execute('SELECT COUNT(*) AS total FROM sliders WHERE send_type = "ALL"');
        return rows[0].total;
    }

    // Method to fetch sliders for a specific user by uid
    static async getSlidersForUser(uid, limit, offset) {
        const [rows] = await db.execute(
            'SELECT * FROM sliders WHERE send_to = ? LIMIT ? OFFSET ?', 
            [uid, limit, offset]
        );
        return rows;
    }

    // Method to get count of sliders for a specific user by uid
    static async getSlidersForUserCount(uid) {
        const [rows] = await db.execute('SELECT COUNT(*) AS total FROM sliders WHERE send_to = ?', [uid]);
        return rows[0].total;
    }


}

module.exports = SliderModel;
