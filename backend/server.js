const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from frontend
const frontendPath = path.join(__dirname, '..', 'frontend');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
}

// Database setup - use writable location
// For packaged app, use AppData; for development, use local folder
const isDev = !process.env.PORTABLE_EXECUTABLE_DIR && !process.pkg;
const dbPath = isDev 
    ? path.join(__dirname, '..', 'database', 'greenspoon.db')
    : path.join(process.env.APPDATA || process.env.HOME, 'GreenspoonTracker', 'greenspoon.db');

console.log('Database path:', dbPath);
console.log('Running in:', isDev ? 'Development' : 'Production');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created database directory');
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    const sql = `
        CREATE TABLE IF NOT EXISTS boxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            box_number TEXT UNIQUE NOT NULL,
            box_type TEXT NOT NULL,
            status TEXT DEFAULT 'available'
        );
        
        CREATE TABLE IF NOT EXISTS riders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rider_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id TEXT UNIQUE NOT NULL,
            rider_id TEXT NOT NULL,
            rider_name TEXT NOT NULL,
            boxes TEXT NOT NULL,
            destination TEXT,
            notes TEXT,
            status TEXT DEFAULT 'departed',
            departure_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            return_time DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Performance indexes for faster queries
        CREATE INDEX IF NOT EXISTS idx_boxes_status ON boxes(status);
        CREATE INDEX IF NOT EXISTS idx_boxes_number ON boxes(box_number);
        CREATE INDEX IF NOT EXISTS idx_riders_rider_id ON riders(rider_id);
        CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
        CREATE INDEX IF NOT EXISTS idx_trips_rider_id ON trips(rider_id);
        CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON trips(departure_time);
    `;
    
    db.exec(sql, (err) => {
        if (err) {
            console.error('Table creation error:', err.message);
        } else {
            console.log('✅ Database tables created with indexes');
            seedInitialData();
        }
    });
}

// Seed initial data
function seedInitialData() {
    // Check if boxes table is empty
    db.get('SELECT COUNT(*) as count FROM boxes', (err, result) => {
        if (err) {
            console.error('Error checking boxes:', err.message);
            return;
        }
        
        if (result.count === 0) {
            console.log('Seeding sample boxes...');
            const boxes = [
                ['GS-B - 001', 'B', 'available'],
                ['GS-B - 002', 'B', 'available'],
                ['GS-B - 003', 'B', 'available'],
                ['GS-B - 004', 'B', 'available'],
                ['GS-B - 005', 'B', 'available'],
                ['GS-B - 006', 'B', 'available']
            ];
            
            const stmt = db.prepare('INSERT OR IGNORE INTO boxes (box_number, box_type, status) VALUES (?, ?, ?)');
            boxes.forEach(box => stmt.run(box));
            stmt.finalize();
            console.log('✅ Sample boxes added');
        }
    });
    
    // Check if riders table is empty
    db.get('SELECT COUNT(*) as count FROM riders', (err, result) => {
        if (err) {
            console.error('Error checking riders:', err.message);
            return;
        }
        
        if (result.count === 0) {
            console.log('Seeding sample riders...');
            const riders = [
                ['R-001', 'John Delivery'],
                ['R-002', 'Sarah Rider'],
                ['R-003', 'Mike Courier']
            ];
            
            const stmt = db.prepare('INSERT OR IGNORE INTO riders (rider_id, name) VALUES (?, ?)');
            riders.forEach(rider => stmt.run(rider));
            stmt.finalize();
            console.log('✅ Sample riders added');
        }
    });
}

// Helper function to promisify db methods
function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

// =========== API ENDPOINTS ===========

// Health endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Greenspoon Box Tracker',
        timestamp: new Date().toISOString() 
    });
});

// Get all boxes
app.get('/api/boxes', async (req, res) => {
    try {
        const boxes = await dbAll('SELECT * FROM boxes ORDER BY box_number');
        res.json({ 
            success: true, 
            boxes: boxes,
            count: boxes.length
        });
    } catch (error) {
        console.error('❌ Error fetching boxes:', error.message);
        res.json({ 
            success: false,
            error: error.message,
            boxes: []
        });
    }
});

// Get single box
app.get('/api/boxes/:box_number', async (req, res) => {
    try {
        const boxNumber = decodeURIComponent(req.params.box_number);
        const box = await dbGet('SELECT * FROM boxes WHERE box_number = ?', [boxNumber]);
        
        if (!box) {
            return res.status(404).json({
                success: false,
                error: 'Box not found'
            });
        }
        
        res.json({
            success: true,
            box: box
        });
    } catch (error) {
        console.error('❌ Error fetching box:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create new box
app.post('/api/boxes', async (req, res) => {
    try {
        console.log('Creating new box:', req.body);
        const { box_number, box_type, status = 'available' } = req.body;
        
        if (!box_number || !box_type) {
            return res.status(400).json({
                success: false,
                error: 'Box number and type are required'
            });
        }
        
        const result = await dbRun(
            'INSERT INTO boxes (box_number, box_type, status) VALUES (?, ?, ?)',
            [box_number, box_type, status]
        );
        
        const newBox = await dbGet('SELECT * FROM boxes WHERE id = ?', [result.lastID]);
        
        console.log('✅ Box created:', newBox);
        res.status(201).json({
            success: true,
            box: newBox
        });
    } catch (error) {
        console.error('❌ Error creating box:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Check if box number already exists'
        });
    }
});

// Update box status
app.patch('/api/boxes/:box_number/status', async (req, res) => {
    try {
        const boxNumber = req.params.box_number;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Status is required'
            });
        }
        
        const result = await dbRun(
            'UPDATE boxes SET status = ? WHERE box_number = ?',
            [status, boxNumber]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Box not found'
            });
        }
        
        const updatedBox = await dbGet('SELECT * FROM boxes WHERE box_number = ?', [boxNumber]);
        
        res.json({
            success: true,
            box: updatedBox
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all riders
app.get('/api/riders', async (req, res) => {
    try {
        const riders = await dbAll('SELECT * FROM riders ORDER BY name');
        res.json({
            success: true,
            riders: riders,
            count: riders.length
        });
    } catch (error) {
        console.error('❌ Error fetching riders:', error.message);
        res.json({
            success: false,
            error: error.message,
            riders: []
        });
    }
});

// Create new rider
app.post('/api/riders', async (req, res) => {
    try {
        console.log('Creating new rider:', req.body);
        const { rider_id, name } = req.body;
        
        if (!rider_id || !name) {
            return res.status(400).json({
                success: false,
                error: 'Rider ID and name are required'
            });
        }
        
        const result = await dbRun(
            'INSERT INTO riders (rider_id, name) VALUES (?, ?)',
            [rider_id, name]
        );
        
        const newRider = await dbGet('SELECT * FROM riders WHERE id = ?', [result.lastID]);
        
        console.log('✅ Rider created:', newRider);
        res.status(201).json({
            success: true,
            rider: newRider
        });
    } catch (error) {
        console.error('❌ Error creating rider:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Check if rider ID already exists'
        });
    }
});

// Get all trips
app.get('/api/trips', async (req, res) => {
    try {
        const trips = await dbAll('SELECT * FROM trips ORDER BY departure_time DESC');
        
        // Parse boxes from JSON string
        const formattedTrips = trips.map(trip => ({
            ...trip,
            boxes: typeof trip.boxes === 'string' ? JSON.parse(trip.boxes) : trip.boxes || []
        }));
        
        res.json({
            success: true,
            trips: formattedTrips,
            count: formattedTrips.length
        });
    } catch (error) {
        console.error('❌ Error fetching trips:', error.message);
        res.json({
            success: true,
            trips: [],
            count: 0
        });
    }
});

// Create new trip
app.post('/api/trips', async (req, res) => {
    try {
        console.log('Creating new trip:', req.body);
        const { rider_id, rider_name, boxes, destination = '', notes = '' } = req.body;
        
        if (!rider_id || !rider_name || !boxes || !Array.isArray(boxes)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: rider_id, rider_name, boxes (array)'
            });
        }
        
        // Validate boxes exist and are available
        for (const boxNumber of boxes) {
            const box = await dbGet('SELECT * FROM boxes WHERE box_number = ?', [boxNumber]);
            if (!box) {
                return res.status(400).json({
                    success: false,
                    error: `Box ${boxNumber} not found`
                });
            }
            if (box.status !== 'available') {
                return res.status(400).json({
                    success: false,
                    error: `Box ${boxNumber} is not available. Current status: ${box.status}`
                });
            }
        }
        
        // Generate trip ID
        const tripId = `TRIP-${Date.now()}`;
        
        // Create trip with all fields
        const result = await dbRun(
            `INSERT INTO trips (trip_id, rider_id, rider_name, boxes, destination, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                tripId,
                rider_id,
                rider_name,
                JSON.stringify(boxes),
                destination,
                notes,
                'departed'
            ]
        );
        
        console.log('Trip insert result:', result);
        
        // Update boxes status to 'in_transit'
        for (const boxNumber of boxes) {
            await dbRun(
                `UPDATE boxes SET status = 'in_transit' WHERE box_number = ?`,
                [boxNumber]
            );
        }
        
        // Get the created trip
        const newTrip = await dbGet('SELECT * FROM trips WHERE id = ?', [result.id]);
        
        if (!newTrip) {
            console.error('Failed to retrieve trip with id:', result.id);
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve created trip'
            });
        }
        
        // Parse boxes back to array for response
        newTrip.boxes = boxes;
        
        console.log('✅ Trip created:', newTrip);
        res.json({ 
            success: true, 
            trip: newTrip,
            message: `Trip ${tripId} created successfully with ${boxes.length} boxes`
        });
        
    } catch (error) {
        console.error('❌ Error creating trip:', error.message);
        res.status(500).json({ 
            success: false,
            error: error.message,
            message: 'Failed to create trip'
        });
    }
});

// Mark trip as returned
app.put('/api/trips/:id/return', async (req, res) => {
    try {
        const tripId = req.params.id;
        
        // Get trip first
        const trip = await dbGet(
            'SELECT * FROM trips WHERE id = ? OR trip_id = ?',
            [tripId, tripId]
        );
        
        if (!trip) {
            return res.status(404).json({
                success: false,
                error: 'Trip not found'
            });
        }
        
        // Parse boxes from JSON string
        const boxes = typeof trip.boxes === 'string' ? JSON.parse(trip.boxes) : trip.boxes || [];
        
        // Update trip status
        await dbRun(
            `UPDATE trips SET status = 'returned' WHERE id = ? OR trip_id = ?`,
            [tripId, tripId]
        );
        
        // Update boxes back to available
        for (const boxNumber of boxes) {
            await dbRun(
                `UPDATE boxes SET status = 'available' WHERE box_number = ?`,
                [boxNumber]
            );
        }
        
        // Get updated trip
        const updatedTrip = await dbGet(
            'SELECT * FROM trips WHERE id = ? OR trip_id = ?',
            [tripId, tripId]
        );
        
        updatedTrip.boxes = boxes; // Already parsed
        
        res.json({
            success: true,
            trip: updatedTrip,
            message: `Trip marked as returned`
        });
    } catch (error) {
        console.error('❌ Error returning trip:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete trip
app.delete('/api/trips/:id', async (req, res) => {
    try {
        const tripId = req.params.id;
        
        // Get trip first to get boxes
        const trip = await dbGet(
            'SELECT * FROM trips WHERE id = ? OR trip_id = ?',
            [tripId, tripId]
        );
        
        if (!trip) {
            return res.status(404).json({
                success: false,
                error: 'Trip not found'
            });
        }
        
        // Parse boxes from JSON string
        const boxes = typeof trip.boxes === 'string' ? JSON.parse(trip.boxes) : trip.boxes || [];
        
        // Update boxes back to available
        for (const boxNumber of boxes) {
            await dbRun(
                `UPDATE boxes SET status = 'available' WHERE box_number = ?`,
                [boxNumber]
            );
        }
        
        // Delete the trip
        const result = await dbRun(
            'DELETE FROM trips WHERE id = ? OR trip_id = ?',
            [tripId, tripId]
        );
        
        res.json({
            success: true,
            message: 'Trip deleted successfully',
            changes: result.changes
        });
    } catch (error) {
        console.error('❌ Error deleting trip:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Dashboard stats
app.get('/api/stats/dashboard', async (req, res) => {
    try {
        const boxes = await dbAll('SELECT status FROM boxes');
        const riders = await dbAll('SELECT * FROM riders');
        
        // Count active trips
        const activeTrips = await dbGet("SELECT COUNT(*) as count FROM trips WHERE status = 'departed'");
        
        const stats = {
            total_boxes: boxes.length,
            available_boxes: boxes.filter(b => b.status === 'available').length,
            in_transit_boxes: boxes.filter(b => b.status === 'in_transit').length,
            total_riders: riders.length,
            active_trips: activeTrips.count || 0
        };
        
        res.json(stats);
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.json({
            total_boxes: 0,
            available_boxes: 0,
            in_transit_boxes: 0,
            total_riders: 0,
            active_trips: 0
        });
    }
});

// Status distribution for chart
app.get('/api/stats/status-distribution', async (req, res) => {
    try {
        const boxes = await dbAll('SELECT status FROM boxes');
        
        const distribution = {
            available: boxes.filter(b => b.status === 'available').length,
            in_transit: boxes.filter(b => b.status === 'in_transit').length
        };
        
        res.json(distribution);
    } catch (error) {
        console.error('❌ Distribution error:', error);
        res.json({
            available: 0,
            in_transit: 0
        });
    }
});

// Return mode - get boxes for return
app.get('/api/return/boxes', async (req, res) => {
    try {
        const { type = 'available' } = req.query;
        
        let query = 'SELECT * FROM boxes';
        if (type === 'available') {
            query = "SELECT * FROM boxes WHERE status = 'available'";
        } else if (type === 'in_transit') {
            query = "SELECT * FROM boxes WHERE status = 'in_transit'";
        }
        query += ' ORDER BY box_number';
        
        const boxes = await dbAll(query);
        res.json(boxes);
    } catch (error) {
        console.error('❌ Return boxes error:', error.message);
        res.json([]);
    }
});

// Fix trips - check all active trips and mark as returned if all boxes are back
app.post('/api/trips/fix-status', async (req, res) => {
    try {
        const activeTrips = await dbAll(`SELECT * FROM trips WHERE status = 'departed'`);
        let fixed = 0;
        
        for (const trip of activeTrips) {
            let tripBoxes = [];
            try {
                tripBoxes = JSON.parse(trip.boxes);
            } catch (e) {
                console.error('Failed to parse trip boxes:', e);
                continue;
            }
            
            // Check if all boxes have been returned
            const boxStatuses = await Promise.all(
                tripBoxes.map(boxNum => 
                    dbGet('SELECT status FROM boxes WHERE box_number = ?', [boxNum])
                )
            );
            
            const allReturned = boxStatuses.every(box => 
                box && (box.status === 'available' || box.status === 'needs_repair')
            );
            
            if (allReturned) {
                await dbRun(
                    `UPDATE trips SET status = 'returned', return_time = ? WHERE id = ?`,
                    [new Date().toISOString(), trip.id]
                );
                fixed++;
                console.log(`✅ Fixed trip ${trip.trip_id} - marked as returned`);
            }
        }
        
        res.json({
            success: true,
            message: `Fixed ${fixed} trips`,
            fixed_count: fixed
        });
    } catch (error) {
        console.error('❌ Error fixing trips:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Process box return
app.post('/api/return/process', async (req, res) => {
    try {
        const { box_number, condition = 'available' } = req.body;
        
        if (!box_number) {
            return res.status(400).json({ 
                success: false,
                error: 'Box number is required' 
            });
        }
        
        const newStatus = condition === 'available' ? 'available' : 'needs_repair';
        
        // Update the box
        const result = await dbRun(
            `UPDATE boxes SET status = ? WHERE box_number = ?`,
            [newStatus, box_number]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Box not found'
            });
        }
        
        // Get the updated box
        const updatedBox = await dbGet('SELECT * FROM boxes WHERE box_number = ?', [box_number]);
        
        // Check if this box was part of an active trip and update trip status
        const activeTrips = await dbAll(`
            SELECT * FROM trips 
            WHERE status = 'departed' 
            AND boxes LIKE ?
        `, [`%${box_number}%`]);
        
        for (const trip of activeTrips) {
            // Parse the boxes JSON
            let tripBoxes = [];
            try {
                tripBoxes = JSON.parse(trip.boxes);
            } catch (e) {
                console.error('Failed to parse trip boxes:', e);
                continue;
            }
            
            // Check if all boxes in this trip have been returned
            const boxStatuses = await Promise.all(
                tripBoxes.map(boxNum => 
                    dbGet('SELECT status FROM boxes WHERE box_number = ?', [boxNum])
                )
            );
            
            // If all boxes are no longer in_transit, mark trip as completed
            const allReturned = boxStatuses.every(box => 
                box && (box.status === 'available' || box.status === 'needs_repair')
            );
            
            if (allReturned) {
                await dbRun(
                    `UPDATE trips SET status = 'returned', return_time = ? WHERE id = ?`,
                    [new Date().toISOString(), trip.id]
                );
                console.log(`✅ Trip ${trip.trip_id} marked as completed - all boxes returned`);
            }
        }
        
        res.json({
            success: true,
            message: `Box ${box_number} returned as ${newStatus}`,
            box: updatedBox
        });
    } catch (error) {
        console.error('❌ Return process error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to process return',
            message: error.message
        });
    }
});

// ============= REPORTS API =============
// Get overdue trips and active trips report
app.get('/api/reports/overdue', (req, res) => {
    const now = new Date().getTime();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    // Get all active trips (status = 'departed')
    db.all(`
        SELECT * FROM trips 
        WHERE status = 'departed' 
        ORDER BY departure_time ASC
    `, [], (err, activeTrips) => {
        if (err) {
            console.error('Error fetching active trips:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch active trips' 
            });
        }
        
        // Split into overdue and all active
        const overdueTrips = [];
        const allActiveTrips = [];
        
        activeTrips.forEach(trip => {
            const departureTime = new Date(trip.departure_time).getTime();
            const hoursOut = (now - departureTime) / (1000 * 60 * 60);
            
            // Parse boxes
            let boxCount = 0;
            let boxNumbers = [];
            try {
                const boxes = JSON.parse(trip.boxes || '[]');
                boxCount = boxes.length;
                boxNumbers = boxes; // Array of box numbers like ["GS-B - 213", "GS-B - 255"]
            } catch (e) {
                console.error('Error parsing boxes:', e);
            }
            
            const tripData = {
                ...trip,
                boxCount,
                boxNumbers,
                hoursOut: hoursOut.toFixed(1),
                departureTimeFormatted: new Date(trip.departure_time).toLocaleString()
            };
            
            // If departure was more than 24 hours ago, it's overdue
            if (departureTime < twentyFourHoursAgo) {
                overdueTrips.push(tripData);
            }
            
            allActiveTrips.push(tripData);
        });
        
        res.json({
            success: true,
            data: {
                overdueTrips,
                activeTrips: allActiveTrips,
                summary: {
                    totalOverdue: overdueTrips.length,
                    totalActive: allActiveTrips.length
                }
            }
        });
    });
});

// Frontend catch-all
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({
            service: 'Greenspoon Box Tracker API',
            status: 'running',
            message: 'Frontend not found. Using API mode.',
            timestamp: new Date().toISOString(),
            endpoints: [
                '/api/health',
                '/api/boxes',
                '/api/riders',
                '/api/trips',
                '/api/stats/dashboard',
                '/api/stats/status-distribution',
                '/api/return/boxes',
                '/api/return/process'
            ]
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = 3443;

// Generate self-signed certificate for local HTTPS
const selfsigned = require('selfsigned');
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

const httpsOptions = {
    key: pems.private,
    cert: pems.cert
};

// Start HTTP server
http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SERVER STARTED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`✅ HTTP Port: ${PORT}`);
    console.log(`✅ HTTPS Port: ${HTTPS_PORT} (for mobile camera access)`);
    console.log(`✅ Health: http://localhost:${PORT}/api/health`);
    console.log(`✅ Boxes: http://localhost:${PORT}/api/boxes`);
    console.log(`✅ Riders: http://localhost:${PORT}/api/riders`);
    console.log(`✅ Trips: http://localhost:${PORT}/api/trips`);
    console.log(`✅ Dashboard Stats: http://localhost:${PORT}/api/stats/dashboard`);
    console.log(`✅ Status Distribution: http://localhost:${PORT}/api/stats/status-distribution`);
    console.log(`✅ Return Mode: http://localhost:${PORT}/api/return/boxes?type=available`);
    console.log(`✅ Overdue Reports: http://localhost:${PORT}/api/reports/overdue`);
    console.log('='.repeat(50) + '\n');
});

// Start HTTPS server for mobile camera access
https.createServer(httpsOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`🔒 HTTPS server running on port ${HTTPS_PORT}`);
    console.log(`📱 Mobile access: https://YOUR_IP:${HTTPS_PORT}`);
    console.log(`⚠️  You'll need to accept the self-signed certificate warning\n`);
});

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});