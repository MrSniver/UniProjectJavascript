const pool = require('../common/initpool');
const { createAuditLog } = require('../auditlog/auditlogqueries');

async function paymentOperation(userId, payedAmount, currencyAmount){
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const userPaymentInfo = await client.query(`SELECT card_number, ccv, card_date, card_holder FROM payment_info WHERE user_id = $1`, [userId]);
        if(userPaymentInfo.rows.length === 0){
            throw new Error('No payment information found for the user.');
        }

        const cleanNumber = userPaymentInfo.rows[0].card_number.replace(/\D/g, '');

        var visaRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?)$/;
        var masterCardRegex = /^(?:5[1-5][0-9]{14})$/;

        const isValidCard = visaRegex.test(cleanNumber) || masterCardRegex.test(cleanNumber)

        if (!isValidCard) {
            return res.status(400).json({ message: "Invalid card number" });
        }

        if(isValidCard) {
            await client.query(`UPDATE users SET currency = currency + $1 WHERE id = $2`, [currencyAmount, userId]);
            await client.query(`INSERT INTO payment_history (user_id, payed_amount, payment_type, bought_currency, payment_date) VALUES ($1, $2, $3, $4, NOW())`, 
                [userId, payedAmount, 'card', currencyAmount]);
                
            await client.query('COMMIT');
        }
    } catch (error) {
        await client.query('ROLLBACK');
        await createAuditLog(500, "Payment queries", `Payment operation failed: ${error.message}`, userId);
        throw error;
    } finally {
        client.release();
    }
}

async function editPaymentMethod(userId, paymentData) {
    const client = await pool.connect();
    try {
        const { number, ccv, cardDate, cardHolder } = paymentData;
        
        // Clean the card number
        const cleanNumber = number.replace(/\D/g, '');
        
        // Validate card number
        const visaRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?)$/;
        const masterCardRegex = /^(?:5[1-5][0-9]{14})$/;
        const isValidCard = visaRegex.test(cleanNumber) || masterCardRegex.test(cleanNumber);
        
        if (!isValidCard) {
            throw new Error('Invalid card number');
        }
        
        // Update payment information
        const result = await client.query(
            `UPDATE payment_info SET card_number = $1, ccv = $2, card_date = $3, card_holder = $4 WHERE user_id = $5`,
            [cleanNumber, ccv, cardDate, cardHolder, userId]
        );
        
        if (result.rowCount === 0) {
            throw new Error('No payment information found for this user');
        }
        
        await createAuditLog(userId, 'PAYMENT_METHOD_UPDATED', `Payment method updated for user ${userId}`, userId);
        return { message: 'Payment method updated successfully' };
        
    } catch (error) {
        await createAuditLog(userId, 'PAYMENT_METHOD_UPDATE_FAILED', `Failed to update payment method: ${error.message}`, userId);
        throw error;
    } finally {
        client.release();
    }
}

async function deletePaymentMethod(userId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `DELETE FROM payment_info WHERE user_id = $1`,
            [userId]
        );
        
        if (result.rowCount === 0) {
            throw new Error('No payment information found for this user');
        }
        
        await createAuditLog(userId, 'PAYMENT_METHOD_DELETED', `Payment method deleted for user ${userId}`, userId);
        return { message: 'Payment method deleted successfully' };
        
    } catch (error) {
        await createAuditLog(userId, 'PAYMENT_METHOD_DELETE_FAILED', `Failed to delete payment method: ${error.message}`, userId);
        throw error;
    } finally {
        client.release();
    }
}

async function getPaymentMethods(userId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT card_number, card_date, card_holder FROM payment_info WHERE user_id = $1`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return { cards: [] };
        }
        
        // Format the card data for frontend
        const cardData = result.rows[0];
        const maskedNumber = `****${cardData.card_number.slice(-4)}`;
        const cardType = cardData.card_number.startsWith('4') ? 'Visa' : 'Mastercard';
        
        const formattedCard = {
            id: 1, // Since we only store one card per user
            holder: cardData.card_holder,
            number: maskedNumber,
            expiry: cardData.card_date,
            type: cardType,
            fullNumber: cardData.card_number
        };
        
        await createAuditLog(userId, 'PAYMENT_METHODS_RETRIEVED', `Payment methods retrieved for user ${userId}`, userId);
        return { cards: [formattedCard] };
        
    } catch (error) {
        await createAuditLog(userId, 'PAYMENT_METHODS_RETRIEVAL_FAILED', `Failed to retrieve payment methods: ${error.message}`, userId);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    paymentOperation,
    editPaymentMethod,
    deletePaymentMethod,
    getPaymentMethods
};