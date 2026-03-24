const pool = require('../common/initpool');
const authenticateToken = require('../common/middlewares/authmiddleware');
const httpContext = require('express-http-context');
const { createAuditLog } = require('../../auditlog/auditlogqueries')

async function isAdmin() {
    const userId = httpContext.get('userId');
    try {
        const roleAdminId = await pool.query(`SELECT id FROM roles WHERE name = $1`, ['admin']);
        const userRoleId = await pool.query(`SELECT role_id FROM user_roles WHERE user_id = $1`, [userId])
        
        if (roleAdminId.rows.length === 0 || userRoleId.rows.length === 0) {
            return false;
        }

        return userRoleId.rows[0].role_id === roleAdminId.rows[0].id;
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Error checking user for admin role: ${error.message}`);
        throw error;
    }
}

module.exports = { isAdmin };