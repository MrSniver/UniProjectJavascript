require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { createUser } = require('./userqueries');
const { createAuditLog } = require('../auditlog/auditlogqueries');
const pool = require('../common/initpool')
const authenticateToken = require('../common/middlewares/authmiddleware');

const accessTokenSecret=process.env.ACCESS_SECRET;
const refreshTokenSecret=process.env.REFRESH_SECRET;

var refreshTokens = [];

//Rejestracja uzytkownika
router.post("/register", async (req, res, next) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ message: "Nazwa użytkownika, hasło i email są wymagane." });
    }

    try {
        let user = await pool.query(`SELECT username, email FROM users WHERE username=$1 OR email=$2`,
            [username, email]);

        if (user.rows.length > 0) {
            return res.status(400).json({ message: "Nazwa użytkownika lub mail już są zajęte." });
        }

        let passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Hasło musi mieć co najmniej 8 znaków i zawierać wielką literę, małą literę, cyfrę oraz znak specjalny." });
        }

        let emailRegex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Zły format mail." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await createUser(username, hashedPassword, email);
        res.status(201).json({ message: "Użytkownik został utworzony pomyślnie." });
    } catch (error) {
        createAuditLog('500', 'User registration failed', error.message);
        console.log('Could not create user: ', error);
        next(error);
    }
});

//Logowanie uzytkownika
router.post("/login", async (req, res, next) => {
    const {username, password} = req.body;
    const client = await pool.connect();

    if (!username || !password) {
        return res.status(400).json({ message: "Nazwa użytkownika i hasło są wymagane." });
    }

    try {
        await client.query('BEGIN');
        let user = await client.query(`SELECT id, username, password_hash, banned FROM users WHERE username=$1`,
            [username]);

        if (user.rows.length > 0 && await bcrypt.compare(password, user.rows[0].password_hash)){
            if(user.rows[0].banned) {
                let banInfo = await client.query(`Select id, reason, description, ban_from, ban_to FROM ban_list WHERE user_id=$1 AND is_deleted=$2 ORDER BY ban_to DESC LIMIT 1`,
                [user.rows[0].id, false]);
                let currentTime = new Date().toISOString();
                console.log(currentTime);
                console.log(banInfo.rows);
                if (banInfo.rows.length > 0) {
                    let banTo = new Date(banInfo.rows[0].ban_to).toISOString();
                    if(banTo > currentTime) {
                        await client.query('ROLLBACK');
                        return res.status(403).json({ 
                            message: "Twoje konto zostało zbanowane.",
                            reason: banInfo.rows[0].reason,
                            description: banInfo.rows[0].description,
                            ban_from: banInfo.rows[0].ban_from,
                            ban_to: banInfo.rows[0].ban_to
                        });
                    } else {
                        await client.query(`UPDATE users SET banned=false WHERE id=$1`, [user.rows[0].id]);
                        await client.query(`UPDATE ban_list SET is_deleted=true WHERE id=$1`, [banInfo.rows[0].id]);
                    }
                }
            }

            const accessToken = jwt.sign({ 
                userId: user.rows[0].id, 
                username: user.rows[0].username
             }, accessTokenSecret, { expiresIn: '30m' });

            const refreshToken = jwt.sign({ 
                userId: user.rows[0].id,
                username: user.rows[0].username
             }, refreshTokenSecret, { expiresIn: '7d' });
            refreshTokens.push(refreshToken);
            console.log(refreshTokens);

            await client.query('COMMIT');
            res.json( { accessToken, refreshToken });

        }
        else {
            await client.query('ROLLBACK');
            await createAuditLog('401', 'Failed login attempt', `Username: ${username}`);
            return res.status(401).json({ message: "Nieprawidłowa nazwa użytkownika lub hasło." });
        }
        
    } catch (error) {
        await client.query('ROLLBACK');
        await createAuditLog('500', 'User login failed', error.message);
        next(error);
    } finally {
        client.release();
    }
});



//Refresh tokena
router.post("/refresh", authenticateToken, (req, res, next) => {
    const { token } = req.body;
    
    if (!token || !refreshTokens.includes(token)) {
        createAuditLog('403', 'Invalid refresh token attempt', 'Token not recognized');
        return res.status(403).json({ message: "Token odświeżania jest nieprawidłowy." });
    }

    try {
        const user = jwt.verify(token, refreshTokenSecret);
        const accessToken = jwt.sign({
            userId: user.id,
            username: user.username
        }, accessTokenSecret, { expiresIn: '30m' });

        res.json({ accessToken });
    } catch (error) {
        createAuditLog('500', 'Refresh token failed', error.message);
        next(error);
    }
});

//Wylogowywanie użytkownika
router.post("/logout", authenticateToken , (req, res, next) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter((t) => t !== token);
    console.log(refreshTokens);
    res.json({ message: "Użytkownik został wylogowany pomyślnie." });
})


module.exports = router;