const express = require('express');
const router = express.Router();
const { paymentOperation, editPaymentMethod, deletePaymentMethod, getPaymentMethods } = require('./paymentsqueries');
const httpContext = require('express-http-context');
const { createAuditLog } = require('../auditlog/auditlogqueries');

router.get('/getpayments', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        
        const result = await getPaymentMethods(currentUserId);
        return res.status(200).json(result);
        
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(currentUserId, 'PAYMENT_GET_FAILURE', `Payment retrieval failed: ${error.message}`, currentUserId);
        next(error);
    }
});

router.post('/pay', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        const { payedAmount, currencyAmount } = req.body;
        await paymentOperation(currentUserId, payedAmount, currencyAmount);

        return res.status(200).json({ message: 'Payment successful' });
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(currentUserId, 'PAYMENT_FAILURE', `Payment failed: ${error.message}`, currentUserId);
        next(error);
    }
});

router.put('/editpayment', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        const { number, ccv, cardDate, cardHolder } = req.body;
        
        if (!number || !ccv || !cardDate || !cardHolder) {
            return res.status(400).json({ message: 'All payment fields are required' });
        }
        
        const result = await editPaymentMethod(currentUserId, req.body);
        return res.status(200).json(result);
        
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(currentUserId, 'PAYMENT_EDIT_FAILURE', `Payment edit failed: ${error.message}`, currentUserId);
        next(error);
    }
});

router.delete('/deletepayment', async (req, res, next) => {
    try {
        const currentUserId = httpContext.get('userId');
        
        const result = await deletePaymentMethod(currentUserId);
        return res.status(200).json(result);
        
    } catch (error) {
        const currentUserId = httpContext.get('userId');
        await createAuditLog(currentUserId, 'PAYMENT_DELETE_FAILURE', `Payment delete failed: ${error.message}`, currentUserId);
        next(error);
    }
});

module.exports = router;