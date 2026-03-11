const express = require('express');
const app = express();
const path = require('path');
const httpContext = require('express-http-context');
const loginRouters = require('./Backend/users/authroutes');
const adminRouters = require('./Backend/adminpanel/adminroutes');      
const paymentRouters = require('./Backend/payments/paymentroutes');    
const userRouters = require('./Backend/users/userroutes');             
const gameRouters = require('./Backend/games/gameroutes');             
const errorMiddleware = require('./Backend/common/middlewares/errormiddleware');
const authMiddleware = require('./Backend/common/middlewares/authmiddleware');
const { createAuditLog } = require('./Backend/auditlog/auditlogqueries');

const PORT = 3000;

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(httpContext.middleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Frontend')));

app.use('/api/auth', loginRouters);

app.get("/", (req, res) => {
    console.log('Root endpoint hit');
    try {
        res.json({ message: "Hello World" });
        console.log('Response sent successfully');
    } catch (error) {
        console.error('Error in root endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/web', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'firststart.html'));
});

app.use(authMiddleware);

app.use("/api/users", userRouters);
app.use("/api/payments", paymentRouters);
app.use("/api/games", gameRouters);
app.use("/api/adminpanel", adminRouters); 

app.use(errorMiddleware);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});