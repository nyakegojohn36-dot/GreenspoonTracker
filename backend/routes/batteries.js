const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Get all batteries
    router.get('/', (req, res) => {
        const sql = 'SELECT * FROM batteries ORDER BY battery_number';
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching batteries:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ batteries: rows });
        });
    });
    
    // Get battery by number
    router.get('/:batteryNumber', (req, res) => {
        const sql = 'SELECT * FROM batteries WHERE battery_number = ?';
        
        db.get(sql, [req.params.batteryNumber], (err, row) => {
            if (err) {
                console.error('Error fetching battery:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            if (!row) {
                res.status(404).json({ error: 'Battery not found' });
                return;
            }
            res.json({ battery: row });
        });
    });
    
    // Add new battery
    router.post('/', (req, res) => {
        const { battery_number, vehicle_type, vehicle_registration, notes } = req.body;
        
        if (!battery_number || !vehicle_type) {
            res.status(400).json({ error: 'Battery number and vehicle type are required' });
            return;
        }
        
        const sql = `INSERT INTO batteries (battery_number, vehicle_type, vehicle_registration, status, notes) 
                     VALUES (?, ?, ?, 'available', ?)`;
        
        db.run(sql, [battery_number, vehicle_type, vehicle_registration || null, notes || null], function(err) {
            if (err) {
                console.error('Error adding battery:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                message: 'Battery added successfully',
                battery_id: this.lastID 
            });
        });
    });
    
    // Update battery
    router.put('/:batteryNumber', (req, res) => {
        const { vehicle_type, vehicle_registration, status, notes } = req.body;
        
        const sql = `UPDATE batteries 
                     SET vehicle_type = ?, 
                         vehicle_registration = ?, 
                         status = ?,
                         notes = ?,
                         last_updated = CURRENT_TIMESTAMP
                     WHERE battery_number = ?`;
        
        db.run(sql, [vehicle_type, vehicle_registration, status, notes, req.params.batteryNumber], function(err) {
            if (err) {
                console.error('Error updating battery:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Battery not found' });
                return;
            }
            res.json({ message: 'Battery updated successfully' });
        });
    });
    
    // Delete battery
    router.delete('/:batteryNumber', (req, res) => {
        const sql = 'DELETE FROM batteries WHERE battery_number = ?';
        
        db.run(sql, [req.params.batteryNumber], function(err) {
            if (err) {
                console.error('Error deleting battery:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Battery not found' });
                return;
            }
            res.json({ message: 'Battery deleted successfully' });
        });
    });
    
    // Get all battery assignments
    router.get('/assignments/all', (req, res) => {
        const sql = `SELECT * FROM battery_assignments 
                     ORDER BY issue_time DESC`;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching battery assignments:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ assignments: rows });
        });
    });
    
    // Get active battery assignments
    router.get('/assignments/active', (req, res) => {
        const sql = `SELECT * FROM battery_assignments 
                     WHERE status = 'active' 
                     ORDER BY issue_time DESC`;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching active assignments:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ assignments: rows });
        });
    });
    
    // Get overdue battery assignments (over 24 hours)
    router.get('/assignments/overdue', (req, res) => {
        const sql = `SELECT * FROM battery_assignments 
                     WHERE status = 'active' 
                     AND datetime(issue_time, '+24 hours') < datetime('now')
                     ORDER BY issue_time ASC`;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Error fetching overdue assignments:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ assignments: rows });
        });
    });
    
    // Issue battery to rider
    router.post('/assignments', (req, res) => {
        const { battery_number, rider_id, rider_name, vehicle_type, vehicle_registration, destination, notes } = req.body;
        
        if (!battery_number || !rider_id || !rider_name) {
            res.status(400).json({ error: 'Battery number, rider ID, and rider name are required' });
            return;
        }
        
        // Generate unique assignment ID
        const assignment_id = `BAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        // Start transaction
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Insert assignment
            const insertSql = `INSERT INTO battery_assignments 
                              (assignment_id, battery_number, rider_id, rider_name, vehicle_type, 
                               vehicle_registration, destination, notes, status, issue_time)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`;
            
            db.run(insertSql, [assignment_id, battery_number, rider_id, rider_name, vehicle_type, 
                               vehicle_registration || null, destination || null, notes || null], function(err) {
                if (err) {
                    console.error('Error creating assignment:', err.message);
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                // Update battery status
                const updateSql = `UPDATE batteries 
                                  SET status = 'in_use', last_updated = CURRENT_TIMESTAMP 
                                  WHERE battery_number = ?`;
                
                db.run(updateSql, [battery_number], function(err) {
                    if (err) {
                        console.error('Error updating battery status:', err.message);
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    // Log movement
                    const movementSql = `INSERT INTO battery_movements 
                                        (battery_number, from_status, to_status, rider_id, assignment_id, notes)
                                        VALUES (?, 'available', 'in_use', ?, ?, ?)`;
                    
                    db.run(movementSql, [battery_number, rider_id, assignment_id, notes || 'Battery issued'], function(err) {
                        if (err) {
                            console.error('Error logging movement:', err.message);
                            // Don't fail the transaction for movement logging
                        }
                        
                        db.run('COMMIT');
                        res.json({ 
                            message: 'Battery issued successfully',
                            assignment_id: assignment_id
                        });
                    });
                });
            });
        });
    });
    
    // Return battery
    router.post('/assignments/:assignmentId/return', (req, res) => {
        const { notes } = req.body;
        const assignmentId = req.params.assignmentId;
        
        // Get assignment details first
        db.get('SELECT * FROM battery_assignments WHERE assignment_id = ?', [assignmentId], (err, assignment) => {
            if (err) {
                console.error('Error fetching assignment:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (!assignment) {
                res.status(404).json({ error: 'Assignment not found' });
                return;
            }
            
            if (assignment.status !== 'active') {
                res.status(400).json({ error: 'Assignment is not active' });
                return;
            }
            
            // Start transaction
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                // Update assignment
                const updateAssignmentSql = `UPDATE battery_assignments 
                                            SET status = 'returned', 
                                                return_time = datetime('now'),
                                                notes = CASE 
                                                    WHEN notes IS NULL OR notes = '' THEN ? 
                                                    ELSE notes || '; ' || ? 
                                                END
                                            WHERE assignment_id = ?`;
                
                db.run(updateAssignmentSql, [notes || 'Returned', notes || 'Returned', assignmentId], function(err) {
                    if (err) {
                        console.error('Error updating assignment:', err.message);
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    // Update battery status
                    const updateBatterySql = `UPDATE batteries 
                                             SET status = 'available', last_updated = CURRENT_TIMESTAMP 
                                             WHERE battery_number = ?`;
                    
                    db.run(updateBatterySql, [assignment.battery_number], function(err) {
                        if (err) {
                            console.error('Error updating battery status:', err.message);
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        
                        // Log movement
                        const movementSql = `INSERT INTO battery_movements 
                                            (battery_number, from_status, to_status, rider_id, assignment_id, notes)
                                            VALUES (?, 'in_use', 'available', ?, ?, ?)`;
                        
                        db.run(movementSql, [assignment.battery_number, assignment.rider_id, assignmentId, 
                                            notes || 'Battery returned'], function(err) {
                            if (err) {
                                console.error('Error logging movement:', err.message);
                                // Don't fail the transaction for movement logging
                            }
                            
                            db.run('COMMIT');
                            res.json({ message: 'Battery returned successfully' });
                        });
                    });
                });
            });
        });
    });
    
    // Get battery statistics
    router.get('/stats/summary', (req, res) => {
        const queries = {
            total: 'SELECT COUNT(*) as count FROM batteries',
            available: 'SELECT COUNT(*) as count FROM batteries WHERE status = "available"',
            in_use: 'SELECT COUNT(*) as count FROM batteries WHERE status = "in_use"',
            charging: 'SELECT COUNT(*) as count FROM batteries WHERE status = "charging"',
            maintenance: 'SELECT COUNT(*) as count FROM batteries WHERE status = "maintenance"',
            active_assignments: 'SELECT COUNT(*) as count FROM battery_assignments WHERE status = "active"',
            overdue: `SELECT COUNT(*) as count FROM battery_assignments 
                     WHERE status = 'active' 
                     AND datetime(issue_time, '+24 hours') < datetime('now')`
        };
        
        const stats = {};
        let completed = 0;
        const total = Object.keys(queries).length;
        
        for (const [key, sql] of Object.entries(queries)) {
            db.get(sql, [], (err, row) => {
                if (err) {
                    console.error(`Error getting ${key} stat:`, err.message);
                    stats[key] = 0;
                } else {
                    stats[key] = row.count;
                }
                
                completed++;
                if (completed === total) {
                    res.json({ stats });
                }
            });
        }
    });
    
    return router;
};
