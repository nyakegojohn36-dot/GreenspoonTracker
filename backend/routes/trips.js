const express = require('express');
const router = express.Router();
const db = require('../database');

// ✅ NORMALIZATION HELPER
const normalizeBoxNumber = (boxNumber) => {
    if (!boxNumber) return boxNumber;
    return boxNumber
        .replace(/\s+/g, '')
        .replace(/(GS-[BS])-(\d{3})/i, '$1 - $2')
        .toUpperCase();
};

// ✅ CREATE TRIPS TABLE WITH CORRECT SCHEMA FOR FRONTEND
async function ensureTripsTable() {
    try {
        await db.run(`
            CREATE TABLE IF NOT EXISTS trips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trip_id TEXT UNIQUE NOT NULL,
                rider_id TEXT NOT NULL,
                rider_name TEXT NOT NULL,
                boxes TEXT NOT NULL,  -- JSON array of box numbers
                destination TEXT,
                notes TEXT,
                status TEXT DEFAULT 'departed',
                departure_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                return_time DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add sample data if table is empty
        const tripCount = await db.get('SELECT COUNT(*) as count FROM trips');
        if (tripCount.count === 0) {
            console.log('📝 Adding sample trip data...');
            const sampleTrips = [
                {
                    trip_id: 'TRIP-' + Date.now(),
                    rider_id: 'R-001',
                    rider_name: 'John Delivery',
                    boxes: JSON.stringify(['GS-B - 001', 'GS-S - 001']),
                    destination: 'Downtown Market',
                    notes: 'Morning delivery',
                    status: 'returned',
                    departure_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
                    return_time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() // 1 hour later
                },
                {
                    trip_id: 'TRIP-' + (Date.now() + 1),
                    rider_id: 'R-002',
                    rider_name: 'Sarah Rider',
                    boxes: JSON.stringify(['GS-B - 002']),
                    destination: 'Uptown Cafe',
                    notes: 'Urgent delivery',
                    status: 'departed',
                    departure_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
                }
            ];
            
            for (const trip of sampleTrips) {
                await db.run(
                    `INSERT INTO trips (trip_id, rider_id, rider_name, boxes, destination, notes, status, departure_time, return_time)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [trip.trip_id, trip.rider_id, trip.rider_name, trip.boxes, trip.destination, 
                     trip.notes, trip.status, trip.departure_time, trip.return_time]
                );
            }
            console.log('✅ Added sample trips');
        }
        
        console.log('✅ Trips table is ready');
    } catch (error) {
        console.error('Error creating trips table:', error);
    }
}

// Initialize table on first use
ensureTripsTable();

// ✅ GET ALL TRIPS - FRONTEND EXPECTS THIS FORMAT
router.get('/', async (req, res) => {
    try {
        console.log('📋 Fetching trips for frontend...');
        
        // Ensure table exists
        await ensureTripsTable();
        
        const trips = await db.all(`
            SELECT * FROM trips 
            ORDER BY departure_time DESC
        `);
        
        console.log(`✅ Found ${trips.length} trips`);
        
        // Format trips for frontend - parse boxes from JSON string
        const formattedTrips = trips.map(trip => {
            let boxesArray = [];
            try {
                boxesArray = typeof trip.boxes === 'string' ? JSON.parse(trip.boxes) : trip.boxes || [];
            } catch (e) {
                console.warn('Failed to parse boxes for trip', trip.id, trip.boxes);
                boxesArray = [];
            }
            
            return {
                id: trip.id,
                trip_id: trip.trip_id,
                rider_id: trip.rider_id,
                rider_name: trip.rider_name,
                boxes: boxesArray,
                destination: trip.destination || '',
                notes: trip.notes || '',
                status: trip.status || 'departed',
                departure_time: trip.departure_time,
                return_time: trip.return_time,
                created_at: trip.created_at,
                // Calculate duration for display
                duration: trip.return_time 
                    ? calculateDuration(trip.departure_time, trip.return_time)
                    : calculateDuration(trip.departure_time, new Date().toISOString())
            };
        });
        
        // Frontend expects { success: true, trips: [...] }
        res.json({ 
            success: true, 
            trips: formattedTrips,
            count: formattedTrips.length
        });
        
    } catch (error) {
        console.error('❌ Error fetching trips:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Failed to fetch trips. Please check database connection.'
        });
    }
});

// ✅ Helper function to calculate duration
function calculateDuration(start, end) {
    try {
        const startTime = new Date(start);
        const endTime = new Date(end);
        const diffMs = endTime - startTime;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes}m`;
        }
        return `${diffMinutes}m`;
    } catch (e) {
        return 'N/A';
    }
}

// ✅ GET TRIPS BY STATUS
router.get('/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        
        const trips = await db.all(
            `SELECT * FROM trips WHERE status = ? ORDER BY departure_time DESC`,
            [status]
        );
        
        // Format trips
        const formattedTrips = trips.map(trip => ({
            ...trip,
            boxes: typeof trip.boxes === 'string' ? JSON.parse(trip.boxes) : trip.boxes
        }));
        
        res.json({ 
            success: true, 
            trips: formattedTrips,
            status,
            count: formattedTrips.length
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ✅ CREATE NEW TRIP - FRONTEND EXPECTS THIS FORMAT
router.post('/', async (req, res) => {
    try {
        const { 
            rider_id, 
            rider_name, 
            boxes, 
            destination = '', 
            notes = '',
            status = 'departed'
        } = req.body;
        
        console.log('📝 Creating new trip:', { rider_id, rider_name, boxes, destination });
        
        // Validate required fields
        if (!rider_id || !rider_name || !boxes || !Array.isArray(boxes)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: rider_id, rider_name, boxes (array)'
            });
        }
        
        if (boxes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one box must be selected for the trip'
            });
        }
        
        // Validate boxes exist and are available
        for (const boxNumber of boxes) {
            const normalizedBoxNumber = normalizeBoxNumber(boxNumber);
            const box = await db.getBox(normalizedBoxNumber);
            
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
        
        // Start transaction
        await db.run('BEGIN TRANSACTION');
        
        try {
            // Generate unique trip ID
            const trip_id = `TRIP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            
            // Insert trip
            const result = await db.run(
                `INSERT INTO trips (trip_id, rider_id, rider_name, boxes, destination, notes, status, departure_time)
                 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                [
                    trip_id,
                    rider_id,
                    rider_name,
                    JSON.stringify(boxes),  // Store as JSON string
                    destination,
                    notes || '',
                    status
                ]
            );
            
            // Update boxes status to 'in_transit'
            for (const boxNumber of boxes) {
                const normalizedBoxNumber = normalizeBoxNumber(boxNumber);
                
                await db.run(
                    `UPDATE boxes SET 
                        status = 'in_transit',
                        rider_id = ?,
                        rider_name = ?,
                        trip_id = ?,
                        last_updated = datetime('now')
                     WHERE box_number = ?`,
                    [rider_id, rider_name, trip_id, normalizedBoxNumber]
                );
                
                // Log box movement
                await db.run(
                    `INSERT INTO box_movements 
                     (box_number, from_status, to_status, rider_id, trip_id, notes)
                     VALUES (?, 'available', 'in_transit', ?, ?, ?)`,
                    [normalizedBoxNumber, rider_id, trip_id, `Assigned to trip ${trip_id}`]
                );
            }
            
            await db.run('COMMIT');
            
            // Get the created trip
            const newTrip = await db.get(
                'SELECT * FROM trips WHERE id = ?',
                [result.lastID]
            );
            
            // Format for response
            const formattedTrip = {
                ...newTrip,
                boxes: typeof newTrip.boxes === 'string' ? JSON.parse(newTrip.boxes) : newTrip.boxes
            };
            
            console.log(`✅ Trip created: ${trip_id} with ${boxes.length} boxes`);
            
            res.json({ 
                success: true, 
                trip: formattedTrip,
                message: `Trip ${trip_id} created successfully`
            });
            
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Transaction error:', error);
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Error creating trip:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Failed to create trip. Please try again.'
        });
    }
});

// ✅ MARK TRIP AS RETURNED
router.put('/:id/return', async (req, res) => {
    try {
        const tripId = req.params.id;
        const { boxes_returned } = req.body; // Optional: array of box numbers that were returned
        
        console.log(`🔄 Marking trip ${tripId} as returned...`);
        
        // Get trip details
        const trip = await db.get(
            'SELECT * FROM trips WHERE id = ? OR trip_id = ?',
            [tripId, tripId]
        );
        
        if (!trip) {
            return res.status(404).json({
                success: false,
                error: 'Trip not found'
            });
        }
        
        // Parse boxes from trip
        const tripBoxes = typeof trip.boxes === 'string' ? JSON.parse(trip.boxes) : trip.boxes;
        
        // Start transaction
        await db.run('BEGIN TRANSACTION');
        
        try {
            // Update trip status and return time
            await db.run(
                `UPDATE trips SET 
                    status = 'returned',
                    return_time = datetime('now')
                 WHERE id = ? OR trip_id = ?`,
                [tripId, tripId]
            );
            
            // Update boxes status based on what was returned
            for (const boxNumber of tripBoxes) {
                const normalizedBoxNumber = normalizeBoxNumber(boxNumber);
                const wasReturned = boxes_returned ? boxes_returned.includes(boxNumber) : true;
                
                await db.run(
                    `UPDATE boxes SET 
                        status = ?,
                        rider_id = NULL,
                        rider_name = NULL,
                        trip_id = NULL,
                        last_updated = datetime('now')
                     WHERE box_number = ?`,
                    [wasReturned ? 'available' : 'missing', normalizedBoxNumber]
                );
                
                // Log box movement
                await db.run(
                    `INSERT INTO box_movements 
                     (box_number, from_status, to_status, rider_id, trip_id, notes)
                     VALUES (?, 'in_transit', ?, ?, ?, ?)`,
                    [
                        normalizedBoxNumber,
                        wasReturned ? 'available' : 'missing',
                        trip.rider_id,
                        trip.trip_id,
                        wasReturned ? 'Returned from trip' : 'Missing from trip return'
                    ]
                );
            }
            
            await db.run('COMMIT');
            
            // Get updated trip
            const updatedTrip = await db.get(
                'SELECT * FROM trips WHERE id = ? OR trip_id = ?',
                [tripId, tripId]
            );
            
            // Format for response
            const formattedTrip = {
                ...updatedTrip,
                boxes: typeof updatedTrip.boxes === 'string' ? JSON.parse(updatedTrip.boxes) : updatedTrip.boxes
            };
            
            console.log(`✅ Trip ${trip.trip_id} marked as returned`);
            
            res.json({
                success: true,
                trip: formattedTrip,
                message: `Trip ${trip.trip_id} marked as returned`
            });
            
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Transaction error:', error);
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Error updating trip:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ✅ UPDATE TRIP
router.put('/:id', async (req, res) => {
    try {
        const tripId = req.params.id;
        const updates = req.body;
        
        // Build update query dynamically
        const fields = [];
        const values = [];
        
        if (updates.destination !== undefined) {
            fields.push('destination = ?');
            values.push(updates.destination);
        }
        if (updates.notes !== undefined) {
            fields.push('notes = ?');
            values.push(updates.notes);
        }
        if (updates.status !== undefined) {
            fields.push('status = ?');
            values.push(updates.status);
        }
        
        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }
        
        values.push(tripId);
        
        const query = `UPDATE trips SET ${fields.join(', ')} WHERE id = ? OR trip_id = ?`;
        values.push(tripId); // Add again for trip_id check
        
        await db.run(query, values);
        
        const updatedTrip = await db.get(
            'SELECT * FROM trips WHERE id = ? OR trip_id = ?',
            [tripId, tripId]
        );
        
        if (updatedTrip) {
            // Format for response
            updatedTrip.boxes = typeof updatedTrip.boxes === 'string' ? JSON.parse(updatedTrip.boxes) : updatedTrip.boxes;
            res.json({ 
                success: true, 
                trip: updatedTrip 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Trip not found' 
            });
        }
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ✅ DELETE TRIP
router.delete('/:id', async (req, res) => {
    try {
        const tripId = req.params.id;
        
        // Get trip first to update boxes
        const trip = await db.get(
            'SELECT * FROM trips WHERE id = ? OR trip_id = ?',
            [tripId, tripId]
        );
        
        if (!trip) {
            return res.status(404).json({ 
                success: false, 
                error: 'Trip not found' 
            });
        }
        
        // Start transaction
        await db.run('BEGIN TRANSACTION');
        
        try {
            // Update boxes back to available
            const tripBoxes = typeof trip.boxes === 'string' ? JSON.parse(trip.boxes) : trip.boxes;
            for (const boxNumber of tripBoxes) {
                const normalizedBoxNumber = normalizeBoxNumber(boxNumber);
                await db.run(
                    `UPDATE boxes SET 
                        status = 'available',
                        rider_id = NULL,
                        rider_name = NULL,
                        trip_id = NULL,
                        last_updated = datetime('now')
                     WHERE box_number = ?`,
                    [normalizedBoxNumber]
                );
            }
            
            // Delete the trip
            const result = await db.run(
                'DELETE FROM trips WHERE id = ? OR trip_id = ?',
                [tripId, tripId]
            );
            
            await db.run('COMMIT');
            
            res.json({ 
                success: true, 
                message: 'Trip deleted successfully',
                changes: result.changes
            });
            
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ✅ GET TRIP STATISTICS
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.all(`
            SELECT 
                status,
                COUNT(*) as count,
                DATE(departure_time) as date
            FROM trips 
            GROUP BY status, DATE(departure_time)
            ORDER BY date DESC
        `);
        
        res.json({ 
            success: true, 
            stats 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;