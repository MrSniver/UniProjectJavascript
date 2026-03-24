const pool = require('../common/initpool');
const { createAuditLog } = require('../auditlog/auditlogqueries');

async function createGameHistory(userId, gameType, gameStatus, wonAmount) {
    try {
        await pool.query(`INSERT INTO game_history (user_id, game_type, game_status, won_amount, created) VALUES ($1, $2, $3, $4, NOW())`,
            [userId, gameType, gameStatus, wonAmount]);
    } catch (error) {
        await createAuditLog(500, "Game history error", `Error creating game history: ${error.message}`, userId);
        throw error;
    }
}

module.exports = {
    createGameHistory
}