const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'greenspoon.db');
const db = new sqlite3.Database(dbPath);

console.log('📊 Checking database schema...\n');

// Check if battery tables exist
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('✅ Tables in database:');
    tables.forEach(table => {
        console.log(`   - ${table.name}`);
    });
    
    const batteryTables = tables.filter(t => 
        t.name === 'batteries' || 
        t.name === 'battery_assignments' || 
        t.name === 'battery_movements'
    );
    
    console.log(`\n🔋 Battery-related tables found: ${batteryTables.length}`);
    
    if (batteryTables.length > 0) {
        console.log('\n✅ Battery management tables created successfully!');
        
        // Show schema for battery tables
        batteryTables.forEach(table => {
            console.log(`\n📋 Schema for ${table.name}:`);
            db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                if (!err) {
                    columns.forEach(col => {
                        console.log(`   ${col.name}: ${col.type}`);
                    });
                }
            });
        });
    } else {
        console.log('\n❌ Battery management tables not found!');
    }
    
    // Close after a short delay to let PRAGMA queries finish
    setTimeout(() => {
        db.close();
        console.log('\n✅ Database check complete!');
    }, 1000);
});
