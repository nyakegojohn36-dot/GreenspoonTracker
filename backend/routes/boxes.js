const express = require('express');
const router = express.Router();
const db = require('../database');

// ✅ CORRECT NORMALIZATION FUNCTION
function normalizeBoxNumber(boxNumber) {
    if (!boxNumber) return '';
    
    console.log(`📦 Normalizing: ${boxNumber}`);
    
    // Convert to uppercase and trim
    let result = String(boxNumber).toUpperCase().trim();
    
    // Replace multiple spaces with single space
    result = result.replace(/\s+/g, ' ');
    
    // Normalize dash with spaces: " - " (space-dash-space)
    result = result.replace(/\s*-\s*/g, ' - ');
    
    // Fix common format issues
    // GS-B-001 → GS-B - 001
    if (result.match(/^GS-[BS]-\d{3}$/)) {
        result = result.replace(/^GS-([BS])-(\d{3})$/, 'GS-$1 - $2');
    }
    
    // GSB001 → GS-B - 001
    if (result.match(/^GS[BS]\d{3}$/)) {
        result = result.replace(/^GS([BS])(\d{3})$/, 'GS-$1 - $2');
    }
    
    // GS B 001 → GS-B - 001
    if (result.match(/^GS\s+[BS]\s+\d{3}$/)) {
        result = result.replace(/^GS\s+([BS])\s+(\d{3})$/, 'GS-$1 - $2');
    }
    
    console.log(`📦 Normalized to: ${result}`);
    return result;
}

// GET all boxes
router.get('/', async (req, res) => {
    try {
        console.log('📦 Fetching all boxes...');
        const boxes = await db.getAllBoxes();
        console.log(`📦 Found ${boxes.length} boxes`);
        res.json(boxes);
    } catch (error) {
        console.error('❌ Error fetching boxes:', error);
        res.status(500).json({ error: 'Failed to fetch boxes', details: error.message });
    }
});

// GET single box by box_number (normalized)
router.get('/:box_number', async (req, res) => {
    try {
        const rawBoxNumber = req.params.box_number;
        const boxNumber = normalizeBoxNumber(rawBoxNumber);
        
        console.log(`🔍 Looking for box: ${rawBoxNumber} → ${boxNumber}`);
        
        const box = await db.getBox(boxNumber);
        
        if (box) {
            console.log(`✅ Found box: ${box.box_number}`);
            res.json(box);
        } else {
            console.log(`❌ Box not found: ${boxNumber}`);
            res.status(404).json({ error: `Box ${boxNumber} not found` });
        }
    } catch (error) {
        console.error('❌ Error fetching box:', error);
        res.status(500).json({ error: 'Failed to fetch box', details: error.message });
    }
});

// POST - Create new box
router.post('/', async (req, res) => {
    try {
        console.log('📦 Creating new box:', req.body);
        
        const { box_number, box_type, notes, color } = req.body;
        
        // Validate required fields
        if (!box_number) {
            return res.status(400).json({ error: 'Box number is required' });
        }
        
        if (!box_type || !['B', 'S'].includes(box_type.toUpperCase())) {
            return res.status(400).json({ error: 'Box type must be "B" (Big) or "S" (Small)' });
        }
        
        // Normalize box number
        const normalizedBoxNumber = normalizeBoxNumber(box_number);
        
        // Validate format
        if (!/^GS-[BS] - \d{3}$/.test(normalizedBoxNumber)) {
            return res.status(400).json({ 
                error: 'Invalid format. Use: GS-B - 001 or GS-S - 001 (with spaces around dash)' 
            });
        }
        
        // Check for duplicates
        const existingBox = await db.getBox(normalizedBoxNumber);
        if (existingBox) {
            return res.status(409).json({ 
                error: `Box ${normalizedBoxNumber} already exists` 
            });
        }
        
        // Insert new box
        const result = await db.run(
            `INSERT INTO boxes (box_number, box_type, status, notes, color) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                normalizedBoxNumber,
                box_type.toUpperCase(),
                'available',
                notes || '',
                color || (box_type.toUpperCase() === 'B' ? '#4361ee' : '#4cc9f0')
            ]
        );
        
        console.log(`✅ Box created with ID: ${result.id}`);
        
        // Get the newly created box
        const newBox = await db.getBox(normalizedBoxNumber);
        
        res.status(201).json({
            success: true,
            message: `Box ${normalizedBoxNumber} created successfully`,
            box: newBox
        });
        
    } catch (error) {
        console.error('❌ Error creating box:', error);
        res.status(500).json({ 
            error: 'Failed to create box',
            details: error.message 
        });
    }
});

// PUT - Update box
router.put('/:box_number', async (req, res) => {
    try {
        const rawBoxNumber = req.params.box_number;
        const boxNumber = normalizeBoxNumber(rawBoxNumber);
        const { status, notes, color } = req.body;
        
        console.log(`📦 Updating box: ${rawBoxNumber} → ${boxNumber}`);
        
        // Validate status if provided
        if (status && !['available', 'in_transit', 'delivered', 'returned', 'lost', 'damaged'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        // Build update query dynamically
        const updates = [];
        const params = [];
        
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        
        if (color) {
            updates.push('color = ?');
            params.push(color);
        }
        
        updates.push("last_updated = datetime('now')");
        
        // Add box number to params
        params.push(boxNumber);
        
        const query = `UPDATE boxes SET ${updates.join(', ')} WHERE box_number = ?`;
        
        const result = await db.run(query, params);
        
        if (result.changes > 0) {
            const updatedBox = await db.getBox(boxNumber);
            console.log(`✅ Box updated: ${boxNumber}`);
            res.json({ 
                success: true, 
                message: 'Box updated successfully',
                box: updatedBox 
            });
        } else {
            console.log(`❌ Box not found: ${boxNumber}`);
            res.status(404).json({ error: 'Box not found' });
        }
        
    } catch (error) {
        console.error('❌ Error updating box:', error);
        res.status(500).json({ error: 'Failed to update box', details: error.message });
    }
});

// PATCH - Update box status (CRITICAL FOR FRONTEND)
router.patch('/:box_number/status', async (req, res) => {
    try {
        const rawBoxNumber = req.params.box_number;
        const boxNumber = normalizeBoxNumber(rawBoxNumber);
        const { status } = req.body;
        
        console.log(`🔄 Updating status for: ${rawBoxNumber} → ${boxNumber} to: ${status}`);
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        // Validate status
        const validStatuses = ['available', 'in_transit', 'delivered', 'returned', 'lost', 'damaged'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        
        const result = await db.run(
            `UPDATE boxes SET status = ?, last_updated = datetime('now') WHERE box_number = ?`,
            [status, boxNumber]
        );
        
        if (result.changes > 0) {
            const updatedBox = await db.getBox(boxNumber);
            console.log(`✅ Status updated for ${boxNumber}: ${status}`);
            res.json({ 
                success: true, 
                message: `Box status updated to ${status}`,
                box: updatedBox 
            });
        } else {
            console.log(`❌ Box not found: ${boxNumber}`);
            res.status(404).json({ error: 'Box not found' });
        }
        
    } catch (error) {
        console.error('❌ Error updating box status:', error);
        res.status(500).json({ 
            error: 'Failed to update box status',
            details: error.message 
        });
    }
});

// DELETE - Remove box
router.delete('/:box_number', async (req, res) => {
    try {
        const rawBoxNumber = req.params.box_number;
        const boxNumber = normalizeBoxNumber(rawBoxNumber);
        
        console.log(`🗑️ Deleting box: ${rawBoxNumber} → ${boxNumber}`);
        
        const result = await db.run(
            'DELETE FROM boxes WHERE box_number = ?',
            [boxNumber]
        );
        
        if (result.changes > 0) {
            console.log(`✅ Box deleted: ${boxNumber}`);
            res.json({ 
                success: true, 
                message: `Box ${boxNumber} deleted successfully` 
            });
        } else {
            console.log(`❌ Box not found: ${boxNumber}`);
            res.status(404).json({ error: 'Box not found' });
        }
        
    } catch (error) {
        console.error('❌ Error deleting box:', error);
        res.status(500).json({ error: 'Failed to delete box', details: error.message });
    }
});

// GET - Search boxes by QR code (alias for GET by box_number)
router.get('/qr/:qr_code', async (req, res) => {
    try {
        const rawQrCode = req.params.qr_code;
        const boxNumber = normalizeBoxNumber(rawQrCode);
        
        console.log(`🔎 QR search: ${rawQrCode} → ${boxNumber}`);
        
        const box = await db.getBox(boxNumber);
        
        if (box) {
            console.log(`✅ Found via QR: ${box.box_number}`);
            res.json(box);
        } else {
            console.log(`❌ Not found via QR: ${boxNumber}`);
            res.status(404).json({ 
                error: 'Box not found',
                suggestion: 'Use format: GS-B - 001 (with spaces around dash)' 
            });
        }
        
    } catch (error) {
        console.error('❌ QR search error:', error);
        res.status(500).json({ error: 'QR search failed', details: error.message });
    }
});

// POST - Return boxes (update status from in_transit to available or repair)
router.post('/return', async (req, res) => {
    try {
        console.log('📥 RETURN BOXES:', req.body);
        
        const { boxes, status } = req.body;
        
        if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
            return res.status(400).json({ error: 'Boxes array required' });
        }
        
        if (!status || !['available', 'repair'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "available" or "repair"' });
        }
        
        // Update each box status
        const results = [];
        for (const boxNumber of boxes) {
            const normalizedBoxNumber = normalizeBoxNumber(boxNumber);
            
            try {
                await db.run(
                    `UPDATE boxes SET status = ? WHERE box_number = ?`,
                    [status, normalizedBoxNumber]
                );
                results.push({ box_number: normalizedBoxNumber, success: true });
                console.log(`✅ Updated ${normalizedBoxNumber} to ${status}`);
            } catch (error) {
                console.error(`❌ Failed to update ${normalizedBoxNumber}:`, error);
                results.push({ box_number: normalizedBoxNumber, success: false, error: error.message });
            }
        }
        
        res.json({
            success: true,
            message: `Processed ${results.filter(r => r.success).length} of ${boxes.length} boxes`,
            results: results
        });
        
    } catch (error) {
        console.error('❌ Return boxes error:', error);
        res.status(500).json({ error: 'Failed to return boxes', details: error.message });
    }
});

// POST - Emergency registration (for testing/debugging)
router.post('/emergency', async (req, res) => {
    try {
        console.log('🚨 EMERGENCY REGISTRATION:', req.body);
        
        const { box_number, box_type, notes } = req.body;
        
        if (!box_number) {
            return res.status(400).json({ error: 'Box number required' });
        }
        
        const normalizedBoxNumber = normalizeBoxNumber(box_number);
        const type = (box_type || 'B').toUpperCase();
        
        // Force insert
        const result = await db.run(
            `INSERT INTO boxes (box_number, box_type, status, notes, color) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                normalizedBoxNumber,
                type,
                'available',
                notes || '',
                type === 'B' ? '#4361ee' : '#4cc9f0'
            ]
        );
        
        console.log(`✅ Emergency insert: ${normalizedBoxNumber}, ID: ${result.id}`);
        
        const newBox = await db.getBox(normalizedBoxNumber);
        
        res.json({
            success: true,
            message: 'Emergency registration successful',
            box: newBox
        });
        
    } catch (error) {
        console.error('❌ Emergency registration error:', error);
        res.status(500).json({ error: 'Emergency registration failed', details: error.message });
    }
});

module.exports = router;