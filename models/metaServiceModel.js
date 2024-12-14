const db = require('../config/db.config');

class MetaServiceModel {
    static async getFeatureByCode(feature_code) {
        const query = 'SELECT service_id, feature_code, type, CAST(content AS CHAR) AS content FROM meta_service WHERE feature_code = ?';
        const [rows] = await db.execute(query, [feature_code]);
        return rows.length ? rows[0] : null;
    }

    static async addMetaService(featureCode, type, content) {
        const query = `
            INSERT INTO meta_service (feature_code, type, content) 
            VALUES (?, ?, ?)
        `;
        const [result] = await db.execute(query, [featureCode, type, content]);
        return {
            service_id: result.insertId,
            feature_code: featureCode,
            type,
            content,
        };
    }
}

module.exports = MetaServiceModel;
