const http = require('http');
const PORT = 3000;

console.log('='.repeat(60));
console.log('🚀 SIMPLE PORT TEST SERVER STARTING');
console.log('='.repeat(60));

// Create the simplest possible server
const server = http.createServer((req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] Request: ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        success: true, 
        message: 'Simple server working!',
        time: new Date().toISOString(),
        port: PORT
    }));
});

// Try to listen
try {
    server.listen(PORT, '127.0.0.1', () => {
        console.log(`✅ SERVER IS ACTUALLY LISTENING on http://127.0.0.1:${PORT}`);
        console.log(`✅ PID: ${process.pid}`);
        console.log('='.repeat(60));
        
        // Test ourselves immediately
        const testReq = http.request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/',
            method: 'GET'
        }, (testRes) => {
            console.log(`✅ Self-test: Server responded (Status: ${testRes.statusCode})`);
        });
        testReq.on('error', (e) => {
            console.error(`❌ Self-test failed: ${e.message}`);
        });
        testReq.end();
    });
} catch (error) {
    console.error('❌ FATAL ERROR in server.listen():', error.message);
    process.exit(1);
}

// Handle errors
server.on('error', (error) => {
    console.error('❌ SERVER ERROR:', error.message);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is in use!`);
    }
});

// Keep-alive
setInterval(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Server heartbeat - PID: ${process.pid}`);
}, 5000);
