/**
 * Database setup script for Greenspoon Box Tracker
 * Creates database tables and seeds with initial data
 */
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

console.log('🚀 Starting database setup...');
console.log('Current directory:', __dirname);
console.log('Config database path:', config.databasePath);

// Ensure directories exist
function ensureDirectories() {
    const directories = [
        path.join(__dirname, '..', 'database'),
        path.join(__dirname, '..', 'uploads'),
        path.join(__dirname, '..', 'uploads', 'riders'),
        path.join(__dirname, '..', 'backups')
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        } else {
            console.log(`✓ Directory exists: ${dir}`);
        }
    });
}

// Create database connection
function setupDatabase() {
    return new Promise((resolve, reject) => {
        console.log(`\n📊 Creating database at: ${config.databasePath}`);
        
        const db = new sqlite3.Database(config.databasePath, (err) => {
            if (err) {
                console.error('❌ Cannot connect to database:', err.message);
                reject(err);
                return;
            }
            console.log('✅ Connected to SQLite database');
            
            // Enable foreign keys
            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) {
                    console.error('❌ Failed to enable foreign keys:', err.message);
                    reject(err);
                    return;
                }
                
                // Create tables
                createTables(db)
                    .then(() => seedInitialData(db))
                    .then(() => {
                        console.log('\n🎉 Database setup completed successfully!');
                        db.close();
                        resolve();
                    })
                    .catch(reject);
            });
        });
    });
}

// Create tables
function createTables(db) {
    return new Promise((resolve, reject) => {
        console.log('\n📝 Creating tables...');
        
        const createTablesSQL = `
            -- Boxes table
            CREATE TABLE IF NOT EXISTS boxes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                box_number TEXT UNIQUE NOT NULL,
                box_type TEXT CHECK(box_type IN ('B', 'S')) NOT NULL,
                status TEXT CHECK(status IN ('available', 'in_transit', 'with_rider', 'needs_repair', 'retired')) DEFAULT 'available',
                qr_code TEXT,
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

            -- Trips table
            CREATE TABLE IF NOT EXISTS trips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trip_type TEXT CHECK(trip_type IN ('departure', 'return')) NOT NULL,
                box_number TEXT NOT NULL,
                box_type TEXT NOT NULL,
                rider_id TEXT,
                rider_name TEXT,
                destination TEXT,
                departure_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expected_return_time TIMESTAMP,
                actual_return_time TIMESTAMP,
                scanned_by TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (box_number) REFERENCES boxes(box_number),
                FOREIGN KEY (rider_id) REFERENCES riders(rider_id)
            );

            -- Trip history table
            CREATE TABLE IF NOT EXISTS trip_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                box_number TEXT NOT NULL,
                action TEXT CHECK(action IN ('departure', 'return', 'repair', 'retire')) NOT NULL,
                rider_id TEXT,
                rider_name TEXT,
                location TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (box_number) REFERENCES boxes(box_number)
            );

            -- Settings table
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        db.exec(createTablesSQL, (err) => {
            if (err) {
                console.error('❌ Failed to create tables:', err.message);
                reject(err);
            } else {
                console.log('✅ Tables created successfully');
                resolve();
            }
        });
    });
}

// Seed initial data
function seedInitialData(db) {
    return new Promise((resolve, reject) => {
        console.log('\n🌱 Seeding initial data...');
        
        // First, check if boxes already exist
        db.get('SELECT COUNT(*) as count FROM boxes', (err, result) => {
            if (err) {
                console.error('❌ Failed to check existing data:', err.message);
                reject(err);
                return;
            }
            
            if (result.count > 0) {
                console.log(`⚠️  Database already has ${result.count} boxes. Skipping seed.`);
                resolve();
                return;
            }
            
            // Insert 50 sample boxes
            const boxes = [];
            
            // Generate 30 big boxes
            for (let i = 1; i <= 30; i++) {
                const boxNum = `GS-B-${i.toString().padStart(3, '0')}`;
                let status = 'available';
                let notes = 'New box, good condition';
                
                if (i === 3) status = 'in_transit';
                if (i === 5) status = 'with_rider';
                if (i === 8) { status = 'needs_repair'; notes = 'Handle loose'; }
                if (i === 12) status = 'in_transit';
                if (i === 15) status = 'with_rider';
                if (i === 19) { status = 'needs_repair'; notes = 'Cracked corner'; }
                if (i === 23) status = 'in_transit';
                if (i === 26) status = 'with_rider';
                if (i === 30) status = 'retired';
                
                boxes.push(`('${boxNum}', 'B', '${status}', '${notes}')`);
            }
            
            // Generate 20 small boxes
            for (let i = 1; i <= 20; i++) {
                const boxNum = `GS-S-${i.toString().padStart(3, '0')}`;
                let status = 'available';
                let notes = 'Small box, good condition';
                
                if (i === 2) status = 'in_transit';
                if (i === 7) status = 'with_rider';
                if (i === 12) { status = 'needs_repair'; notes = 'Latch broken'; }
                if (i === 18) status = 'in_transit';
                if (i === 20) status = 'retired';
                
                boxes.push(`('${boxNum}', 'S', '${status}', '${notes}')`);
            }
            
            const insertSQL = `INSERT INTO boxes (box_number, box_type, status, notes) VALUES ${boxes.join(', ')}`;
            
            db.run(insertSQL, (err) => {
                if (err) {
                    console.error('❌ Failed to seed boxes:', err.message);
                    reject(err);
                } else {
                    console.log(`✅ Seeded ${boxes.length} boxes`);
                    
                    // Insert a sample rider
                    const riderSQL = `
                        INSERT OR IGNORE INTO riders (rider_id, name, phone, email, is_active) 
                        VALUES ('R-001', 'John Delivery', '+1234567890', 'john@greenspoon.com', 1)
                    `;
                    
                    db.run(riderSQL, (err) => {
                        if (err) {
                            console.error('❌ Failed to seed rider:', err.message);
                            reject(err);
                        } else {
                            console.log('✅ Seeded sample rider');
                            resolve();
                        }
                    });
                }
            });
        });
    });
}

// Create indexes
function createIndexes(db) {
    return new Promise((resolve, reject) => {
        console.log('\n📊 Creating indexes...');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_boxes_number ON boxes(box_number)',
            'CREATE INDEX IF NOT EXISTS idx_boxes_status ON boxes(status)',
            'CREATE INDEX IF NOT EXISTS idx_boxes_type ON boxes(box_type)',
            'CREATE INDEX IF NOT EXISTS idx_riders_id ON riders(rider_id)',
            'CREATE INDEX IF NOT EXISTS idx_trips_box ON trips(box_number)',
            'CREATE INDEX IF NOT EXISTS idx_trips_rider ON trips(rider_id)',
            'CREATE INDEX IF NOT EXISTS idx_trips_departure ON trips(departure_time)',
            'CREATE INDEX IF NOT EXISTS idx_trip_history_box ON trip_history(box_number)',
            'CREATE INDEX IF NOT EXISTS idx_trip_history_action ON trip_history(action)'
        ];
        
        let completed = 0;
        indexes.forEach((sql, index) => {
            db.run(sql, (err) => {
                if (err) {
                    console.error(`❌ Failed to create index ${index + 1}:`, err.message);
                    reject(err);
                    return;
                }
                
                completed++;
                if (completed === indexes.length) {
                    console.log('✅ All indexes created successfully');
                    resolve();
                }
            });
        });
    });
}

// Main execution
async function main() {
    try {
        console.log('====================================');
        console.log('GREENSPOON BOX TRACKER - DATABASE SETUP');
        console.log('====================================\n');
        
        // Step 1: Create directories
        ensureDirectories();
        
        // Step 2: Setup database and tables
        await setupDatabase();
        
        // Step 3: Create indexes
        const db = new sqlite3.Database(config.databasePath);
        await createIndexes(db);
        db.close();
        
        console.log('\n====================================');
        console.log('✅ SETUP COMPLETED SUCCESSFULLY!');
        console.log('====================================');
        console.log('\n📁 Directory structure created:');
        console.log(`   database/  → ${path.join(__dirname, '..', 'database')}`);
        console.log(`   uploads/   → ${path.join(__dirname, '..', 'uploads')}`);
        console.log(`   backups/   → ${path.join(__dirname, '..', 'backups')}`);
        console.log('\n🚀 Next steps:');
        console.log('   1. Start server: node server.js');
        console.log('   2. Test API: node test-api.js');
        console.log('   3. Access frontend in browser');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ SETUP FAILED:', error.message);
        process.exit(1);
    }
}

// Run the setup
main();