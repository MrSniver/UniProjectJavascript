const express = require('express');
const router = express.Router();
const { createAuditLog } = require('../auditlog/auditlogqueries')
const { getPaymentHistory, getUserGameHistory, addPaymentInfo, changeNickname, changeMail, changePassword, getUserCurrency, updateCurrency } = require('./userqueries')
const httpContext = require('express-http-context');


router.get('/getpaymenthistory', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        let result = await getPaymentHistory(currentUserId);
        return res.status(200).json(result);
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "User router error", `Problem with getting user payment history: ${error.message}`, currentUserId);
        next(error);
    }
});

router.get('/getusergamehistory', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        if (!currentUserId) {
            return res.status(403).json({ message: 'User ID not found in context' });
        }
        let result = await getUserGameHistory(currentUserId);
        return res.status(200).json(result);
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "User router error", `Problem with getting user game history: ${error.message}`, currentUserId);
        next(error);
    }
})

router.get('/getcurrency', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        let currency = await getUserCurrency(currentUserId);
        return res.status(200).json({ currency: currency });
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "User router error", `Problem with getting user currency: ${error.message}`, currentUserId);
        next(error);
    }
});


router.post('/addpayment', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        const { number, ccv, cardDate, cardHolder } = req.body;

        if (!number || !ccv || !cardDate || !cardHolder) {
            return res.status(400).json({ message: "All card details are required" });
        }

        const cleanNumber = number.replace(/\D/g, '');

        var visaRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?)$/;
        var masterCardRegex = /^(?:5[1-5][0-9]{14})$/;

        const isValidCard = visaRegex.test(cleanNumber) || masterCardRegex.test(cleanNumber)

        if (!isValidCard) {
            return res.status(400).json({ message: "Invalid card number" });
        }

        if (ccv.length < 3 || ccv.length > 4) {
            return res.status(400).json({ message: "CCV must be 3 or 4 digits" });
        }

        const dateRegex = /^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/;
        if (!dateRegex.test(cardDate)) {
            return res.status(400).json({ message: "Invalid card date format. Use MM/YY or MM/YYYY" });
        }
        
        await addPaymentInfo(currentUserId, number, ccv, cardDate, cardHolder);
        return res.status(200).json({ message: "Payment info added sccessfully" });
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "User router error", `Problem with adding payment info: ${error.message}`, currentUserId);
        next(error);
    }
});

router.put('/changenickname', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        const { newNickname } = req.body;

        if (!newNickname) {
            return res.status(400).json({ message: "Nickname already exists" });
        }

        await changeNickname(currentUserId, newNickname);
        return res.status(200).json({ message: "Nickname changed successfully"});
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "User router error", `Problem with changing username: ${error.message}`, currentUserId);
        next(error);
    }
});

router.put('/changemail', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        const { newMail } = req.body;

        if (!newMail) {
            return res.status(400).json({ message: "New email is required" });
        }

        let emailRegex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

        if (!emailRegex.test(newMail)) {
            return res.status(400).json({ message: "Invalid email format." });
        }

        await changeMail(currentUserId, newMail);
        return res.status(200).json({ message: "Mail changed successfully" });
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "User router error", `Problem with changing mail: ${error.message}`, currentUserId);
        next(error);
    }
});

router.put('/changepassword', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Both old and new passwords are required" });
        }

        let passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");

        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character." });
        }

        await changePassword(currentUserId, oldPassword, newPassword);
        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(500, "User router error", `Problem with changing password: ${error.message}`, currentUserId);
        next(error);
    }
});

router.put('/updatecurrency', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        const { amount } = req.body;

        if (amount === undefined || amount === null) {
            return res.status(400).json({ message: "Amount is required" });
        }

        if (isNaN(amount) || !Number.isInteger(Number(amount))) {
            return res.status(400).json({ message: "Amount must be a valid integer" });
        }

        if (amount === 0) {
            return res.status(400).json({ message: "Amount cannot be zero" });
        }

        const newCurrency = await updateCurrency(currentUserId, amount);
        
        const action = amount > 0 ? 'added' : 'subtracted';
        const absoluteAmount = Math.abs(amount);
        
        return res.status(200).json({ 
            message: `Currency ${action} successfully`, 
            amountChanged: absoluteAmount,
            newCurrency: newCurrency 
        });
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        if (error.message === 'Insufficient currency') {
            return res.status(400).json({ message: "Insufficient currency to complete this operation" });
        }
        await createAuditLog(500, "User router error", `Problem with updating currency: ${error.message}`, currentUserId);
        next(error);
    }
});

module.exports = router;