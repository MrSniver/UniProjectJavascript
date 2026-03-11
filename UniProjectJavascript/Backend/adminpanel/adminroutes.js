const express = require('express');
const router = express.Router();
const { getAllUsers, getUsersFiltered, getUserById, getUserByUsername, changeUserNickname, promoteUserToAdmin,
    banUser, unbanUser, activeBans, allBansList, userBanList, getUserGameHistory, getUserPaymentHisotry } = require('./adminpanelqueries.js');
const authenticateToken = require('../common/middlewares/authmiddleware.js');
const { isAdmin } = require('./adminpanelservices.js')
const { createAuditLog } = require('../../auditlog/auditlogqueries.js');
const httpContext = require('express-http-context');

router.get("/checkadmin", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        const isUserAdmin = await isAdmin();
        res.status(200).json({ 
            isAdmin: isUserAdmin,
            userId: currentUserId
        });
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Check admin status error: ${error.message}`, currentUserId);
        next(error);
    }
});

router.get("/getusers", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()) {
            const users = await getAllUsers();
            res.status(200).json(users);
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Get users error: ${error.message}`, currentUserId);
        next(error);
    }
});

//Paginowany router
router.get("/getpagedusers", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const filter = {};

            console.log(req.query.banned);

            if (req.query.banned !== undefined) {
                filter.banned = req.query.banned === 'true';
            }
    
            if (req.query.age_verified !== undefined) {
                filter.age_verified = req.query.age_verified === 'true';
            }
    
            if (req.query.created_from) {
                filter.created_from = req.query.created_from;
            }
    
            if (req.query.created_before) {
                filter.created_before = req.query.created_before;
            }

            const sort = {};
            if (req.query.sortBy) {
            const [field, order] = req.query.sortBy.split(':');
            sort[field] = order === 'desc' ? -1 : 1;
            }

            const users = await getUsersFiltered(filter);

            const totalUsers = users.length;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const pagedUsers = users.slice(startIndex, endIndex);

            res.status(200).json({
                users: pagedUsers,
                totalPages: Math.ceil(totalUsers / limit),
                currentPage: page,
                totalItems: totalUsers
            });
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Get paged users error: ${error.message}`, currentUserId);
        next(error);
    }
});

router.get("/getuserbyid/:id", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()){
            const userId = req.params.id;
            const user = await getUserById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.json(user);
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Get user by id error: ${error.message}`, currentUserId);
        next(error);
    }
});

router.get("/getusersbyname/:username", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()){
            const username = req.params.username;
            const users = await getUserByUsername(username);
            res.json({ users: users });
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Get users by username error: ${error.message}`, currentUserId);
        next(error);
    }
});

router.get("/activebanlist/:id", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()) {
            const userId = req.params.id;
            let userActiveBans = await activeBans(userId);
            res.status(200).json(userActiveBans);
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Get active ban list error: ${error.message}`, currentUserId);
        next(error);
    }
});

router.get("/userbanlist/:userId", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()) {
            const userId = req.params.userId;
            let result = await userBanList(userId);
            res.status(200).json(result);
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Get user ban list error: ${error.message}`, currentUserId);
        next(error);
    }
});

router.get("/usergamehistory/:id", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()) {
            const userId = req.params.id;
            const { gameType } = req.query;
            let userGameHistory = await getUserGameHistory(userId, gameType);
            res.status(200).json(userGameHistory); 
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Get user game history error: ${error.message}`, currentUserId);
        next(error);
    }
});

router.get("/userpaymenthistory/:id", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()) {
            const userId = req.params.id;
            let userPaymentHistory = await getUserPaymentHisotry(userId);
            res.status(200).json(userPaymentHistory);
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Get user payment history error: ${error.message}`, currentUserId);
        next(error);
    }
})

router.put("/grantadmin", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()) {
            const { userId} = req.body;
            await promoteUserToAdmin(userId);
            res.status(200).json({ message: "User promoted to admin successfully" });
        } else {
            res.status(403).json({ message: "forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Promote user to admin error: ${error.message}`, currentUserId);
        next(error);
    }
})

router.put("/changeusernickname", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()){
            const { userId, newNickname } = req.body;
            await changeUserNickname(userId, newNickname);
            res.status(200).json({ message: "User nickname changed" });
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Change user nickname error: ${error.message}`, currentUserId);
        next(error);
    }
});

router.put("/banuser", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()){
            const { userId, reason, description, banFrom, banTo } = req.body;
            await banUser(userId, reason, description, banFrom, banTo, currentUserId);
            res.status(200).json({ message: `User ${userId} banned successfully` });
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Ban user error: ${error.message}`, currentUserId);
        next(error);
    }
})

router.put("/unbanuser", authenticateToken, async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (await isAdmin()) {
            const { userId } = req.body;
            await unbanUser(userId);
            res.status(200).json({ message: `User ${userId} unbanned successfully` });
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    } catch(error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "Admin panel routers", `Unban user error: ${error.message}`, currentUserId);
        next(error);
    }
});

module.exports = router;