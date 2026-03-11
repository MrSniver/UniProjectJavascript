const express = require('express');
const router = express.Router();
const { createGameHistory } = require('./gamequeries');
const { createAuditLog } = require('../auditlog/auditlogqueries');
const httpContext = require('express-http-context');


//Przykladowy router na tworzenie historii gier, do waszych gier bedziecie mozliwe musieli dodac swoje wlasne routery
router.post('/history', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        const { gameType, gameStatus, wonAmount } = req.body;

        if (gameType == null || gameStatus == null || wonAmount == null) {
            return res.status(400).json({ message: 'Game type, game status and won amount must be specified' });
        }

        await createGameHistory(currentUserId, gameType, gameStatus, wonAmount);
        res.status(201).json({ message: 'Game history created successfully' });
    } catch(error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Game routes error", `Error creating game history: ${error.message}`, currentUserId);
        next(error);
    }
})

module.exports = router;