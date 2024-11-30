const db = require('../config/db.config');

class MetaServiceModel {
    static async getFeatureByCode(feature_code) {
        const query = 'SELECT service_id, feature_code, type, CAST(content AS CHAR) AS content FROM meta_service WHERE feature_code = ?';
        const [rows] = await db.execute(query, [feature_code]);
        return rows.length ? rows[0] : null;
    }
}

module.exports = MetaServiceModel;
