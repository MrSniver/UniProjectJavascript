const express = require('express');
const app = express();

console.log('Starting server...');

app.get('/', (req, res) => {
    res.json({ message: "Hello world!" });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Minimal server running on port 3000');
});