const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ message: 'Server is working!', time: new Date().toISOString() });
});

const PORT = 3000;
const server = app.listen(PORT, '127.0.0.1', () => {
    console.log('='.repeat(60));
    console.log(`✅ SERVER RUNNING on http://127.0.0.1:${PORT}`);
    console.log(`✅ Test endpoint: http://127.0.0.1:${PORT}/api/test`);
    console.log('='.repeat(60));
});

// Keep-alive logging
setInterval(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Server alive`);
}, 10000);