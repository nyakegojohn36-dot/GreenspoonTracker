// ================================================
// GREENSPOON PRODUCTION DATABASE - REAL LOCAL STORAGE
// ================================================

class ProductionDatabase {
    constructor() {
        this.VERSION = '2.0';
        this.DATA_PREFIX = 'GS_PROD_';
        
        this.initializeProductionDatabase();
        this.migrateOldData();
        this.startAutoBackup();
    }
    
    // ============ INITIALIZATION ============
    
    initializeProductionDatabase() {
        // Production defaults
        const defaults = {
            riders: [],
            boxes: [],
            trips: [],
            missing_boxes: [],
            settings: {
                company_name: 'GREESNSPOON',
                location: 'WAREHOUSE 1',
                box_format: 'GS-B-001', // GS-S-001
                missing_alert_hours: 48,
                require_box_validation: true,
                auto_create_missing: false,
                print_labels_on_create: false,
                theme: 'green',
                sound_enabled: true,
                data_retention_days: 90
            },
            metadata: {
                created: new Date().toISOString(),
                last_backup: null,
                total_operations: 0,
                last_maintenance: new Date().toISOString()
            }
        };
        
        // Initialize only if empty
        Object.keys(defaults).forEach(key => {
            const storageKey = this.DATA_PREFIX + key.toUpperCase();
            if (!localStorage.getItem(storageKey)) {
                localStorage.setItem(storageKey, JSON.stringify(defaults[key]));
            }
        });
        
        console.log('✅ Production database initialized');
    }
    
    // ============ PRODUCTION BOX MANAGEMENT ============
    
    /**
     * STRICT box code validation for production
     * Only accepts: GS-B-001 or GS-S-001 format
     */
    validateProductionBoxCode(code) {
        if (!code || typeof code !== 'string') {
            throw new Error('Box code required');
        }
        
        const trimmed = code.trim().toUpperCase();
        
        // Production format only: GS-B-001 or GS-S-001
        if (!trimmed.match(/^GS-[BS]-\d{3}$/)) {
            // Try to convert common variations
            if (trimmed.match(/^\d{3}$/)) {
                return `GS-B-${trimmed}`;
            }
            if (trimmed.match(/^[BS]\d{3}$/i)) {
                const type = trimmed[0].toUpperCase() === 'B' ? 'B' : 'S';
                const num = trimmed.substring(1);
                return `GS-${type}-${num}`;
            }
            throw new Error(`INVALID BOX FORMAT: "${code}". Use GS-B-001 or GS-S-001`);
        }
        
        const num = parseInt(trimmed.split('-')[2]);
        if (num < 1 || num > 999) {
            throw new Error('Box number must be between 001 and 999');
        }
        
        return trimmed;
    }
    
    /**
     * Create box with production validation
     */
    createProductionBox(code, type = 'large', notes = '') {
        try {
            // Strict validation
            const validatedCode = this.validateProductionBoxCode(code);
            
            // Check if box exists
            if (this.getBox(validatedCode)) {
                throw new Error(`Box ${validatedCode} already exists`);
            }
            
            const box = {
                id: this.generateProductionId('BOX'),
                code: validatedCode,
                type: type, // 'large' or 'small'
                status: 'available',
                created: new Date().toISOString(),
                last_used: null,
                total_trips: 0,
                notes: notes,
                qr_code: validatedCode, // QR contains the code itself
                is_active: true
            };
            
            // Save to production storage
            const boxes = this.getBoxes();
            boxes.push(box);
            this.saveData('BOXES', boxes);
            
            // Log production activity
            this.logProductionActivity('BOX_CREATED', {
                code: validatedCode,
                type: type,
                status: 'available'
            });
            
            console.log(`✅ Production box created: ${validatedCode}`);
            return box;
            
        } catch (error) {
            console.error('❌ Box creation failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Bulk import boxes from CSV/Excel
     */
    importProductionBoxes(boxList) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        
        boxList.forEach((boxData, index) => {
            try {
                this.createProductionBox(
                    boxData.code,
                    boxData.type || 'large',
                    boxData.notes || ''
                );
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    index: index + 1,
                    code: boxData.code,
                    error: error.message
                });
            }
        });
        
        return results;
    }
    
    // ============ PRODUCTION RIDER MANAGEMENT ============
    
    /**
     * Create rider with photo and vehicle details
     */
    createProductionRider(data) {
        try {
            // Production validation
            if (!data.name || !data.name.trim()) {
                throw new Error('Rider name is required');
            }
            
            const rider = {
                id: this.generateProductionId('RIDER'),
                name: data.name.trim(),
                phone: (data.phone || '').trim(),
                vehicle_type: data.vehicle_type || '',
                vehicle_number: (data.vehicle_number || '').toUpperCase(),
                emergency_contact: data.emergency_contact || '',
                emergency_phone: data.emergency_phone || '',
                photo: data.photo || '', // Base64 image
                qr_code: `RIDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                status: 'active',
                created: new Date().toISOString(),
                total_trips: 0,
                notes: data.notes || '',
                last_updated: new Date().toISOString()
            };
            
            // Save rider
            const riders = this.getRiders();
            riders.push(rider);
            this.saveData('RIDERS', riders);
            
            // Generate QR code for badge
            this.generateRiderQRCode(rider.id, rider.name);
            
            this.logProductionActivity('RIDER_CREATED', {
                name: rider.name,
                vehicle: rider.vehicle_number
            });
            
            console.log(`✅ Production rider created: ${rider.name}`);
            return rider;
            
        } catch (error) {
            console.error('❌ Rider creation failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Generate printable rider badge with QR
     */
    generateRiderQRCode(riderId, riderName) {
        const qrData = `RIDER-${riderId}`;
        // In production, we'd use a QR library
        // For now, store the data
        return qrData;
    }
    
    // ============ PRODUCTION TRIP MANAGEMENT ============
    
    /**
     * Record box departure
     */
    recordDeparture(riderId, boxCodes, notes = '') {
        try {
            const rider = this.getRider(riderId);
            if (!rider) throw new Error('Rider not found');
            
            // Validate all boxes
            const validatedBoxes = boxCodes.map(code => {
                const validated = this.validateProductionBoxCode(code);
                const box = this.getBox(validated);
                if (!box) throw new Error(`Box ${validated} not found`);
                if (box.status !== 'available') {
                    throw new Error(`Box ${validated} is ${box.status}. Cannot use.`);
                }
                return validated;
            });
            
            // Create trip record
            const trip = {
                id: this.generateProductionId('TRIP'),
                rider_id: riderId,
                rider_name: rider.name,
                boxes: validatedBoxes,
                departure_time: new Date().toISOString(),
                return_time: null,
                returned_boxes: [],
                missing_boxes: [],
                status: 'departed',
                notes: notes,
                location: this.getSettings().location || 'WAREHOUSE'
            };
            
            // Update box statuses
            validatedBoxes.forEach(code => {
                this.updateBoxStatus(code, 'in_use');
            });
            
            // Update rider trip count
            rider.total_trips = (rider.total_trips || 0) + 1;
            this.updateRider(riderId, { total_trips: rider.total_trips });
            
            // Save trip
            const trips = this.getTrips();
            trips.push(trip);
            this.saveData('TRIPS', trips);
            
            this.logProductionActivity('DEPARTURE_RECORDED', {
                rider: rider.name,
                box_count: validatedBoxes.length,
                boxes: validatedBoxes
            });
            
            console.log(`✅ Departure recorded: ${rider.name} with ${validatedBoxes.length} boxes`);
            return trip;
            
        } catch (error) {
            console.error('❌ Departure failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Record box return with missing detection
     */
    recordReturn(riderId, returnedBoxCodes, notes = '') {
        try {
            // Find active trip for rider
            const activeTrips = this.getTrips().filter(t => 
                t.rider_id === riderId && t.status === 'departed'
            );
            
            if (activeTrips.length === 0) {
                throw new Error('No active trip found for this rider');
            }
            
            const trip = activeTrips[0]; // Take most recent
            
            // Validate returned boxes
            const validatedReturned = returnedBoxCodes.map(code => 
                this.validateProductionBoxCode(code)
            );
            
            // Find missing boxes
            const missingBoxes = trip.boxes.filter(box => 
                !validatedReturned.includes(box)
            );
            
            // Update trip
            trip.return_time = new Date().toISOString();
            trip.returned_boxes = validatedReturned;
            trip.missing_boxes = missingBoxes;
            trip.status = 'returned';
            trip.return_notes = notes;
            
            // Update box statuses
            validatedReturned.forEach(code => {
                this.updateBoxStatus(code, 'available');
            });
            
            missingBoxes.forEach(code => {
                this.updateBoxStatus(code, 'missing');
                this.recordMissingBox(code, trip.rider_name, trip.departure_time);
            });
            
            // Save updated trip
            this.saveData('TRIPS', this.getTrips());
            
            this.logProductionActivity('RETURN_RECORDED', {
                rider: trip.rider_name,
                returned: validatedReturned.length,
                missing: missingBoxes.length,
                missing_boxes: missingBoxes
            });
            
            // Alert for missing boxes
            if (missingBoxes.length > 0) {
                this.triggerMissingBoxAlert(missingBoxes, trip.rider_name);
            }
            
            console.log(`✅ Return recorded: ${validatedReturned.length} returned, ${missingBoxes.length} missing`);
            return trip;
            
        } catch (error) {
            console.error('❌ Return failed:', error.message);
            throw error;
        }
    }
    
    // ============ PRODUCTION MISSING BOX SYSTEM ============
    
    recordMissingBox(boxCode, riderName, departureTime) {
        const missingRecord = {
            id: this.generateProductionId('MISSING'),
            box_code: boxCode,
            rider_name: riderName,
            reported_at: new Date().toISOString(),
            departure_time: departureTime,
            resolved: false,
            resolved_at: null,
            notes: '',
            alert_sent: false
        };
        
        const missingBoxes = this.getMissingBoxes();
        missingBoxes.push(missingRecord);
        this.saveData('MISSING_BOXES', missingBoxes);
        
        return missingRecord;
    }
    
    triggerMissingBoxAlert(missingBoxes, riderName) {
        const alert = {
            id: this.generateProductionId('ALERT'),
            type: 'MISSING_BOXES',
            severity: 'HIGH',
            message: `${missingBoxes.length} box(es) missing from ${riderName}'s trip`,
            boxes: missingBoxes,
            timestamp: new Date().toISOString(),
            acknowledged: false
        };
        
        // Play alert sound
        if (this.getSettings().sound_enabled) {
            this.playAlertSound();
        }
        
        // Show browser notification
        if (Notification.permission === 'granted') {
            new Notification('🚨 Missing Box Alert', {
                body: `${missingBoxes.length} box(es) missing`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚨</text></svg>'
            });
        }
        
        return alert;
    }
    
    // ============ PRODUCTION DATA MANAGEMENT ============
    
    /**
     * Export all data for backup
     */
    exportProductionData() {
        const data = {
            version: this.VERSION,
            export_date: new Date().toISOString(),
            company: this.getSettings().company_name,
            location: this.getSettings().location,
            data: {
                riders: this.getRiders(),
                boxes: this.getBoxes(),
                trips: this.getTrips(),
                missing_boxes: this.getMissingBoxes(),
                settings: this.getSettings(),
                metadata: this.getMetadata()
            },
            summary: {
                total_riders: this.getRiders().length,
                total_boxes: this.getBoxes().length,
                active_trips: this.getTrips().filter(t => t.status === 'departed').length,
                missing_boxes: this.getMissingBoxes().filter(m => !m.resolved).length
            }
        };
        
        // Update last backup time
        this.updateMetadata({ last_backup: new Date().toISOString() });
        
        return data;
    }
    
    /**
     * Import data from backup
     */
    importProductionData(backupData) {
        // Validate backup
        if (!backupData.version || !backupData.data) {
            throw new Error('Invalid backup file format');
        }
        
        // Create restore point
        const restorePoint = this.exportProductionData();
        
        try {
            // Import data
            if (backupData.data.riders) {
                this.saveData('RIDERS', backupData.data.riders);
            }
            if (backupData.data.boxes) {
                this.saveData('BOXES', backupData.data.boxes);
            }
            if (backupData.data.trips) {
                this.saveData('TRIPS', backupData.data.trips);
            }
            if (backupData.data.missing_boxes) {
                this.saveData('MISSING_BOXES', backupData.data.missing_boxes);
            }
            if (backupData.data.settings) {
                this.saveData('SETTINGS', backupData.data.settings);
            }
            
            this.logProductionActivity('DATA_IMPORTED', {
                version: backupData.version,
                date: backupData.export_date
            });
            
            console.log('✅ Production data imported successfully');
            return { success: true, restore_point: restorePoint };
            
        } catch (error) {
            // Restore from backup
            this.importProductionData(restorePoint);
            throw new Error(`Import failed. Restored to previous state. Error: ${error.message}`);
        }
    }
    
    // ============ PRODUCTION MAINTENANCE ============
    
    /**
     * Daily maintenance tasks
     */
    runDailyMaintenance() {
        console.log('Running production maintenance...');
        
        // 1. Clean old trips (keep 90 days)
        this.cleanOldTrips();
        
        // 2. Check for overdue trips (more than 7 days)
        this.checkOverdueTrips();
        
        // 3. Auto-backup if not done today
        this.autoBackupIfNeeded();
        
        // 4. Update metadata
        this.updateMetadata({
            last_maintenance: new Date().toISOString(),
            total_operations: (this.getMetadata().total_operations || 0) + 1
        });
        
        console.log('✅ Production maintenance completed');
    }
    
    cleanOldTrips() {
        const retentionDays = this.getSettings().data_retention_days || 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);
        
        const trips = this.getTrips();
        const keptTrips = trips.filter(trip => 
            new Date(trip.departure_time) > cutoff
        );
        
        if (keptTrips.length < trips.length) {
            this.saveData('TRIPS', keptTrips);
            console.log(`🧹 Cleaned ${trips.length - keptTrips.length} old trips`);
        }
    }
    
    // ============ PRODUCTION UTILITIES ============
    
    getBoxes() { return this.getData('BOXES'); }
    getRiders() { return this.getData('RIDERS'); }
    getTrips() { return this.getData('TRIPS'); }
    getMissingBoxes() { return this.getData('MISSING_BOXES'); }
    getSettings() { return this.getData('SETTINGS'); }
    getMetadata() { return this.getData('METADATA'); }
    
    // Individual item getters
    getBox(code) { return this.getBoxes().find(b => b.code === code); }
    getRider(id) { return this.getRiders().find(r => r.id === id); }
    getRiderByCode(code) { return this.getRiders().find(r => r.code === code); }
    
    getData(key) {
        const data = localStorage.getItem(this.DATA_PREFIX + key);
        return data ? JSON.parse(data) : [];
    }
    
    saveData(key, data) {
        localStorage.setItem(this.DATA_PREFIX + key, JSON.stringify(data));
    }
    
    updateBoxStatus(code, status, notes = '') {
        const boxes = this.getBoxes();
        const box = boxes.find(b => b.code === code);
        if (box) {
            box.status = status;
            box.last_used = new Date().toISOString();
            if (notes) box.notes = notes;
            this.saveData('BOXES', boxes);
        }
    }
    
    updateRider(id, updates) {
        const riders = this.getRiders();
        const rider = riders.find(r => r.id === id);
        if (rider) {
            Object.assign(rider, updates);
            rider.last_updated = new Date().toISOString();
            this.saveData('RIDERS', riders);
        }
    }
    
    addRider(riderData) {
        try {
            // Validate required fields
            if (!riderData.name || !riderData.name.trim()) {
                throw new Error('Rider name is required');
            }
            if (!riderData.code || !riderData.code.trim()) {
                throw new Error('Rider code is required');
            }
            
            const rider = {
                id: this.generateProductionId('RIDER'),
                code: riderData.code.trim().toUpperCase(),
                name: riderData.name.trim(),
                phone: (riderData.phone || '').trim(),
                vehicle_type: riderData.vehicle_type || '',
                vehicle_number: (riderData.vehicle_number || '').toUpperCase(),
                emergency_contact: riderData.emergency_contact || '',
                emergency_phone: riderData.emergency_phone || '',
                status: 'active',
                created: new Date().toISOString(),
                total_trips: 0,
                notes: riderData.notes || '',
                last_updated: new Date().toISOString()
            };
            
            // Save rider
            const riders = this.getRiders();
            riders.push(rider);
            this.saveData('RIDERS', riders);
            
            console.log(`✅ Rider added: ${rider.name} (${rider.code})`);
            return rider;
        } catch (error) {
            console.error('Error adding rider:', error);
            return null;
        }
    }
    
    updateMetadata(updates) {
        const metadata = this.getMetadata();
        Object.assign(metadata, updates);
        this.saveData('METADATA', metadata);
    }
    
    generateProductionId(prefix) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`.toUpperCase();
    }
    
    logProductionActivity(action, details = {}) {
        const log = {
            id: this.generateProductionId('LOG'),
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            user_agent: navigator.userAgent.substring(0, 100)
        };
        
        // Get existing logs
        const logs = this.getData('ACTIVITY_LOGS') || [];
        logs.unshift(log);
        
        // Keep only last 1000 logs
        if (logs.length > 1000) logs.pop();
        
        this.saveData('ACTIVITY_LOGS', logs);
    }
    
    startAutoBackup() {
        // Auto-backup every 100 operations or daily
        setInterval(() => {
            this.autoBackupIfNeeded();
        }, 3600000); // Check hourly
    }
    
    autoBackupIfNeeded() {
        const lastBackup = this.getMetadata().last_backup;
        const today = new Date().toISOString().split('T')[0];
        
        if (!lastBackup || !lastBackup.startsWith(today)) {
            this.createAutoBackup();
        }
    }
    
    createAutoBackup() {
        try {
            const backup = this.exportProductionData();
            const backupKey = `AUTO_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}`;
            
            // Compress and store
            const compressed = JSON.stringify(backup);
            localStorage.setItem(backupKey, compressed);
            
            // Keep only last 7 auto-backups
            this.cleanupOldAutoBackups();
            
            console.log('✅ Auto-backup created');
        } catch (error) {
            console.error('❌ Auto-backup failed:', error);
        }
    }
    
    playAlertSound() {
        // Simple beep for missing box alert
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    migrateOldData() {
        // Check for old format data and migrate
        const oldKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('greenspoon_')
        );
        
        if (oldKeys.length > 0) {
            console.log('Migrating old data...');
            // Migration logic here
        }
    }
    
    checkOverdueTrips() {
        const overdueHours = 24 * 7; // 7 days
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - overdueHours);
        
        const activeTrips = this.getTrips().filter(t => t.status === 'departed');
        const overdue = activeTrips.filter(t => 
            new Date(t.departure_time) < cutoff
        );
        
        if (overdue.length > 0) {
            console.warn(`⚠️ ${overdue.length} trips overdue`);
            // Could trigger alerts here
        }
    }
    
    cleanupOldAutoBackups() {
        const backupKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('AUTO_BACKUP_')
        );
        
        // Sort by date (newest first)
        backupKeys.sort().reverse();
        
        // Keep only 7 most recent
        if (backupKeys.length > 7) {
            backupKeys.slice(7).forEach(key => {
                localStorage.removeItem(key);
            });
        }
    }

    // ================================================
    // COMPATIBILITY METHODS FOR APP.JS
    // ================================================

    getDatabase() {
        return {
            riders: this.getRiders(),
            boxes: this.getBoxes(),
            trips: this.getTrips(),
            missingBoxes: this.getMissingBoxes(),
            settings: this.getSettings(),
            metadata: this.getMetadata()
        };
    }

    getStats() {
        const riders = this.getRiders();
        const boxes = this.getBoxes();
        const trips = this.getTrips();
        
        // Calculate today's trips
        const today = new Date().toDateString();
        const todayTrips = trips.filter(trip => 
            new Date(trip.departureTime).toDateString() === today
        ).length;
        
        // Calculate active trips
        const activeTrips = trips.filter(trip => 
            trip.status === 'active' || trip.status === 'in_transit'
        ).length;
        
        // Calculate missing boxes
        const missingBoxes = this.getMissingBoxes().length;
        
        return {
            totalRiders: riders.length,
            totalBoxes: boxes.length,
            todayTrips: todayTrips,
            activeTrips: activeTrips,
            missingBoxes: missingBoxes,
            completedTrips: trips.filter(t => t.status === 'completed').length
        };
    }

    getRecentActivity(limit = 10) {
        const trips = this.getTrips();
        const riders = this.getRiders();
        const boxes = this.getBoxes();
        
        // Get recent trips
        const recentTrips = trips
            .sort((a, b) => new Date(b.departureTime) - new Date(a.departureTime))
            .slice(0, limit);
        
        return recentTrips.map(trip => {
            const rider = riders.find(r => r.id === trip.riderId);
            return {
                id: trip.id,
                type: 'trip',
                action: trip.status === 'completed' ? 'completed' : 'started',
                riderName: rider ? rider.name : 'Unknown Rider',
                boxCount: trip.boxes ? trip.boxes.length : 0,
                timestamp: trip.departureTime,
                location: trip.departureLocation || 'WAREHOUSE'
            };
        });
    }

    getMissingBoxesReport() {
        return this.getMissingBoxes().map(missing => {
            const trip = this.getTrips().find(t => t.id === missing.tripId);
            const rider = trip ? this.getRiders().find(r => r.id === trip.riderId) : null;
            
            return {
                boxCode: missing.boxCode,
                reportedTime: missing.reportedTime,
                riderName: rider ? rider.name : 'Unknown',
                tripId: missing.tripId,
                location: missing.location || 'Unknown',
                status: missing.status || 'missing'
            };
        });
    }
}

// ================================================
// CREATE GLOBAL PRODUCTION DATABASE INSTANCE
// ================================================
const productionDB = new ProductionDatabase();

// Make it globally available
window.productionDB = productionDB;
window.DB = productionDB; // For compatibility with existing code

// Run maintenance on load
window.addEventListener('load', () => {
    setTimeout(() => {
        productionDB.runDailyMaintenance();
    }, 5000);
});

console.log('🚀 Greenspoon Production Database READY');