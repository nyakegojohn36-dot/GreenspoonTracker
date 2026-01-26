const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'greenspoon.db');
const db = new sqlite3.Database(dbPath);

console.log('🌱 Seeding demo data...');

// Demo riders
const riders = [
    { rider_id: 'R-001', name: 'John Kamau', phone: '0712345001', number_plate: 'KAA-100A' },
    { rider_id: 'R-002', name: 'Peter Omondi', phone: '0723456002', number_plate: 'KBB-200B' },
    { rider_id: 'R-003', name: 'David Mwangi', phone: '0734567003', number_plate: 'KCC-300C' },
    { rider_id: 'R-004', name: 'James Kiprop', phone: '0745678004', number_plate: 'KDD-400D' },
    { rider_id: 'R-005', name: 'Samuel Njoroge', phone: '0756789005', number_plate: 'KEE-500E' },
    { rider_id: 'R-006', name: 'Michael Otieno', phone: '0767890006', number_plate: 'KFF-600F' },
    { rider_id: 'R-007', name: 'Daniel Kariuki', phone: '0778901007', number_plate: 'KGG-700G' },
    { rider_id: 'R-008', name: 'Robert Wanjala', phone: '0789012008', number_plate: 'KHH-800H' }
];

// Demo boxes
const boxes = [];
for (let i = 1; i <= 30; i++) {
    boxes.push({
        box_number: `BOX-${String(i).padStart(3, '0')}`,
        box_type: i <= 20 ? 'Standard' : 'Large',
        status: 'available'
    });
}

// Demo batteries
const batteries = [
    { battery_number: 'BAT-001', vehicle_type: 'motorcycle', status: 'available' },
    { battery_number: 'BAT-002', vehicle_type: 'motorcycle', status: 'available' },
    { battery_number: 'BAT-003', vehicle_type: 'motorcycle', status: 'available' },
    { battery_number: 'BAT-004', vehicle_type: 'motorcycle', status: 'available' },
    { battery_number: 'BAT-005', vehicle_type: 'motorcycle', status: 'available' }
];

// Destinations
const destinations = ['Tigoni', 'Nyari', 'Kilimani', 'Lavington', 'Karen', 'Loresho', 'Runda'];

function generateTrips() {
    const trips = [];
    const now = new Date();
    
    // Generate trips for the last 7 days
    for (let day = 0; day < 7; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        
        // 3-5 trips per day
        const tripsPerDay = 3 + Math.floor(Math.random() * 3);
        
        for (let t = 0; t < tripsPerDay; t++) {
            const rider = riders[Math.floor(Math.random() * riders.length)];
            const boxCount = 2 + Math.floor(Math.random() * 8); // 2-10 boxes
            const selectedBoxes = [];
            for (let b = 0; b < boxCount; b++) {
                selectedBoxes.push(`BOX-${String(Math.floor(Math.random() * 30) + 1).padStart(3, '0')}`);
            }
            
            const departureTime = new Date(date);
            departureTime.setHours(7 + Math.floor(Math.random() * 8)); // 7am-3pm
            departureTime.setMinutes(Math.floor(Math.random() * 60));
            
            const returnTime = new Date(departureTime);
            returnTime.setHours(returnTime.getHours() + 2 + Math.floor(Math.random() * 4)); // 2-6 hours later
            
            trips.push({
                trip_id: `TRIP-${Date.now()}-${t}-${day}`,
                rider_id: rider.rider_id,
                rider_name: rider.name,
                boxes: JSON.stringify(selectedBoxes),
                destination: destinations[Math.floor(Math.random() * destinations.length)],
                notes: `Demo trip ${day} days ago`,
                status: 'returned',
                departure_time: departureTime.toISOString(),
                return_time: returnTime.toISOString()
            });
        }
    }
    
    // Add 2 active trips (not returned yet)
    for (let i = 0; i < 2; i++) {
        const rider = riders[i];
        const boxCount = 3 + Math.floor(Math.random() * 5);
        const selectedBoxes = [];
        for (let b = 0; b < boxCount; b++) {
            selectedBoxes.push(`BOX-${String(Math.floor(Math.random() * 30) + 1).padStart(3, '0')}`);
        }
        
        const departureTime = new Date();
        departureTime.setHours(departureTime.getHours() - 2);
        
        trips.push({
            trip_id: `TRIP-${Date.now()}-active-${i}`,
            rider_id: rider.rider_id,
            rider_name: rider.name,
            boxes: JSON.stringify(selectedBoxes),
            destination: destinations[i],
            notes: 'Currently active trip',
            status: 'departed',
            departure_time: departureTime.toISOString(),
            return_time: null
        });
    }
    
    return trips;
}

function generateAttendance() {
    const attendance = [];
    const now = new Date();
    
    // Generate attendance for last 7 days
    for (let day = 0; day < 7; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];
        
        // 4-6 riders per day
        const ridersToday = riders.slice(0, 4 + Math.floor(Math.random() * 3));
        
        ridersToday.forEach(rider => {
            const arrivalHour = 6 + Math.floor(Math.random() * 2); // 6-8am
            const departureHour = 14 + Math.floor(Math.random() * 4); // 2-6pm
            
            attendance.push({
                rider_id: rider.rider_id,
                rider_name: rider.name,
                date: dateStr,
                arrival_time: `${String(arrivalHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                departure_time: `${String(departureHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
            });
        });
    }
    
    return attendance;
}

// Clear existing data
db.serialize(() => {
    console.log('Clearing existing data...');
    db.run('DELETE FROM riders');
    db.run('DELETE FROM boxes');
    db.run('DELETE FROM trips');
    db.run('DELETE FROM batteries');
    db.run('DELETE FROM attendance');
    
    // Insert riders
    console.log('Inserting demo riders...');
    const riderStmt = db.prepare('INSERT INTO riders (rider_id, name, phone, number_plate) VALUES (?, ?, ?, ?)');
    riders.forEach(rider => {
        riderStmt.run(rider.rider_id, rider.name, rider.phone, rider.number_plate);
    });
    riderStmt.finalize();
    
    // Insert boxes
    console.log('Inserting demo boxes...');
    const boxStmt = db.prepare('INSERT INTO boxes (box_number, box_type, status) VALUES (?, ?, ?)');
    boxes.forEach(box => {
        boxStmt.run(box.box_number, box.box_type, box.status);
    });
    boxStmt.finalize();
    
    // Insert batteries
    console.log('Inserting demo batteries...');
    const batteryStmt = db.prepare('INSERT INTO batteries (battery_number, vehicle_type, status) VALUES (?, ?, ?)');
    batteries.forEach(battery => {
        batteryStmt.run(battery.battery_number, battery.vehicle_type, battery.status);
    });
    batteryStmt.finalize();
    
    // Insert trips
    console.log('Inserting demo trips...');
    const trips = generateTrips();
    const tripStmt = db.prepare('INSERT INTO trips (trip_id, rider_id, rider_name, boxes, destination, notes, status, departure_time, return_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    trips.forEach(trip => {
        tripStmt.run(trip.trip_id, trip.rider_id, trip.rider_name, trip.boxes, trip.destination, trip.notes, trip.status, trip.departure_time, trip.return_time);
    });
    tripStmt.finalize();
    
    // Insert attendance
    console.log('Inserting demo attendance...');
    const attendance = generateAttendance();
    const attendanceStmt = db.prepare('INSERT INTO attendance (rider_id, rider_name, date, arrival_time, departure_time) VALUES (?, ?, ?, ?, ?)');
    attendance.forEach(record => {
        attendanceStmt.run(record.rider_id, record.rider_name, record.date, record.arrival_time, record.departure_time);
    });
    attendanceStmt.finalize();
    
    console.log('✅ Demo data seeded successfully!');
    console.log(`   - ${riders.length} riders`);
    console.log(`   - ${boxes.length} boxes`);
    console.log(`   - ${batteries.length} batteries`);
    console.log(`   - ${trips.length} trips`);
    console.log(`   - ${attendance.length} attendance records`);
    
    db.close();
});
