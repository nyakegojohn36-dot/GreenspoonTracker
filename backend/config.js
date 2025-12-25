const path = require('path');

module.exports = {
    // =========== SERVER CONFIG ===========
    port: process.env.PORT || 3000,
    host: 'localhost',
    env: process.env.NODE_ENV || 'development',
    
    // =========== DATABASE CONFIG ===========
    database: {
        dev: {
            filename: path.join(__dirname, '..', 'database', 'greenspoon.db')
        },
        production: {
            filename: path.join(__dirname, '..', 'database', 'greenspoon-prod.db')
        }
    },
    
    // Alternative path (for compatibility)
    databasePath: path.join(__dirname, '..', 'database', 'greenspoon.db'),
    
    // =========== APPLICATION CONFIG ===========
    app: {
        name: 'Greenspoon Box Tracker',
        companyName: 'Greenspoon Fresh Deliveries',
        defaultLocation: 'Main Warehouse - Sector 5',
        boxPrefix: 'GS',
        version: '1.0.0',
        contactEmail: 'support@greenspoon.com',
        contactPhone: '+1 (555) 123-4567'
    },
    
    // =========== FILE UPLOAD CONFIG ===========
    uploads: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        riderPhotosDir: path.join(__dirname, '..', 'uploads', 'riders')
    },
    
    // Alternative uploads path
    uploadsDir: path.join(__dirname, '..', 'uploads'),
    
    // =========== BACKUP CONFIG ===========
    backups: {
        dir: path.join(__dirname, '..', 'backups'),
        maxBackups: 30, // Keep last 30 backups
        schedule: '0 2 * * *' // 2 AM daily (cron format)
    },
    
    // Alternative backups path
    backupsDir: path.join(__dirname, '..', 'backups'),
    
    // =========== SECURITY CONFIG ===========
    security: {
        jwtSecret: process.env.JWT_SECRET || 'greenspoon-secret-key-change-in-production',
        jwtExpiry: '24h',
        bcryptRounds: 10,
        apiKey: process.env.API_KEY || 'dev-api-key-12345'
    },
    
    // =========== CORS CONFIG ===========
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:8080'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    },
    
    // =========== SCANNER CONFIG ===========
    scanner: {
        autoDetect: true,
        beepOnScan: true,
        vibrateOnScan: false,
        scanTimeout: 2000 // 2 seconds
    },
    
    // =========== REPORTS CONFIG ===========
    reports: {
        defaultFormat: 'pdf',
        saveLocation: path.join(__dirname, '..', 'reports'),
        autoGenerate: ['daily', 'weekly']
    },
    
    // =========== BOXES CONFIG ===========
    boxes: {
        formats: {
            big: 'GS-B-###',
            small: 'GS-S-###'
        },
        defaultStatus: 'available',
        statuses: ['available', 'in_transit', 'with_rider', 'needs_repair', 'retired']
    },
    
    // =========== TRIPS CONFIG ===========
    trips: {
        defaultExpectedReturnHours: 48,
        overdueWarningHours: 24,
        maxActiveTripsPerRider: 5
    },
    
    // =========== LOGGING CONFIG ===========
    logging: {
        level: 'info',
        file: path.join(__dirname, '..', 'logs', 'app.log'),
        console: true
    }
};