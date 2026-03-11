const pool = require("../common/initpool");
const { createAuditLog } = require("../../auditlog/auditlogqueries");

const usersJoins = ``

//Query do wszystkich uzytkownikow
async function getAllUsers() {
    try {
        let result = await pool.query(`SELECT id, username, email, nickname, age_verified, created_at, currency, banned FROM users`);
        return result.rows;
    }
    catch (error) {
        await createAuditLog(500, "Admin panel queries", `Getting all users error: ${error.message}`);
        throw error;
    }
}

//Filtrowanie do paginacji uzytkownikow
async function getUsersFiltered(filterParams = {}) {
    try {
        let query = `SELECT id, username, email, nickname, age_verified, created_at, currency, banned FROM users `;
        let paramIndex = 1;
        let where = ``;
        let fromDate= "";
        let beforeDate= "";
        const conditions = [];
        let params = [];

        if (filterParams.age_verified != undefined) {
            conditions.push(` age_verified = $${paramIndex}`);
            params.push(filterParams.age_verified);
            paramIndex++;
        }
        if (filterParams.created_from != null) {
            conditions.push(`created_at >= $${paramIndex}`);
            fromDate = new Date(filterParams.created_from);
            params.push(fromDate.toISOString());
            paramIndex++;
        }
        if (filterParams.created_before != null) {
            conditions.push(`created_at <= $${paramIndex}`);
            beforeDate = new Date(filterParams.created_before);
            params.push(beforeDate.toISOString());
            paramIndex++
        }
        if (filterParams.banned != null) {
            conditions.push(`banned = $${paramIndex}`);
            params.push(filterParams.banned);
            paramIndex++
        }
        if (filterParams.username != null && filterParams.username.trim() !== '') {
            conditions.push(`(username ILIKE $${paramIndex} OR nickname ILIKE $${paramIndex})`);
            params.push(`%${filterParams.username}%`);
            paramIndex++
        }

        if (conditions.length > 0) {
            where = `WHERE ` + conditions.join(` AND `)
        }

        let finalQuery = query + where;
        let result = await pool.query(finalQuery, params);
        console.log(finalQuery, params);
        return result.rows;
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Getting filtered users error: ${error.message}`);
        throw error;
    }
}

//Query do uzytkownika po ID
async function getUserById(userId) {
    try {
        let result = await pool.query(`SELECT id, username, email, nickname, age_verified, created_at, currency, banned FROM users WHERE id = $1`, [userId]);
        if (result.rows.length === 0) {
            return null; // Return null instead of undefined when user not found
        }
        return result.rows[0];
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Getting user by ID error: ${error.message}`);
        throw error;
    }
}

//Query do uzytkownika po nazwie
async function getUserByUsername(username) {
    try {
        // First try exact match
        let result = await pool.query(`SELECT id, username, email, nickname, age_verified, created_at, currency, banned FROM users WHERE username = $1 OR nickname = $1`, [username]);
        
        // If no exact match found, try case-insensitive exact match
        if (result.rows.length === 0) {
            result = await pool.query(`SELECT id, username, email, nickname, age_verified, created_at, currency, banned FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(nickname) = LOWER($1)`, [username]);
        }
        
        // If still no match, try partial match as fallback
        if (result.rows.length === 0) {
            result = await pool.query(`SELECT id, username, email, nickname, age_verified, created_at, currency, banned FROM users WHERE username ILIKE $1 OR nickname ILIKE $1`, [`%${username}%`]);
        }
        
        return result.rows;
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Getting user by username error: ${error.message}`);
        throw error;
    }
}

//Zmiana nicku użytkownika, jeżeli by był nieodpowiedni (Działanie admina)
async function changeUserNickname(userId, newNickname) {
    try {
        await pool.query(`UPDATE users SET nickname = $1 WHERE id = $2`, [newNickname, userId]);
        await createAuditLog(200, "Admin panel queries", "Changed user nickname", `User ID: ${userId}, New Nickname: ${newNickname}`);
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Changing user nickname error: ${error.message}`);
        throw error;
    }
}

//Zmiana roli użytkownika na admina
async function promoteUserToAdmin(userId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let adminId = await client.query(`SELECT id FROM roles WHERE name = $1`, ['admin']);
        adminId = adminId.rows[0].id;
        await client.query(`UPDATE user_roles SET role_id = $1 WHERE user_id = $2`, [adminId, userId]);

        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK');
        await createAuditLog(500, "Admin panel queries", `Promoting user to admin error for user: ${error.message}`)
        throw error;
    } finally {
        client.release();
    }
}

//Banowanie użytkownika, transakcja tutaj ustawia ban w tabeli users i pozniej dodaje ban do tabeli ban_lists
async function banUser(userId, reason, description, banFrom = new Date().toISOString(), banTo, createdBy){
    const client = await pool.connect();
    try {
        await client.query('BEGIN') 

        await client.query(`UPDATE users SET banned = $1 WHERE id = $2`, [true, userId]);
        await client.query(`INSERT INTO ban_list (user_id, reason, description, ban_from, ban_to, created_by) VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, reason, description, banFrom, banTo, createdBy]);

        await client.query('COMMIT');  
    } catch (error) {
        await client.query('ROLLBACK');
        await createAuditLog(500, "Admin panel queries", `Banning user error: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}

//Odbanowywanie użytkownika, tutaj nie chcemy usuwac bana z tabeli, bo potrzebujemy ich do dawania historii banow dla uzytkownika
async function unbanUser(userId){
    const client = await pool.connect();
    try {
        await client.query('BEGIN')
        await client.query(`UPDATE users SET banned = $1 WHERE id = $2`, [false, userId])
        await client.query(`UPDATE ban_list SET is_deleted = $1 WHERE user_id = $2 AND is_deleted = $3`, [true, userId, false]);

        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK');
        await createAuditLog(500, "Admin panel queries", `Unbanning user error: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}

//Pobieranie historii banów użytkownika
async function userBanList(userId){
    try {
        let result = await pool.query(`SELECT reason, description, ban_from, ban_to, created_by FROM ban_list WHERE user_id = $1`, [userId]);
        return result.rows;
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Getting user ban list error: ${error.message}`);
        throw error;
    }
}

//Pobieranie aktywnych banów dla wszystkich uzytkownikow
async function activeBans(userId){
    try {
        let result = await pool.query(`SELECT users.username, ban_list.reason, ban_list.description, ban_list.ban_from, ban_list.ban_to, ban_list.created_by 
            FROM ban_list 
            INNER JOIN users ON ban_list.user_id = users.id
            WHERE ban_list.is_deleted = $1 AND ban_list.user_id = $2`, [false, userId]);
        return result.rows;
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Error getting active bans: ${error.message}`);
        throw error;
    }
}

async function allBansList(){
    try {
        let result = await pool.query(`SELECT reason, description, ban_from, ban_to, created_by, is_deleted FROM ban_list`);
        return result.rows;
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Error getting all bans: ${error.message}`);
        throw error;
    }
}

//Pobieranie historii gier uzytkownika
async function getUserGameHistory(userId, gameType) {
    try {
        let query = `SELECT game_type, game_status, won_amount, created FROM game_history WHERE user_id = $1`;
        let params = [userId];
        if (gameType == 'roulette'){
            query += ` AND game_type = $2`;
            params.push(gameType);
        } else if (gameType == 'blackjack'){
            query += ` AND game_type = $2`;
            params.push(gameType);
        } else if (gameType == 'slots'){
            query += ` AND game_type = $2`;
            params.push(gameType);
        }
        const result = await pool.query(query, params);
        console.log(query, params);
        return result.rows;
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Getting user game history error: ${error.message}`);
        throw error;
    }
}

//Pobieranie historii płatności użytkownika
async function  getUserPaymentHisotry(userId) {
    try {
        let result = await pool.query(`SELECT  payed_amount, payment_type, bought_currency, payment_date FROM payment_history WHERE user_id = $1`, [userId]);
        return result.rows;
    } catch (error) {
        await createAuditLog(500, "Admin panel queries", `Getting user payment history error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getAllUsers,
    getUsersFiltered,
    getUserById,
    getUserByUsername,
    changeUserNickname,
    promoteUserToAdmin,
    banUser,
    unbanUser,
    userBanList,
    activeBans,
    allBansList,
    getUserGameHistory,
    getUserPaymentHisotry
}