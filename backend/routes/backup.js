// backend/routes/backup.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const fs = require('fs');
const path = require('path');

// Create backup
router.get('/create', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `greenspoon-backup-${timestamp}.json`;
    const backupPath = path.join(__dirname, '..', '..', 'backups', backupFilename);
    
    // Collect all data from database
    const backupData = {
      metadata: {
        version: '1.0',
        created_at: new Date().toISOString(),
        system: 'Greenspoon Box Tracker'
      },
      tables: {}
    };
    
    // Get list of tables
    const tables = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    // Backup each table
    for (const table of tables) {
      const tableName = table.name;
      const data = await db.query(`SELECT * FROM ${tableName}`);
      backupData.tables[tableName] = data;
    }
    
    // Write backup file
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    // Record backup in database
    await db.run(
      `INSERT INTO backups (filename, size_bytes, record_count)
       VALUES (?, ?, ?)`,
      [backupFilename, fs.statSync(backupPath).size, Object.keys(backupData.tables).length]
    );
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      filename: backupFilename,
      size: fs.statSync(backupPath).size,
      tables_backed_up: Object.keys(backupData.tables).length,
      download_url: `/api/backup/download/${backupFilename}`
    });
    
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List backups
router.get('/list', async (req, res) => {
  try {
    const backups = await db.query(`
      SELECT * FROM backups 
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    res.json({
      success: true,
      count: backups.length,
      backups: backups
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download backup
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', '..', 'backups', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Backup file not found'
      });
    }
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export data as CSV
router.get('/export/:table', async (req, res) => {
  try {
    const tableName = req.params.table;
    
    // Validate table name to prevent SQL injection
    const validTables = ['riders', 'boxes', 'trips', 'trip_boxes', 'missing_boxes'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name. Allowed: ${validTables.join(', ')}`
      });
    }
    
    const data = await db.query(`SELECT * FROM ${tableName}`);
    
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found for table'
      });
    }
    
    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const escaped = String(value || '').replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        }).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const filename = `${tableName}-export.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;