const pool = require('../common/initpool')

async function createAuditLog(status, event, error = null, createdBy = "00000000-0000-0000-0000-000000000000") {
    try {
        await pool.query(`
            INSERT INTO audit_log (status, event, error, created, created_by)
            VALUES ($1, $2, $3, $4, $5)
            `, [status, event, error, new Date().toISOString(), createdBy]);
    } catch (error) {
        console.error('Error creating audit log:', error);
    }
}

module.exports = { createAuditLog };
