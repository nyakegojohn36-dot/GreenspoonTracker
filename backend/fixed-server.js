const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Database setup with error handling
const dbPath = path.join(__dirname, '..', 'database', 'greenspoon.db');
console.log('Database path:', dbPath);

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created database directory');
}

// Create database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        
        // Create tables
        db.run(`
            CREATE TABLE IF NOT EXISTS boxes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                box_number TEXT UNIQUE NOT NULL,
                box_type TEXT NOT NULL,
                status TEXT DEFAULT 'available'
            )
        `, (err) => {
            if (err) {
                console.error('❌ Table creation error:', err.message);
            } else {
                console.log('✅ Boxes table ready');
            }
        });
    }
});

// =========== SIMPLE API ENDPOINTS ===========

// Health endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Greenspoon Box Tracker',
        timestamp: new Date().toISOString(),
        database: db ? 'connected' : 'disconnected'
    });
});

// Get all boxes
app.get('/api/boxes', (req, res) => {
    if (!db) {
        return res.json({ success: false, boxes: [], error: 'Database not connected' });
    }
    
    db.all('SELECT * FROM boxes ORDER BY box_number', (err, rows) => {
        if (err) {
            console.error('❌ Error fetching boxes:', err.message);
            return res.json({ success: false, boxes: [], error: err.message });
        }
        res.json({ success: true, boxes: rows || [] });
    });
});

// Create new box
app.post('/api/boxes', (req, res) => {
    console.log('Creating new box:', req.body);
    
    const { box_number, box_type, status = 'available' } = req.body;
    
    if (!box_number || !box_type) {
        return res.status(400).json({
            success: false,
            error: 'Box number and type are required'
        });
    }
    
    if (!db) {
        return res.status(500).json({
            success: false,
            error: 'Database not connected'
        });
    }
    
    db.run(
        'INSERT INTO boxes (box_number, box_type, status) VALUES (?, ?, ?)',
        [box_number, box_type, status],
        function(err) {
            if (err) {
                console.error('❌ Error creating box:', err.message);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }
            
            console.log('✅ Box created with ID:', this.lastID);
            
            res.json({
                success: true,
                box: {
                    id: this.lastID,
                    box_number,
                    box_type,
                    status
                }
            });
        }
    );
});

// Frontend catch-all
app.get('*', (req, res) => {
    res.json({
        service: 'Greenspoon Box Tracker API',
        status: 'running',
        message: 'Use API endpoints',
        endpoints: ['/api/health', '/api/boxes']
    });
});

// Start server
const PORT = 3000;

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ UNCAUGHT EXCEPTION:', error.message);
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION at:', promise);
    console.error('Reason:', reason);
});

const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SERVER STARTED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`✅ Port: ${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/api/health`);
    console.log(`✅ Boxes: http://localhost:${PORT}/api/boxes`);
    console.log('='.repeat(50));
    console.log('\nServer is running and listening for requests...');
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use!`);
    }
});