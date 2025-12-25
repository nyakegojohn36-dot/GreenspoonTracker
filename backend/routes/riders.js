const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all riders
router.get('/', async (req, res) => {
    try {
        await db.ensureInitialized();
        const riders = await db.all('SELECT * FROM riders ORDER BY name');
        res.json(riders);
    } catch (error) {
        console.error('Error fetching riders:', error);
        res.status(500).json({ error: 'Failed to fetch riders' });
    }
});

// GET single rider by ID or rider_id
router.get('/:id', async (req, res) => {
    try {
        await db.ensureInitialized();
        const rider = await db.get(
            'SELECT * FROM riders WHERE rider_id = ? OR id = ?', 
            [req.params.id, req.params.id]
        );
        
        if (rider) {
            res.json(rider);
        } else {
            res.status(404).json({ error: 'Rider not found' });
        }
    } catch (error) {
        console.error('Error fetching rider:', error);
        res.status(500).json({ error: 'Failed to fetch rider' });
    }
});

// POST - Add new rider (FIXED FOR FRONTEND COMPATIBILITY)
router.post('/', async (req, res) => {
    try {
        await db.ensureInitialized();
        const { name, phone, email, vehicle_type, license_number } = req.body;
        
        console.log('📝 Frontend sent rider data:', { name, phone, email, vehicle_type });
        
        // ✅ VALIDATION FOR FRONTEND DATA
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                error: 'Rider name is required' 
            });
        }
        
        // ✅ GENERATE rider_id AUTOMATICALLY (since frontend doesn't send it)
        // Get the last rider to generate next ID
        const lastRider = await db.get(
            'SELECT rider_id FROM riders ORDER BY id DESC LIMIT 1'
        );
        
        let rider_id;
        if (lastRider && lastRider.rider_id && lastRider.rider_id.startsWith('R')) {
            // Extract number and increment
            const lastNum = parseInt(lastRider.rider_id.substring(1)) || 0;
            rider_id = `R${(lastNum + 1).toString().padStart(3, '0')}`;
        } else {
            rider_id = 'R001'; // Start with R001
        }
        
        console.log('✅ Generated rider_id:', rider_id);
        
        // ✅ Check for duplicate name/phone combination
        const existingRider = await db.get(
            'SELECT * FROM riders WHERE name = ? AND phone = ?', 
            [name, phone]
        );
        
        if (existingRider) {
            return res.status(409).json({ 
                success: false, 
                error: `Rider ${name} with phone ${phone} already exists` 
            });
        }
        
        // ✅ INSERT RIDER WITH ALL FIELDS FRONTEND EXPECTS
        const result = await db.run(
            `INSERT INTO riders (
                rider_id, name, phone, email, 
                vehicle_type, license_number, 
                status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
                rider_id,                  // Auto-generated ID
                name,                      // From frontend
                phone || '',               // From frontend (empty if not provided)
                email || '',               // From frontend (empty if not provided)
                vehicle_type || 'motorcycle', // From frontend, default motorcycle
                license_number || '',      // From frontend (empty if not provided)
                'active',                  // Default status
                '',                        // Empty notes
            ]
        );
        
        console.log('✅ Rider inserted, database ID:', result.id);
        
        // ✅ RETURN COMPLETE RIDER DATA THAT FRONTEND EXPECTS
        const newRider = await db.get(
            `SELECT 
                id,
                rider_id,
                name,
                phone,
                email,
                vehicle_type,
                license_number,
                status,
                notes,
                created_at,
                updated_at
             FROM riders WHERE id = ?`, 
            [result.id]
        );
        
        // ✅ RESPONSE FORMAT THAT FRONTEND EXPECTS
        res.json({
            success: true,
            message: `Rider ${name} added successfully as ${rider_id}`,
            rider: newRider
        });
        
    } catch (error) {
        console.error('❌ Rider registration error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Database error',
            details: error.message 
        });
    }
});

// PUT - Update rider (FIXED FOR FRONTEND COMPATIBILITY)
router.put('/:id', async (req, res) => {
    try {
        await db.ensureInitialized();
        const { name, phone, email, vehicle_type, license_number, status } = req.body;
        
        console.log('Updating rider:', req.params.id, 'with:', req.body);
        
        // ✅ UPDATE ALL FIELDS FRONTEND MIGHT SEND
        const result = await db.run(
            `UPDATE riders SET 
                name = COALESCE(?, name),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email),
                vehicle_type = COALESCE(?, vehicle_type),
                license_number = COALESCE(?, license_number),
                status = COALESCE(?, status),
                updated_at = datetime('now')
             WHERE rider_id = ? OR id = ?`,
            [
                name, phone, email, 
                vehicle_type, license_number, status,
                req.params.id, req.params.id
            ]
        );
        
        if (result.changes > 0) {
            const updatedRider = await db.get(
                'SELECT * FROM riders WHERE rider_id = ? OR id = ?',
                [req.params.id, req.params.id]
            );
            res.json({ 
                success: true, 
                message: 'Rider updated', 
                rider: updatedRider 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Rider not found' 
            });
        }
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Update failed',
            details: error.message 
        });
    }
});

// DELETE - Remove rider
router.delete('/:id', async (req, res) => {
    try {
        await db.ensureInitialized();
        const result = await db.run(
            'DELETE FROM riders WHERE rider_id = ? OR id = ?',
            [req.params.id, req.params.id]
        );
        
        if (result.changes > 0) {
            res.json({ 
                success: true, 
                message: 'Rider deleted' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Rider not found' 
            });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Delete failed',
            details: error.message 
        });
    }
});

// PATCH - Update rider status
router.patch('/:id/status', async (req, res) => {
    try {
        await db.ensureInitialized();
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ 
                success: false, 
                error: 'Status is required' 
            });
        }
        
        const result = await db.run(
            `UPDATE riders SET status = ?, updated_at = datetime('now') 
             WHERE rider_id = ? OR id = ?`,
            [status, req.params.id, req.params.id]
        );
        
        if (result.changes > 0) {
            const updatedRider = await db.get(
                'SELECT * FROM riders WHERE rider_id = ? OR id = ?',
                [req.params.id, req.params.id]
            );
            res.json({ 
                success: true, 
                rider: updatedRider 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Rider not found' 
            });
        }
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update status',
            details: error.message 
        });
    }
});

module.exports = router;