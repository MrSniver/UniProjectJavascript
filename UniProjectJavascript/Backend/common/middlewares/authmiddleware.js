//Middleware do autoryzacji uzytkownika httpcontext ustawia przy autoryzacji userid i username w kontekscie
require('dotenv').config();
const jwt = require('jsonwebtoken');
const httpContext = require('express-http-context');

function authenticateToken(req, res, next) {
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
        req.user = decoded;
        httpContext.set('userId', decoded.userId);
        httpContext.set('username', decoded.username);
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    };
}

module.exports = authenticateToken;