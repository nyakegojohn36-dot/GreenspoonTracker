// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// Daily report
router.get('/daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get daily summary
    const summary = await db.get(`
      SELECT 
        COUNT(DISTINCT t.id) as total_trips,
        COUNT(DISTINCT t.rider_id) as total_riders,
        SUM(t.total_boxes) as total_boxes_out,
        SUM(t.returned_boxes) as total_boxes_returned,
        SUM(t.missing_boxes) as total_boxes_missing
      FROM trips t
      WHERE DATE(t.departure_time) = ? OR DATE(t.return_time) = ?
    `, [today, today]);
    
    // Get trips for the day
    const trips = await db.query(`
      SELECT t.*, r.vehicle_number
      FROM trips t
      LEFT JOIN riders r ON t.rider_id = r.id
      WHERE DATE(t.departure_time) = ? OR DATE(t.return_time) = ?
      ORDER BY t.departure_time
    `, [today, today]);
    
    // Get missing boxes reported today
    const missingBoxes = await db.query(`
      SELECT mb.*, b.box_type
      FROM missing_boxes mb
      JOIN boxes b ON mb.box_code = b.box_code
      WHERE DATE(mb.reported_at) = ?
      ORDER BY mb.reported_at DESC
    `, [today]);
    
    res.json({
      success: true,
      date: today,
      summary: summary || {
        total_trips: 0,
        total_riders: 0,
        total_boxes_out: 0,
        total_boxes_returned: 0,
        total_boxes_missing: 0
      },
      trips: trips,
      missing_boxes: missingBoxes
    });
    
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;