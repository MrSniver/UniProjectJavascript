const { createAuditLog } = require('../auditlog/auditlogqueries');
const pool = require('../common/initpool')
const bcrypt = require('bcrypt');

async function createUser(username, password, email, nickname = null){
        const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let result = await client.query(`
            INSERT INTO users (username, password_hash, email, nickname, age_verified, created_at, last_modified, banned)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
            `, [username, password, email, nickname, true, new Date().toISOString(), new Date().toISOString(), false]);

        let userId = result.rows[0].id;

        await client.query(`
            INSERT INTO user_roles (user_id, role_id) 
            VALUES ($1, $2)`, [userId, "2b3c4d5e-2222-3333-4444-555566667777"]);

        await client.query('COMMIT');
    } catch (error){
        await client.query('ROLLBACK');
        await createAuditLog(500, 'User Creation Failed', `Failed to create user ${username}: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}

async function getPaymentHistory(userId){
    try {
        let result = await pool.query(`SELECT payed_amount, payment_type, bought_currency, payment_date FROM payment_history WHERE user_id = $1 ORDER BY payment_date DESC`, [userId]);
        return result.rows;
    } catch (error) {
        await createAuditLog(500, "Payment queries", `Get payment history failed: ${error.message}`, userId);
        throw error;
    }
}

async function getUserGameHistory(userId){
    try {
        let result = await pool.query(`SELECT game_type, game_status, won_amount, created FROM game_history WHERE user_id = $1 AND game_status = $2 ORDER BY created DESC`, [userId, 'win']);
        return result.rows;
    } catch (error) {
        await createAuditLog(500, "Game queries", `Get user game history failed: ${error.message}`, userId);
        throw error;
    }
}

async function addPaymentInfo(userId, number, ccv, cardDate, cardHolder){
    try {
        await pool.query(`INSERT INTO payment_info (card_number, ccv, card_date, card_holder, user_id) VALUES ($1, $2, $3, $4, $5)`, [number, ccv, cardDate, cardHolder, userId]);
    } catch (error) {
        await createAuditLog(500, "Payment queries", `Add payment info failed: ${error.message}`, userId);
        throw error;
    }
}

async function changeNickname(userId, newNickname){
    try {
        let existingUser = await pool.query(`SELECT nickname FROM users WHERE nickname = $1 AND id != $2`, [newNickname, userId]);
        if (existingUser.rows.length > 0) {
            throw new Error('Username already exists');
        }

        await pool.query(`UPDATE users SET nickname = $1, last_modified = $2 WHERE id = $3`, [newNickname, new Date().toISOString(), userId]);
    } catch (error) {
        await createAuditLog(500, "User Update", `Change username failed: ${error.message}`, userId);
        throw error;
    }
}

async function changeMail(userId, newEmail){
    try {
        let existingUser = await pool.query(`SELECT email FROM users WHERE email = $1 AND id != $2`, [newEmail, userId]);
        if (existingUser.rows.length > 0) {
            throw new Error('Email already exists');
        }

        await pool.query(`UPDATE users SET email = $1, last_modified = $2 WHERE id = $3`, [newEmail, new Date().toISOString(), userId]);
    } catch (error) {
        await createAuditLog(500, "User Update", `Change email failed: ${error.message}`, userId);
        throw error;
    }
}

async function changePassword(userId, oldPassword, newPassword){
    try {
        let userPassword = await pool.query(`SELECT password_hash FROM users WHERE id=$1`, [userId]);

        if (userPassword.rows.length === 0) {
            throw new Error('User not found');
        }

        if(await bcrypt.compare(oldPassword, userPassword.rows[0].password_hash)){
            let newHashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newHashedPassword, userId]);
        } else {
            throw new Error('Old password does not match');
        }
    } catch (error) {
        await createAuditLog(500, "User Update", `Change password failed: ${error.message}`, userId);
        throw error;
    }
}

async function getUserCurrency(userId){
    try {
        let result = await pool.query(`SELECT currency FROM users WHERE id = $1`, [userId]);
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        return result.rows[0].currency;
    } catch (error) {
        await createAuditLog(500, "User queries", `Get user currency failed: ${error.message}`, userId);
        throw error;
    }
}

async function updateCurrency(userId, amount){
    try {
        if (amount === 0) {
            throw new Error('Amount cannot be zero');
        }

        // Get current currency
        let currentCurrency = await getUserCurrency(userId);
        
        // If amount is negative (losing money), check if user has enough currency
        if (amount < 0 && currentCurrency < Math.abs(amount)) {
            throw new Error('Insufficient currency');
        }

        let result = await pool.query(
            `UPDATE users SET currency = currency + $1, last_modified = $2 WHERE id = $3 RETURNING currency`,
            [amount, new Date().toISOString(), userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        
        return result.rows[0].currency;
    } catch (error) {
        await createAuditLog(500, "User queries", `Update currency failed: ${error.message}`, userId);
        throw error;
    }
}

module.exports = { 
    createUser, 
    getPaymentHistory,
    getUserGameHistory,
    addPaymentInfo,
    changeNickname,
    changeMail,
    changePassword,
    getUserCurrency,
    updateCurrency
};