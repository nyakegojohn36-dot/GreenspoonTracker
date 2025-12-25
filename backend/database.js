const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');

class Database {
    constructor() {
        console.log('📊 Initializing database...');
        
        // FIXED: Handle both config structures
        if (config.database && config.database.dev && config.database.dev.filename) {
            this.dbPath = config.database.dev.filename;
        } else if (config.databasePath) {
            this.dbPath = config.databasePath;
        } else {
            // Default path if nothing else works
            this.dbPath = path.join(__dirname, '..', 'database', 'greenspoon.db');
        }
        
        console.log(`📁 Database path: ${this.dbPath}`);
        this.db = null;
        this.initialized = false;
        this.initPromise = this.initDatabase();
    }
    
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initPromise;
            this.initialized = true;
        }
    }
    
    initDatabase() {
        return new Promise((resolve, reject) => {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            const fs = require('fs');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
                console.log(`✅ Created directory: ${dbDir}`);
            }
            
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Database connection error:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database');
                    this.db.run('PRAGMA foreign_keys = ON');
                    this.createTables().then(() => {
                        console.log('✅ Database fully initialized');
                        this.initialized = true;
                        resolve();
                    }).catch(reject);
                }
            });
        });
    }
    
    createTables() {
        return new Promise((resolve, reject) => {
            const sql = `
                -- Boxes table
                CREATE TABLE IF NOT EXISTS boxes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    box_number TEXT UNIQUE NOT NULL,
                    box_type TEXT CHECK(box_type IN ('B', 'S')) NOT NULL,
                    status TEXT CHECK(status IN ('available', 'in_transit', 'with_rider', 'needs_repair', 'retired')) DEFAULT 'available',
                    qr_code TEXT,
                    color TEXT DEFAULT '#4361ee',
                    trip_id TEXT,
                    rider_id TEXT,
                    rider_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                );
                
                -- Riders table
                CREATE TABLE IF NOT EXISTS riders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rider_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    phone TEXT,
                    email TEXT,
                    photo_path TEXT,
                    is_active INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                );
                
                -- NEW: Trips table with correct schema for frontend
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
                );
                
                -- Box movements tracking
                CREATE TABLE IF NOT EXISTS box_movements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    box_number TEXT NOT NULL,
                    from_status TEXT,
                    to_status TEXT,
                    rider_id TEXT,
                    trip_id TEXT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (box_number) REFERENCES boxes(box_number),
                    FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
                );
                
                -- Ensure the old trips table is migrated if it exists
                CREATE TABLE IF NOT EXISTS old_trips_backup (
                    id INTEGER,
                    trip_type TEXT,
                    box_number TEXT,
                    box_type TEXT,
                    rider_id TEXT,
                    rider_name TEXT,
                    destination TEXT,
                    departure_time TIMESTAMP,
                    expected_return_time TIMESTAMP,
                    actual_return_time TIMESTAMP,
                    scanned_by TEXT,
                    notes TEXT,
                    created_at TIMESTAMP,
                    backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;
            
            this.db.exec(sql, (err) => {
                if (err) {
                    console.error('❌ Table creation error:', err.message);
                    reject(err);
                } else {
                    console.log('✅ All tables created successfully');
                    this.migrateOldData().then(() => {
                        this.seedInitialData().then(resolve).catch(resolve); // Continue even if seeding fails
                    }).catch(resolve); // Continue even if migration fails
                }
            });
        });
    }
    
    async migrateOldData() {
        try {
            // Check if old trips table exists (with old schema)
            const oldTableExists = await this.get(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='trips'"
            );
            
            if (oldTableExists) {
                // Check if old table has different schema
                const oldSchema = await this.all("PRAGMA table_info(trips)");
                const hasTripTypeColumn = oldSchema.some(col => col.name === 'trip_type');
                
                if (hasTripTypeColumn) {
                    console.log('🔄 Migrating old trips data...');
                    
                    // Backup old data
                    await this.run(
                        `INSERT INTO old_trips_backup 
                         SELECT *, NULL FROM trips`
                    );
                    
                    // Migrate old departure trips to new format
                    const oldTrips = await this.all(
                        `SELECT * FROM trips WHERE trip_type = 'departure'`
                    );
                    
                    for (const oldTrip of oldTrips) {
                        // Generate new trip_id
                        const newTripId = `TRIP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
                        
                        // Insert into new trips table
                        await this.run(
                            `INSERT INTO trips (trip_id, rider_id, rider_name, boxes, destination, notes, status, departure_time, created_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                newTripId,
                                oldTrip.rider_id || '',
                                oldTrip.rider_name || '',
                                JSON.stringify([oldTrip.box_number]),
                                oldTrip.destination || '',
                                oldTrip.notes || '',
                                'departed',
                                oldTrip.departure_time || new Date().toISOString(),
                                oldTrip.created_at || new Date().toISOString()
                            ]
                        );
                        
                        // Update box with new trip_id
                        await this.run(
                            `UPDATE boxes SET trip_id = ?, status = 'in_transit' WHERE box_number = ?`,
                            [newTripId, oldTrip.box_number]
                        );
                    }
                    
                    console.log(`✅ Migrated ${oldTrips.length} old trips to new format`);
                }
            }
        } catch (error) {
            console.log('⚠️ No migration needed or migration failed:', error.message);
        }
    }
    
    async seedInitialData() {
        try {
            // Check if we need to seed
            const boxCount = await this.get('SELECT COUNT(*) as count FROM boxes');
            const riderCount = await this.get('SELECT COUNT(*) as count FROM riders');
            const tripCount = await this.get('SELECT COUNT(*) as count FROM trips');
            
            console.log(`📊 Current counts - Boxes: ${boxCount.count}, Riders: ${riderCount.count}, Trips: ${tripCount.count}`);
            
            // Seed boxes if empty
            if (boxCount.count === 0) {
                console.log('📦 Seeding sample boxes...');
                const boxes = [
                    { number: 'GS-B-001', type: 'B' },
                    { number: 'GS-B-002', type: 'B' },
                    { number: 'GS-B-003', type: 'B' },
                    { number: 'GS-S-001', type: 'S' },
                    { number: 'GS-S-002', type: 'S' },
                    { number: 'GS-S-003', type: 'S' }
                ];
                
                for (const box of boxes) {
                    await this.run(
                        `INSERT INTO boxes (box_number, box_type, status, color) VALUES (?, ?, 'available', ?)`,
                        [box.number, box.type, box.type === 'B' ? '#4361ee' : '#06d6a0']
                    );
                }
                console.log(`✅ Seeded ${boxes.length} boxes`);
            }
            
            // Seed riders if empty
            if (riderCount.count === 0) {
                console.log('🚴 Seeding sample riders...');
                const riders = [
                    { id: 'R-001', name: 'John Delivery', phone: '555-0101' },
                    { id: 'R-002', name: 'Sarah Rider', phone: '555-0102' },
                    { id: 'R-003', name: 'Mike Courier', phone: '555-0103' }
                ];
                
                for (const rider of riders) {
                    await this.run(
                        `INSERT INTO riders (rider_id, name, phone) VALUES (?, ?, ?)`,
                        [rider.id, rider.name, rider.phone]
                    );
                }
                console.log(`✅ Seeded ${riders.length} riders`);
            }
            
            // Seed a sample trip if no trips exist
            if (tripCount.count === 0) {
                console.log('🗺️ Seeding sample trip...');
                
                // Get first rider
                const rider = await this.get('SELECT * FROM riders LIMIT 1');
                const boxes = await this.all('SELECT box_number FROM boxes LIMIT 2');
                
                if (rider && boxes.length > 0) {
                    const tripId = `TRIP-${Date.now()}`;
                    const boxNumbers = boxes.map(b => b.box_number);
                    
                    await this.run(
                        `INSERT INTO trips (trip_id, rider_id, rider_name, boxes, destination, notes, status, departure_time)
                         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'))`,
                        [
                            tripId,
                            rider.rider_id,
                            rider.name,
                            JSON.stringify(boxNumbers),
                            'Downtown Market',
                            'Sample trip for testing',
                            'departed'
                        ]
                    );
                    
                    // Update boxes status
                    for (const boxNumber of boxNumbers) {
                        await this.run(
                            `UPDATE boxes SET 
                                status = 'in_transit',
                                rider_id = ?,
                                rider_name = ?,
                                trip_id = ?,
                                last_updated = CURRENT_TIMESTAMP
                             WHERE box_number = ?`,
                            [rider.rider_id, rider.name, tripId, boxNumber]
                        );
                    }
                    
                    console.log('✅ Seeded sample trip');
                }
            }
            
        } catch (error) {
            console.log('⚠️ Seeding skipped or failed:', error.message);
        }
    }
    
    // ✅ ADDED: Check if trips table has correct schema
    async checkTripsSchema() {
        try {
            const schema = await this.all("PRAGMA table_info(trips)");
            const requiredColumns = ['trip_id', 'rider_id', 'rider_name', 'boxes', 'status', 'departure_time'];
            
            const missingColumns = requiredColumns.filter(col => 
                !schema.some(s => s.name === col)
            );
            
            if (missingColumns.length > 0) {
                console.log('⚠️ Trips table missing columns:', missingColumns);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error checking trips schema:', error);
            return false;
        }
    }
    
    // ✅ ADDED: Fix trips table if needed
    async fixTripsTable() {
        try {
            console.log('🔧 Checking trips table...');
            
            // Check if table exists
            const tableExists = await this.get(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='trips'"
            );
            
            if (!tableExists) {
                console.log('🔄 Creating trips table...');
                await this.run(`
                    CREATE TABLE trips (
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
                    )
                `);
                console.log('✅ Created trips table');
            }
            
            // Verify schema
            const schemaOk = await this.checkTripsSchema();
            if (!schemaOk) {
                console.log('🔄 Recreating trips table with correct schema...');
                
                // Backup and recreate
                await this.run('ALTER TABLE trips RENAME TO trips_old');
                
                await this.run(`
                    CREATE TABLE trips (
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
                    )
                `);
                
                // Try to migrate data if possible
                try {
                    const oldData = await this.all('SELECT * FROM trips_old');
                    console.log(`📋 Found ${oldData.length} old records to migrate`);
                    
                    // Here you could add migration logic for old data
                } catch (migError) {
                    console.log('⚠️ Could not migrate old data:', migError.message);
                }
                
                console.log('✅ Trips table recreated with correct schema');
            }
            
            console.log('✅ Trips table is ready');
            return true;
            
        } catch (error) {
            console.error('❌ Error fixing trips table:', error);
            return false;
        }
    }
    
    // ✅ TEST method
    async testConnection() {
        try {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT 1 as test', (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ connected: true, test: result });
                    }
                });
            });
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }
    
    // ✅ GET all trips with rider info
    async getAllTrips() {
        await this.ensureInitialized();
        return this.all(`
            SELECT 
                t.*,
                r.phone as rider_phone,
                r.email as rider_email
            FROM trips t
            LEFT JOIN riders r ON t.rider_id = r.rider_id
            ORDER BY t.departure_time DESC
        `);
    }
    
    // ✅ GET trips by status
    async getTripsByStatus(status) {
        await this.ensureInitialized();
        return this.all(
            `SELECT * FROM trips WHERE status = ? ORDER BY departure_time DESC`,
            [status]
        );
    }
    
    // ✅ GET trip by ID
    async getTripById(tripId) {
        await this.ensureInitialized();
        return this.get(
            `SELECT 
                t.*,
                r.phone as rider_phone,
                r.email as rider_email
             FROM trips t
             LEFT JOIN riders r ON t.rider_id = r.rider_id
             WHERE t.id = ? OR t.trip_id = ?`,
            [tripId, tripId]
        );
    }
    
    // ✅ CREATE new trip (simplified interface)
    async createTrip(tripData) {
        await this.ensureInitialized();
        
        const {
            rider_id,
            rider_name,
            boxes,
            destination = '',
            notes = '',
            status = 'departed'
        } = tripData;
        
        // Generate trip ID
        const trip_id = `TRIP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Insert trip
        const result = await this.run(
            `INSERT INTO trips (trip_id, rider_id, rider_name, boxes, destination, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                trip_id,
                rider_id,
                rider_name,
                JSON.stringify(boxes),
                destination,
                notes,
                status
            ]
        );
        
        return {
            id: result.lastID,
            trip_id,
            ...tripData
        };
    }
    
    // Basic query methods
    async run(sql, params = []) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }
    
    async get(sql, params = []) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    
    async all(sql, params = []) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    // Get all boxes
    getAllBoxes() {
        return this.all('SELECT * FROM boxes ORDER BY box_number');
    }
    
    // Get box by number
    getBox(boxNumber) {
        return this.get('SELECT * FROM boxes WHERE box_number = ?', [boxNumber]);
    }
    
    // Close connection
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// Create and export instance
const dbInstance = new Database();

// Add a health check method
dbInstance.healthCheck = async () => {
    try {
        await dbInstance.ensureInitialized();
        await dbInstance.fixTripsTable(); // Ensure trips table exists
        
        const tables = await dbInstance.all(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        );
        
        const health = {
            connected: true,
            tables: tables.map(t => t.name),
            tripsReady: await dbInstance.checkTripsSchema()
        };
        
        console.log('✅ Database health check:', health);
        return health;
        
    } catch (error) {
        return {
            connected: false,
            error: error.message,
            tripsReady: false
        };
    }
};

module.exports = dbInstance;