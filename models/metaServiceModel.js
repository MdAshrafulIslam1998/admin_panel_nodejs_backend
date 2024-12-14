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

    // Fetch meta services with pagination
    static async getPaginatedMetaServices(limit, offset) {
        const query = `
            SELECT service_id, feature_code, type, CAST(content AS CHAR) AS content
            FROM meta_service
            LIMIT ? OFFSET ?
        `;
        const countQuery = `SELECT COUNT(*) AS total FROM meta_service`;

        const [rows] = await db.execute(query, [limit, offset]);
        const [countResult] = await db.execute(countQuery);

        return {
            services: rows,
            total: countResult[0].total,
        };
    }


    static async deleteMetaService(serviceId) {
        const query = `DELETE FROM meta_service WHERE service_id = ?`;
        const [result] = await db.execute(query, [serviceId]);
        return result.affectedRows > 0; // Returns true if deletion was successful
    }
}

module.exports = MetaServiceModel;
