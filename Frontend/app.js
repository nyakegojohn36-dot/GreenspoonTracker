// app.js - Main Application Controller (Updated for GLB/GSB)
class GreenspoonTracker {
    constructor() {
        this.init();
    }

    init() {
        console.log('Greenspoon Tracker Initializing...');
        
        // Initialize components
        this.setupEventListeners();
        this.updateClock();
        this.updateDashboard();
        this.loadRecentActivity();
        this.loadMissingBoxes();
        this.loadRidersList(); // Load riders on startup
        this.loadBoxesList(); // Load boxes on startup
        
        // Check for browser compatibility
        this.checkCompatibility();
        
        console.log('Greenspoon Tracker Ready!');
    }

    setupEventListeners() {
        // Quick Search
        const quickSearch = document.getElementById('quickSearch');
        if (quickSearch) {
            quickSearch.addEventListener('input', (e) => this.handleQuickSearch(e.target.value));
            quickSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }
        
        // Search Button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = quickSearch?.value || '';
                this.performSearch(query);
            });
        }
        
        // Add Rider Button
        const addRiderBtn = document.getElementById('addRiderBtn');
        if (addRiderBtn) {
            addRiderBtn.addEventListener('click', () => this.showRiderRegistrationModal());
        }
        
        // Reports Button
        const reportsBtn = document.getElementById('reportsBtn');
        if (reportsBtn) {
            reportsBtn.addEventListener('click', () => this.generateDailyReport());
        }
        
        // Export Button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // Settings Button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }
        
        // Refresh Button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.updateDashboard();
                this.loadRecentActivity();
                this.loadMissingBoxes();
                this.loadRidersList();
                this.loadBoxesList();
                this.showMessage('Data refreshed', 'success');
            });
        }
        
        // Backup Button
        const backupBtn = document.getElementById('backupBtn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.backupData());
        }
        
        // Rider Search and Filter Events
        const searchRidersEl = document.getElementById('riderSearchFilter');
        const filterStatusEl = document.getElementById('riderStatusFilter');
        
        // Clear Filters Button
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearRiderFilters();
            });
        }
        
        if (searchRidersEl) {
            searchRidersEl.addEventListener('input', (e) => {
                this.filterRiders();
            });
        }
        
        if (filterStatusEl) {
            filterStatusEl.addEventListener('change', () => {
                this.filterRiders();
            });
        }
        
        // Box Search and Filter Events
        const boxSearchEl = document.getElementById('boxSearchFilter');
        const boxTypeEl = document.getElementById('boxTypeFilter');
        const boxStatusEl = document.getElementById('boxStatusFilter');
        
        if (boxSearchEl) {
            boxSearchEl.addEventListener('input', (e) => {
                this.filterBoxes();
            });
        }
        
        if (boxTypeEl) {
            boxTypeEl.addEventListener('change', () => {
                this.filterBoxes();
            });
        }
        
        if (boxStatusEl) {
            boxStatusEl.addEventListener('change', () => {
                this.filterBoxes();
            });
        }
        
        // Rider modal close - handled by Bootstrap data-bs-dismiss
        // const closeRiderModalBtn = document.getElementById('closeRiderModal');
        // if (closeRiderModalBtn) {
        //     closeRiderModalBtn.addEventListener('click', () => {
        //         this.hideRiderModal();
        //     });
        // }
        
        // Cancel rider button - handled by Bootstrap data-bs-dismiss
        // const cancelRiderBtn = document.getElementById('cancelRiderBtn');
        // if (cancelRiderBtn) {
        //     cancelRiderBtn.addEventListener('click', () => {
        //         this.hideRiderModal();
        //     });
        // }
        
        // Photo upload
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
            photoPreview.addEventListener('click', () => {
                const riderPhoto = document.getElementById('riderPhoto');
                if (riderPhoto) riderPhoto.click();
            });
        }
        
        const riderPhoto = document.getElementById('riderPhoto');
        if (riderPhoto) {
            riderPhoto.addEventListener('change', (e) => {
                this.handlePhotoUpload(e);
            });
        }
        
        // Form submission
        const riderForm = document.getElementById('riderRegistrationForm');
        if (riderForm) {
            riderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveRider();
            });
        }
        
        // QR Code buttons
        const printQrBtn = document.getElementById('printQrBtn');
        if (printQrBtn) {
            printQrBtn.addEventListener('click', () => {
                this.printRiderQRCode();
            });
        }
        
        const saveQrBtn = document.getElementById('saveQrBtn');
        if (saveQrBtn) {
            saveQrBtn.addEventListener('click', () => {
                this.saveRiderQRCode();
            });
        }
        
        // Take photo button
        const takePhotoBtn = document.getElementById('takePhotoBtn');
        if (takePhotoBtn) {
            takePhotoBtn.addEventListener('click', () => {
                this.takePhotoWithCamera();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+D for Departure mode
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                if (window.ScannerApp) ScannerApp.setMode('departure');
            }
            
            // Ctrl+R for Return mode
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                if (window.ScannerApp) ScannerApp.setMode('return');
            }
            
            // Ctrl+F to focus search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                if (quickSearch) quickSearch.focus();
            }
            
            // Ctrl+Shift+F to focus rider search
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                if (searchRidersEl) searchRidersEl.focus();
            }
            
            // Ctrl+R to refresh (only if not in input field)
            if (e.ctrlKey && e.key === 'r' && !e.shiftKey) {
                if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                    e.preventDefault();
                    if (refreshBtn) refreshBtn.click();
                }
            }
            
            // Escape to clear scanner input
            if (e.key === 'Escape') {
                const scannerInput = document.getElementById('scannerInput');
                if (scannerInput) scannerInput.value = '';
                
                // Also close any open modals
                const modals = document.querySelectorAll('.modal-overlay[style*="display: flex"]');
                modals.forEach(modal => {
                    modal.style.display = 'none';
                });
                
                // Clear filters if Escape is pressed in search
                if (document.activeElement === searchRidersEl) {
                    this.clearRiderFilters();
                }
            }
        });
    }

    updateClock() {
        const update = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit' 
            });
            const dateString = now.toLocaleDateString([], { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const clockElement = document.getElementById('liveClock');
            const dateElement = document.getElementById('currentDate');
            
            if (clockElement) clockElement.textContent = timeString;
            if (dateElement) dateElement.textContent = dateString;
        };
        
        // Update immediately
        update();
        
        // Update every second
        setInterval(update, 1000);
    }

    updateDashboard() {
        try {
            const stats = DB.getStats();
            
            // Update all stat elements
            const statElements = {
                'totalRiders': stats.totalRiders || 0,
                'totalBoxes': stats.totalBoxes || 0,
                'todayTrips': stats.todayTrips || 0,
                'activeTrips': stats.activeTrips || 0,
                'missingBoxes': stats.missingBoxes || 0,
                'availableBoxes': stats.availableBoxes || 0,
                'inUseBoxes': stats.inUseBoxes || 0,
                'totalTrips': stats.totalTrips || 0,
                'largeBoxes': stats.largeBoxes || 0,
                'smallBoxes': stats.smallBoxes || 0,
                'availableLargeBoxes': stats.availableLargeBoxes || 0,
                'availableSmallBoxes': stats.availableSmallBoxes || 0,
                'inUseLargeBoxes': stats.inUseLargeBoxes || 0,
                'inUseSmallBoxes': stats.inUseSmallBoxes || 0
            };
            
            Object.entries(statElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                    
                    // Add animation for changes
                    if (parseInt(element.dataset.lastValue || 0) !== value) {
                        element.classList.add('updated');
                        setTimeout(() => element.classList.remove('updated'), 1000);
                        element.dataset.lastValue = value;
                    }
                }
            });
            
            // Update progress bars if they exist
            this.updateProgressBars(stats);
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }
    
    updateProgressBars(stats) {
        try {
            // Calculate percentages for visual indicators
            const totalBoxes = stats.totalBoxes || 1; // Avoid division by zero
            const availablePercent = ((stats.availableBoxes || 0) / totalBoxes) * 100;
            const inUsePercent = ((stats.inUseBoxes || 0) / totalBoxes) * 100;
            const missingPercent = ((stats.missingBoxes || 0) / totalBoxes) * 100;
            
            // Update progress bars if they exist
            const progressBars = {
                'availableProgress': { percent: availablePercent, color: '#4caf50' },
                'inUseProgress': { percent: inUsePercent, color: '#2196f3' },
                'missingProgress': { percent: missingPercent, color: '#f44336' }
            };
            
            Object.entries(progressBars).forEach(([id, data]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.style.width = `${Math.min(data.percent, 100)}%`;
                    element.style.backgroundColor = data.color;
                    
                    // Update label if exists
                    const label = document.getElementById(`${id}Label`);
                    if (label) {
                        label.textContent = `${Math.round(data.percent)}%`;
                    }
                }
            });
        } catch (error) {
            console.error('Error updating progress bars:', error);
        }
    }

    loadRecentActivity() {
        try {
            const activity = DB.getRecentActivity(5);
            const activityContainer = document.getElementById('activityFeed');
            
            if (!activityContainer) return;
            
            activityContainer.innerHTML = '';
            
            if (activity.length === 0) {
                activityContainer.innerHTML = `
                    <div class="empty-activity">
                        📭 No recent activity
                        <small>Scan some boxes to see activity here</small>
                    </div>
                `;
                return;
            }
            
            activity.forEach(item => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                
                const icon = item.type === 'departure' ? '🎒' : '📦';
                const typeClass = item.type === 'departure' ? 'departure' : 'return';
                const time = new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const date = new Date(item.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                let boxesText = `${item.boxes.length} box${item.boxes.length !== 1 ? 'es' : ''}`;
                if (item.largeBoxCount || item.smallBoxCount) {
                    boxesText = `${item.largeBoxCount || 0} large, ${item.smallBoxCount || 0} small`;
                }
                if (item.missingBoxes && item.missingBoxes.length > 0) {
                    boxesText += ` (${item.missingBoxes.length} missing)`;
                }
                
                activityItem.innerHTML = `
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-details">
                        <div class="activity-title">
                            <span class="activity-type ${typeClass}">${item.type}</span>
                            <span class="activity-rider">${item.riderName || 'Unknown'}</span>
                        </div>
                        <div class="activity-info">
                            <span class="activity-boxes">${boxesText}</span>
                            <span class="activity-time">${date} ${time}</span>
                        </div>
                    </div>
                `;
                
                // Add click to view trip details
                activityItem.addEventListener('click', () => {
                    this.viewTripDetails(item.id);
                });
                
                activityContainer.appendChild(activityItem);
            });
        } catch (error) {
            console.error('Error loading recent activity:', error);
            const activityContainer = document.getElementById('activityFeed');
            if (activityContainer) {
                activityContainer.innerHTML = `
                    <div class="empty-activity">
                        ⚠️ Error loading activity
                        <small>Please refresh the page</small>
                    </div>
                `;
            }
        }
    }
    
    viewTripDetails(tripId) {
        try {
            const trip = DB.getDatabase().trips.find(t => t.id === tripId);
            if (!trip) return;
            
            const rider = DB.getDatabase().riders.find(r => r.id === trip.riderId);
            const boxes = trip.boxes.map(boxCode => {
                const box = DB.getBoxByCode(boxCode);
                return { 
                    code: boxCode, 
                    type: box?.type || 'Unknown', 
                    typeName: box?.type === 'GLB' ? 'Large' : 'Small',
                    status: box?.status || 'unknown' 
                };
            });
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${trip.type === 'departure' ? '🎒 Departure' : '📦 Return'} Details</h3>
                        <button class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="trip-details">
                            <div class="detail-row">
                                <strong>Rider:</strong> ${rider?.name || 'Unknown'} (${rider?.code || 'No code'})
                            </div>
                            <div class="detail-row">
                                <strong>Time:</strong> ${new Date(trip.startTime).toLocaleString()}
                            </div>
                            ${trip.endTime ? `<div class="detail-row">
                                <strong>Completed:</strong> ${new Date(trip.endTime).toLocaleString()}
                            </div>` : ''}
                            <div class="detail-row">
                                <strong>Boxes (${boxes.length}):</strong>
                                ${trip.largeBoxCount ? `<span class="box-count large">${trip.largeBoxCount} large</span>` : ''}
                                ${trip.smallBoxCount ? `<span class="box-count small">${trip.smallBoxCount} small</span>` : ''}
                            </div>
                            <div class="box-list">
                                ${boxes.map(box => `
                                    <div class="box-item ${box.status}">
                                        <span class="box-code">${box.code}</span>
                                        <span class="box-type ${box.type === 'GLB' ? 'large' : 'small'}">${box.typeName}</span>
                                        <span class="box-status">${box.status}</span>
                                    </div>
                                `).join('')}
                            </div>
                            ${trip.notes ? `<div class="detail-row">
                                <strong>Notes:</strong> ${trip.notes}
                            </div>` : ''}
                            ${trip.missingBoxes && trip.missingBoxes.length > 0 ? `
                            <div class="detail-row warning">
                                <strong>Missing Boxes:</strong> ${trip.missingBoxes.length}
                                <div class="missing-boxes">
                                    ${trip.missingBoxes.map(code => {
                                        const box = DB.getBoxByCode(code);
                                        return `<div>${code} (${box?.type === 'GLB' ? 'Large' : 'Small'})</div>`;
                                    }).join('')}
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary close-modal">Close</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close handlers
            modal.querySelector('.btn-close').addEventListener('click', () => modal.remove());
            modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        } catch (error) {
            console.error('Error viewing trip details:', error);
            this.showMessage('Error loading trip details', 'error');
        }
    }

    loadMissingBoxes() {
        try {
            const missing = DB.getMissingBoxesReport();
            const missingContainer = document.getElementById('missingBoxesList');
            
            if (!missingContainer) return;
            
            missingContainer.innerHTML = '';
            
            if (missing.length === 0) {
                missingContainer.innerHTML = `
                    <div class="empty-state">
                        ✅ All boxes accounted for!
                        <small>No missing boxes to report</small>
                    </div>
                `;
                
                // Update missing count
                const missingCount = document.getElementById('missingBoxesCount');
                if (missingCount) {
                    missingCount.textContent = '0';
                    missingCount.parentElement.classList.remove('has-missing');
                }
                return;
            }
            
            missing.forEach(item => {
                const missingItem = document.createElement('div');
                missingItem.className = 'missing-item';
                
                const hoursMissing = item.hoursMissing || Math.floor((new Date() - new Date(item.missingSince)) / (1000 * 60 * 60));
                const daysMissing = Math.floor(hoursMissing / 24);
                
                let timeText = `${hoursMissing}h ago`;
                if (daysMissing > 0) {
                    timeText = `${daysMissing}d ${hoursMissing % 24}h ago`;
                }
                
                // Color code based on how long missing
                let urgencyClass = 'normal';
                if (hoursMissing > 72) urgencyClass = 'critical';
                else if (hoursMissing > 24) urgencyClass = 'high';
                
                const typeIcon = item.boxType === 'Large' ? '📦' : '🧺';
                
                missingItem.innerHTML = `
                    <div class="missing-box-code ${urgencyClass}">
                        ${typeIcon} ${item.boxCode}
                        <span class="box-type-badge ${item.boxType === 'Large' ? 'large' : 'small'}">${item.boxType}</span>
                    </div>
                    <div class="missing-details">
                        <div class="missing-info">
                            <span class="missing-rider">${item.riderName}</span>
                            <span class="missing-time ${urgencyClass}">${timeText}</span>
                        </div>
                        <button class="btn-resolve" data-box="${item.boxCode}">
                            <span class="resolve-icon">✓</span> Mark Found
                        </button>
                    </div>
                `;
                
                missingContainer.appendChild(missingItem);
                
                // Add resolve button event
                missingItem.querySelector('.btn-resolve').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.resolveMissingBox(e.target.dataset.box || e.currentTarget.dataset.box);
                });
                
                // Click to view box details
                missingItem.addEventListener('click', (e) => {
                    if (!e.target.closest('.btn-resolve')) {
                        this.viewBoxDetails(item.boxCode);
                    }
                });
            });
            
            // Update missing count
            const missingCount = document.getElementById('missingBoxesCount');
            if (missingCount) {
                missingCount.textContent = missing.length;
                missingCount.parentElement.classList.toggle('has-missing', missing.length > 0);
                
                // Add urgency indicator
                const urgentMissing = missing.filter(item => {
                    const hoursMissing = item.hoursMissing || Math.floor((new Date() - new Date(item.missingSince)) / (1000 * 60 * 60));
                    return hoursMissing > 24;
                }).length;
                
                if (urgentMissing > 0) {
                    missingCount.title = `${urgentMissing} missing for over 24 hours!`;
                    missingCount.classList.add('urgent');
                } else {
                    missingCount.classList.remove('urgent');
                }
            }
        } catch (error) {
            console.error('Error loading missing boxes:', error);
            const missingContainer = document.getElementById('missingBoxesList');
            if (missingContainer) {
                missingContainer.innerHTML = `
                    <div class="empty-state">
                        ⚠️ Error loading missing boxes
                        <small>Please refresh the page</small>
                    </div>
                `;
            }
        }
    }
    
    viewBoxDetails(boxCode) {
        try {
            const box = DB.getBoxByCode(boxCode);
            if (!box) {
                this.showMessage('Box not found', 'error');
                return;
            }
            
            const tripsWithBox = DB.getDatabase().trips.filter(t => t.boxes.includes(box.code));
            const lastTrip = tripsWithBox.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
            const lastRider = lastTrip ? DB.getDatabase().riders.find(r => r.id === lastTrip.riderId) : null;
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📦 Box Details: ${box.code}</h3>
                        <button class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="box-details">
                            <div class="detail-row">
                                <strong>Type:</strong> 
                                <span class="box-type-indicator ${box.type === 'GLB' ? 'large' : 'small'}">
                                    ${box.type === 'GLB' ? '📦' : '🧺'} 
                                    ${box.type === 'GLB' ? 'Greenspoon Large Box' : 'Greenspoon Small Box'}
                                </span>
                            </div>
                            <div class="detail-row">
                                <strong>Status:</strong> 
                                <span class="status-badge ${box.status}">${box.status}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Total Uses:</strong> ${box.totalUses || 0}
                            </div>
                            <div class="detail-row">
                                <strong>Last Seen:</strong> ${new Date(box.lastSeen).toLocaleString()}
                            </div>
                            ${lastRider ? `<div class="detail-row">
                                <strong>Last Rider:</strong> ${lastRider.name} (${lastRider.code})
                            </div>` : ''}
                            ${box.notes ? `<div class="detail-row">
                                <strong>Notes:</strong> ${box.notes}
                            </div>` : ''}
                            <div class="detail-row">
                                <strong>Recent Trips:</strong> ${tripsWithBox.length}
                                ${tripsWithBox.length > 0 ? `
                                <div class="recent-trips">
                                    ${tripsWithBox.slice(0, 3).map(trip => {
                                        const rider = DB.getDatabase().riders.find(r => r.id === trip.riderId);
                                        return `<div>${new Date(trip.startTime).toLocaleDateString()} - ${rider?.name || 'Unknown'}</div>`;
                                    }).join('')}
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary close-modal">Close</button>
                        <button class="btn btn-primary" id="printBoxLabel">Print Label</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close handlers
            const closeModal = () => modal.remove();
            modal.querySelector('.btn-close').addEventListener('click', closeModal);
            modal.querySelector('.close-modal').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            
            // Print label button
            modal.querySelector('#printBoxLabel').addEventListener('click', () => {
                this.printBoxLabel(box.code);
                closeModal();
            });
        } catch (error) {
            console.error('Error viewing box details:', error);
            this.showMessage('Error loading box details', 'error');
        }
    }
    
    printBoxLabel(boxCode) {
        try {
            const box = DB.getBoxByCode(boxCode);
            const typeName = box?.type === 'GLB' ? 'LARGE BOX' : 'SMALL BOX';
            const typeColor = box?.type === 'GLB' ? '#2e7d32' : '#1565c0';
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Label: ${boxCode}</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                padding: 20px;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                margin: 0;
                            }
                            .label { 
                                border: 2px solid ${typeColor}; 
                                padding: 30px; 
                                text-align: center; 
                                width: 400px;
                                border-radius: 10px;
                                background: white;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            }
                            .header { 
                                color: #2e7d32; 
                                font-size: 20px; 
                                font-weight: bold; 
                                margin-bottom: 15px;
                            }
                            .greenspoon { 
                                color: #2e7d32; 
                                font-weight: bold;
                                font-size: 24px;
                            }
                            .code { 
                                font-size: 48px; 
                                font-weight: bold; 
                                margin: 20px 0; 
                                letter-spacing: 2px;
                                color: ${typeColor};
                            }
                            .type { 
                                font-size: 22px; 
                                color: #666; 
                                margin-bottom: 20px;
                                font-weight: 500;
                            }
                            .barcode { 
                                margin: 25px 0; 
                                font-family: 'Courier New', monospace; 
                                font-size: 36px;
                                letter-spacing: 3px;
                                background: #f5f5f5;
                                padding: 15px;
                                border-radius: 5px;
                            }
                            .instructions { 
                                font-size: 14px; 
                                color: #666; 
                                margin-top: 25px;
                                line-height: 1.5;
                            }
                            @media print {
                                body { padding: 0; }
                                .label { border: none; box-shadow: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="label">
                            <div class="header">
                                <span class="greenspoon">GREENSPOON</span><br>
                                COOLER BOX TRACKING SYSTEM
                            </div>
                            <div class="type">${typeName}</div>
                            <div class="code">${boxCode}</div>
                            <div class="barcode">*${boxCode}*</div>
                            <div class="instructions">
                                Scan QR code to track this box<br>
                                Keep clean and dry | Return after use<br>
                                <small>Issued: ${new Date().toLocaleDateString()}</small>
                            </div>
                        </div>
                        <script>
                            window.onload = function() { 
                                window.print(); 
                                setTimeout(() => { window.close(); }, 1000);
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        } catch (error) {
            console.error('Error printing label:', error);
            this.showMessage('Error printing label', 'error');
        }
    }

    resolveMissingBox(boxCode) {
        try {
            const db = DB.getDatabase();
            const missingRecord = db.missingBoxes.find(m => m.boxCode === boxCode && !m.resolved);
            
            if (missingRecord) {
                missingRecord.resolved = true;
                missingRecord.resolvedAt = new Date().toISOString();
                
                // Update box status
                const box = DB.getBoxByCode(boxCode);
                if (box) {
                    box.status = 'available';
                    box.lastSeen = new Date().toISOString();
                }
                
                DB.saveDatabase(db);
                
                this.showMessage(`Box ${boxCode} marked as found`, 'success');
                this.loadMissingBoxes();
                this.updateDashboard();
                
                // Play success sound
                if (window.ScannerApp && DB.getDatabase().settings?.soundEnabled) {
                    ScannerApp.playSound('success');
                }
            } else {
                this.showMessage('Box not found or already resolved', 'warning');
            }
        } catch (error) {
            console.error('Error resolving missing box:', error);
            this.showMessage('Error updating box status', 'error');
        }
    }

    handleQuickSearch(query) {
        try {
            if (query.length >= 2) {
                // Real-time search results
                const results = DB.searchBoxes(query);
                this.showSearchResults(results);
            } else if (query.length === 0) {
                // Clear search results
                this.hideSearchResults();
            }
        } catch (error) {
            console.error('Error handling quick search:', error);
        }
    }
    
    hideSearchResults() {
        const existingResults = document.getElementById('quickSearchResults');
        if (existingResults) {
            existingResults.remove();
        }
    }

    performSearch(query) {
        try {
            if (!query.trim()) {
                this.showMessage('Please enter a search term', 'warning');
                return;
            }
            
            // Search in boxes, riders, and trips
            const boxResults = DB.searchBoxes(query);
            const riderResults = DB.getDatabase().riders.filter(rider => 
                rider.name.toLowerCase().includes(query.toLowerCase()) ||
                rider.code.toLowerCase().includes(query.toLowerCase()) ||
                (rider.phone && rider.phone.includes(query))
            );
            
            const tripResults = DB.getDatabase().trips.filter(trip => 
                trip.boxes.some(box => box.toLowerCase().includes(query.toLowerCase()))
            ).map(trip => {
                const rider = DB.getDatabase().riders.find(r => r.id === trip.riderId);
                return { ...trip, riderName: rider?.name || 'Unknown' };
            });
            
            // Show comprehensive search results
            this.showSearchModal(query, boxResults, riderResults, tripResults);
        } catch (error) {
            console.error('Error performing search:', error);
            this.showMessage('Error performing search', 'error');
        }
    }

    showSearchResults(results) {
        try {
            // Create or update dropdown
            let resultsContainer = document.getElementById('quickSearchResults');
            
            if (!resultsContainer) {
                resultsContainer = document.createElement('div');
                resultsContainer.id = 'quickSearchResults';
                resultsContainer.className = 'quick-search-results';
                
                const searchInput = document.getElementById('quickSearch');
                if (searchInput && searchInput.parentNode) {
                    searchInput.parentNode.appendChild(resultsContainer);
                }
            }
            
            if (results.length === 0) {
                resultsContainer.innerHTML = '<div class="no-results">No matching boxes found</div>';
                return;
            }
            
            resultsContainer.innerHTML = `
                <div class="search-results-header">
                    <strong>Boxes (${results.length})</strong>
                    <small>Press Enter for full search</small>
                </div>
                ${results.slice(0, 5).map(item => `
                    <div class="search-result-item" data-code="${item.code}">
                        <span class="result-code">${item.code}</span>
                        <span class="result-type ${item.type === 'GLB' ? 'large' : 'small'}">${item.type === 'GLB' ? 'Large' : 'Small'}</span>
                        <span class="result-status ${item.status}">${item.status}</span>
                    </div>
                `).join('')}
                ${results.length > 5 ? `<div class="more-results">+ ${results.length - 5} more results...</div>` : ''}
            `;
            
            // Add click handlers
            resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const boxCode = e.currentTarget.dataset.code;
                    this.viewBoxDetails(boxCode);
                    this.hideSearchResults();
                    const searchInput = document.getElementById('quickSearch');
                    if (searchInput) searchInput.value = '';
                });
            });
        } catch (error) {
            console.error('Error showing search results:', error);
        }
    }

    showSearchModal(query, boxResults, riderResults, tripResults) {
        try {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            
            const totalResults = boxResults.length + riderResults.length + tripResults.length;
            
            modal.innerHTML = `
                <div class="modal-content modal-lg">
                    <div class="modal-header">
                        <h3>🔍 Search Results for "${query}"</h3>
                        <button class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="search-summary">
                            Found ${totalResults} result${totalResults !== 1 ? 's' : ''}
                        </div>
                        
                        ${boxResults.length > 0 ? `
                        <div class="search-section">
                            <h4>📦 Boxes (${boxResults.length})</h4>
                            <div class="results-grid">
                                ${boxResults.slice(0, 10).map(item => `
                                    <div class="result-item box-result" data-code="${item.code}">
                                        <div class="result-code">${item.code}</div>
                                        <div class="result-details">
                                            <span class="result-type ${item.type === 'GLB' ? 'large' : 'small'}">${item.type === 'GLB' ? 'Large' : 'Small'}</span>
                                            <span class="result-status ${item.status}">${item.status}</span>
                                        </div>
                                        <div class="result-time">Last seen: ${new Date(item.lastSeen).toLocaleDateString()}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>` : ''}
                        
                        ${riderResults.length > 0 ? `
                        <div class="search-section">
                            <h4>👤 Riders (${riderResults.length})</h4>
                            <div class="results-grid">
                                ${riderResults.slice(0, 10).map(rider => `
                                    <div class="result-item rider-result" data-id="${rider.id}">
                                        <div class="rider-name">${rider.name}</div>
                                        <div class="rider-details">
                                            <span class="rider-code">${rider.code}</span>
                                            ${rider.phone ? `<span class="rider-phone">${rider.phone}</span>` : ''}
                                        </div>
                                        <div class="rider-status ${rider.isActive ? 'active' : 'inactive'}">
                                            ${rider.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>` : ''}
                        
                        ${tripResults.length > 0 ? `
                        <div class="search-section">
                            <h4>📋 Trips (${tripResults.length})</h4>
                            <div class="results-grid">
                                ${tripResults.slice(0, 10).map(trip => `
                                    <div class="result-item trip-result" data-id="${trip.id}">
                                        <div class="trip-header">
                                            <span class="trip-type ${trip.type}">${trip.type}</span>
                                            <span class="trip-rider">${trip.riderName}</span>
                                        </div>
                                        <div class="trip-details">
                                            <span class="trip-time">${new Date(trip.startTime).toLocaleString()}</span>
                                            <span class="trip-boxes">${trip.boxes.length} boxes</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>` : ''}
                        
                        ${totalResults === 0 ? `
                        <div class="no-results-message">
                            <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                            <h4>No results found for "${query}"</h4>
                            <p>Try searching for:</p>
                            <ul>
                                <li>Box codes (GLB1, GSB3, G10)</li>
                                <li>Rider names or codes</li>
                                <li>Phone numbers</li>
                            </ul>
                        </div>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary btn-close-modal">Close</button>
                        ${totalResults > 0 ? `<button class="btn btn-primary" id="exportSearchBtn">Export Results</button>` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close handlers
            const closeModal = () => modal.remove();
            modal.querySelector('.btn-close').addEventListener('click', closeModal);
            modal.querySelector('.btn-close-modal').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            
            // Export results
            if (totalResults > 0) {
                modal.querySelector('#exportSearchBtn').addEventListener('click', () => {
                    const exportData = {
                        query: query,
                        timestamp: new Date().toISOString(),
                        boxes: boxResults,
                        riders: riderResults,
                        trips: tripResults
                    };
                    
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `search-results-${query}-${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    this.showMessage('Search results exported', 'success');
                });
            }
            
            // Add click handlers for result items
            modal.querySelectorAll('.box-result').forEach(item => {
                item.addEventListener('click', () => {
                    const boxCode = item.dataset.code;
                    closeModal();
                    this.viewBoxDetails(boxCode);
                });
            });
            
            modal.querySelectorAll('.rider-result').forEach(item => {
                item.addEventListener('click', () => {
                    const riderId = item.dataset.id;
                    closeModal();
                    this.viewRiderDetails(riderId);
                });
            });
            
            modal.querySelectorAll('.trip-result').forEach(item => {
                item.addEventListener('click', () => {
                    const tripId = item.dataset.id;
                    closeModal();
                    this.viewTripDetails(tripId);
                });
            });
        } catch (error) {
            console.error('Error showing search modal:', error);
            this.showMessage('Error showing search results', 'error');
        }
    }

    showRiderRegistrationModal() {
        try {
            const riderModal = document.getElementById('riderModal');
            if (!riderModal) {
                console.error('Rider modal not found in HTML');
                return;
            }
            
            const modal = new bootstrap.Modal(riderModal);
            modal.show();
            
            // Generate rider code suggestion
            const riderCount = DB.getDatabase().riders.length + 1;
            const suggestedCode = `RD${riderCount.toString().padStart(3, '0')}`;
            const riderCodeInput = document.getElementById('riderCode');
            if (riderCodeInput) {
                riderCodeInput.value = suggestedCode;
            }
            
            // Set today's date
            const joinDateInput = document.getElementById('joinDate');
            if (joinDateInput) {
                joinDateInput.value = new Date().toISOString().split('T')[0];
            }
            
            // Set default shift to morning
            const shiftTimeInput = document.getElementById('shiftTime');
            if (shiftTimeInput) {
                shiftTimeInput.value = 'morning';
            }
            
            // Clear previous data
            this.clearPhotoPreview();
            
            // Clear any existing rider ID from edit mode
            const riderForm = document.getElementById('riderRegistrationForm');
            if (riderForm) {
                riderForm.dataset.riderId = '';
            }
            
            // Generate QR code placeholder
            this.generateRiderQRCode(suggestedCode, 'New Rider');
            
            // Focus on name field
            setTimeout(() => {
                const nameInput = document.getElementById('fullName');
                if (nameInput) nameInput.focus();
            }, 100);
        } catch (error) {
            console.error('Error showing rider registration modal:', error);
            this.showMessage('Error opening rider registration', 'error');
        }
    }
    
    hideRiderModal() {
        try {
            const riderModal = document.getElementById('riderModal');
            if (riderModal) {
                const modal = bootstrap.Modal.getInstance(riderModal);
                if (modal) {
                    modal.hide();
                } else {
                    // Fallback if Bootstrap instance not found
                    riderModal.style.display = 'none';
                }
            }
            
            const riderForm = document.getElementById('riderRegistrationForm');
            if (riderForm) {
                riderForm.reset();
            }
            
            this.clearPhotoPreview();
        } catch (error) {
            console.error('Error hiding rider modal:', error);
        }
    }
    
    handlePhotoUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file (JPEG, PNG, etc.)');
                return;
            }
            
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image file too large. Please select an image under 5MB.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoPreview = document.getElementById('photoPreview');
                if (photoPreview) {
                    photoPreview.innerHTML = '';
                    photoPreview.style.backgroundImage = `url(${e.target.result})`;
                    photoPreview.style.backgroundSize = 'cover';
                    photoPreview.style.backgroundPosition = 'center';
                    photoPreview.classList.add('has-photo');
                }
            };
            reader.onerror = () => {
                alert('Error reading the image file. Please try again.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error handling photo upload:', error);
            alert('Error uploading photo. Please try again.');
        }
    }
    
    clearPhotoPreview() {
        try {
            const photoPreview = document.getElementById('photoPreview');
            if (photoPreview) {
                photoPreview.style.backgroundImage = '';
                photoPreview.classList.remove('has-photo');
                photoPreview.innerHTML = `
                    <div class="photo-placeholder">
                        <span>📷</span>
                        <small>Click to upload photo</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error clearing photo preview:', error);
        }
    }
    
    saveRider() {
        try {
            // Collect form data
            const riderData = {
                code: document.getElementById('riderCode')?.value.trim() || '',
                badge: document.getElementById('riderBadge')?.value.trim() || '',
                name: document.getElementById('fullName')?.value.trim() || '',
                phone: document.getElementById('phoneNumber')?.value.trim() || '',
                email: document.getElementById('email')?.value.trim() || '',
                vehicleType: document.getElementById('vehicleType')?.value || '',
                vehicleNumber: document.getElementById('vehicleNumber')?.value.trim() || '',
                joinDate: document.getElementById('joinDate')?.value || '',
                shiftTime: document.getElementById('shiftTime')?.value || '',
                isActive: document.getElementById('isActive')?.checked || true,
                canUseLargeBoxes: document.getElementById('canUseLargeBoxes')?.checked || false,
                notes: document.getElementById('riderNotes')?.value.trim() || '',
                emergencyName: document.getElementById('emergencyName')?.value.trim() || '',
                emergencyPhone: document.getElementById('emergencyPhone')?.value.trim() || '',
                emergencyRelation: document.getElementById('emergencyRelation')?.value.trim() || '',
                photo: document.getElementById('photoPreview')?.style.backgroundImage || '',
                createdAt: new Date().toISOString(),
                lastActivity: null,
                totalTrips: 0
            };
            
            // Validate required fields
            if (!riderData.code || !riderData.name) {
                this.showMessage('Rider Code and Full Name are required', 'error');
                return;
            }
            
            // Validate code format
            if (!/^[A-Za-z0-9]{3,10}$/.test(riderData.code)) {
                this.showMessage('Rider code must be 3-10 letters/numbers only', 'error');
                return;
            }
            
            // Check if rider code already exists (for new riders)
            const riderForm = document.getElementById('riderRegistrationForm');
            const isEditMode = riderForm?.dataset.riderId;
            
            if (!isEditMode) {
                const existingRider = DB.getRiderByCode(riderData.code);
                if (existingRider) {
                    this.showMessage(`Rider code ${riderData.code} already exists. Please use a different code.`, 'error');
                    return;
                }
            }
            
            // Save to database
            let rider;
            if (isEditMode) {
                // Update existing rider
                const existingRider = DB.getDatabase().riders.find(r => r.id === riderForm.dataset.riderId);
                if (existingRider) {
                    riderData.createdAt = existingRider.createdAt;
                    riderData.totalTrips = existingRider.totalTrips || 0;
                    riderData.lastActivity = existingRider.lastActivity;
                }
                rider = DB.updateRider(riderForm.dataset.riderId, riderData);
            } else {
                // Add new rider
                rider = DB.addRider(riderData);
            }
            
            if (!rider) {
                this.showMessage('Failed to save rider', 'error');
                return;
            }
            
            // Generate QR code with actual data
            this.generateRiderQRCode(riderData.code, riderData.name);
            
            // Show success message
            this.showMessage(`Rider ${riderData.name} ${isEditMode ? 'updated' : 'registered'} successfully!`, 'success');
            
            // Play success sound
            const db = DB.getDatabase();
            if (db.settings?.soundEnabled) {
                const audio = new Audio();
                audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
                audio.volume = db.settings.volumeLevel ? db.settings.volumeLevel / 100 : 0.5;
                audio.play().catch(() => {});
            }
            
            // Close modal
            this.hideRiderModal();
            
            // Refresh riders list
            this.loadRidersList();
            
            // Update dashboard stats
            this.updateDashboard();
            
            // If this is a new rider and scanner is active, add to scanner dropdown
            if (!isEditMode && window.ScannerApp) {
                ScannerApp.loadRiders();
            }
        } catch (error) {
            console.error('Error saving rider:', error);
            this.showMessage('Error saving rider. Please try again.', 'error');
        }
    }
    
    loadRidersList() {
        try {
            const riders = DB.getDatabase().riders || [];
            
            // Update counts
            const totalRiders = document.getElementById('totalRiders');
            const activeRidersCount = document.getElementById('activeRidersCount');
            
            const activeRiders = riders.filter(r => r.isActive);
            if (totalRiders) totalRiders.textContent = riders.length;
            if (activeRidersCount) activeRidersCount.textContent = activeRiders.length;
            
            // Apply filters
            const searchTerm = document.getElementById('riderSearchFilter')?.value.toLowerCase() || '';
            const statusFilter = document.getElementById('riderStatusFilter')?.value || 'all';
            
            let filteredRiders = riders;
            
            if (searchTerm || statusFilter !== 'all') {
                filteredRiders = this.filterRiderList(riders, searchTerm, statusFilter);
            }
            
            // Load riders into table
            const ridersTable = document.getElementById('ridersTable');
            if (ridersTable) {
                ridersTable.innerHTML = '';
                
                if (filteredRiders.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="7" class="text-center text-muted">No riders found</td>';
                    ridersTable.appendChild(row);
                } else {
                    filteredRiders.forEach(rider => {
                        ridersTable.appendChild(this.createRiderRow(rider));
                    });
                }
            }
        } catch (error) {
            console.error('Error loading riders list:', error);
            const ridersTable = document.getElementById('ridersTable');
            if (ridersTable) {
                ridersTable.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading riders</td></tr>';
            }
        }
    }
    
    filterRiderList(riders, searchTerm, statusFilter) {
        return riders.filter(rider => {
            // Search filter
            const matchesSearch = !searchTerm || 
                (rider.name && rider.name.toLowerCase().includes(searchTerm)) ||
                (rider.code && rider.code.toLowerCase().includes(searchTerm)) ||
                (rider.phone && rider.phone.includes(searchTerm)) ||
                (rider.badge && rider.badge.toLowerCase().includes(searchTerm));
            
            // Status filter
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && rider.isActive) ||
                (statusFilter === 'inactive' && !rider.isActive);
            
            return matchesSearch && matchesStatus;
        });
    }
    
    createRiderRow(rider) {
        const row = document.createElement('tr');
        
        // Photo cell
        const photoCell = document.createElement('td');
        const avatarLetter = rider.name ? rider.name.charAt(0).toUpperCase() : '?';
        photoCell.innerHTML = `
            <div class="rider-avatar ${rider.photo ? 'has-photo' : ''}" 
                 style="${rider.photo ? `background-image: url(${rider.photo})` : ''}">
                ${rider.photo ? '' : avatarLetter}
            </div>
        `;
        
        // Name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = rider.name || 'Unknown';
        
        // Phone cell
        const phoneCell = document.createElement('td');
        let phoneDisplay = 'No phone';
        if (rider.phone) {
            const cleaned = rider.phone.replace(/\D/g, '');
            if (cleaned.length === 10) {
                phoneDisplay = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
            } else {
                phoneDisplay = rider.phone;
            }
        }
        phoneCell.textContent = phoneDisplay;
        
        // Vehicle cell
        const vehicleCell = document.createElement('td');
        vehicleCell.textContent = rider.vehicleType || 'N/A';
        
        // Status cell
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge ${rider.isActive ? 'bg-success' : 'bg-secondary'}`;
        statusBadge.textContent = rider.isActive ? 'Active' : 'Inactive';
        statusCell.appendChild(statusBadge);
        
        // Trips cell
        const tripsCell = document.createElement('td');
        tripsCell.textContent = rider.totalTrips || 0;
        
        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <button class="btn btn-sm btn-outline-primary me-1" title="View details" onclick="app.viewRiderDetails('${rider.id}')">
                <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary" title="Edit rider" onclick="app.showRiderRegistrationModal('${rider.id}')">
                <i class="bi bi-pencil"></i>
            </button>
        `;
        
        row.appendChild(photoCell);
        row.appendChild(nameCell);
        row.appendChild(phoneCell);
        row.appendChild(vehicleCell);
        row.appendChild(statusCell);
        row.appendChild(tripsCell);
        row.appendChild(actionsCell);
        
        return row;
    }
    
    createRiderCard(rider) {
        const card = document.createElement('div');
        card.className = `rider-card ${rider.isActive ? 'active' : 'inactive'}`;
        card.dataset.riderId = rider.id;
        card.title = `Click to view ${rider.name}'s details`;
        
        // Format phone number for display
        let phoneDisplay = 'No phone';
        if (rider.phone) {
            const cleaned = rider.phone.replace(/\D/g, '');
            if (cleaned.length === 10) {
                phoneDisplay = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
            } else {
                phoneDisplay = rider.phone;
            }
        }
        
        // Get first letter for avatar if no photo
        const avatarLetter = rider.name ? rider.name.charAt(0).toUpperCase() : '?';
        
        // Get vehicle icon
        const vehicleIcon = this.getVehicleIcon(rider.vehicleType);
        
        card.innerHTML = `
            <div class="rider-avatar ${rider.photo ? 'has-photo' : ''}" 
                 style="${rider.photo ? `background-image: url(${rider.photo})` : ''}">
                ${rider.photo ? '' : avatarLetter}
            </div>
            <div class="rider-info">
                <h5>${rider.name || 'Unknown'}</h5>
                <div class="rider-code">${rider.code || 'No code'}</div>
                <div class="rider-meta">
                    <div title="Phone">📱 ${phoneDisplay}</div>
                    ${rider.vehicleType ? `<div title="Vehicle">${vehicleIcon} ${rider.vehicleType}</div>` : ''}
                    ${rider.shiftTime ? `<div title="Shift">⏰ ${this.formatShiftTime(rider.shiftTime)}</div>` : ''}
                    ${rider.totalTrips ? `<div title="Total Trips">📊 ${rider.totalTrips} trips</div>` : ''}
                    ${rider.canUseLargeBoxes ? `<div title="Can use large boxes" style="color: #2e7d32;">📦 Can use large boxes</div>` : ''}
                </div>
                <div class="rider-actions">
                    <button class="btn btn-sm btn-outline view-rider-btn" title="View details">
                        👁️ View
                    </button>
                    <button class="btn btn-sm btn-outline edit-rider-btn" title="Edit rider">
                        ✏️ Edit
                    </button>
                </div>
            </div>
        `;
        
        // Add click event to view details
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn')) {
                this.viewRiderDetails(rider.id);
            }
        });
        
        // Add button events
        card.querySelector('.view-rider-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.viewRiderDetails(rider.id);
        });
        
        card.querySelector('.edit-rider-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editRider(rider.id);
        });
        
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
        
        return card;
    }
    
    formatShiftTime(shiftTime) {
        const shiftMap = {
            'morning': '🌅 Morning',
            'afternoon': '☀️ Afternoon',
            'night': '🌙 Night',
            'flexible': '🔄 Flexible'
        };
        return shiftMap[shiftTime] || shiftTime;
    }
    
    getVehicleIcon(vehicleType) {
        const icons = {
            'bike': '🚲',
            'scooter': '🛵',
            'car': '🚗',
            'van': '🚐',
            'truck': '🚚',
            'other': '🚙'
        };
        return icons[vehicleType] || '🚙';
    }
    
    getBoxTypeIcon(boxType) {
        const icons = {
            'GLB': '📦', // Greenspoon Large Box
            'GSB': '🧺'  // Greenspoon Small Box
        };
        return icons[boxType] || '📦';
    }
    
    viewRiderDetails(riderId) {
        try {
            const rider = DB.getDatabase().riders.find(r => r.id === riderId);
            if (!rider) {
                this.showMessage('Rider not found', 'error');
                return;
            }
            
            // Get rider's trip history
            const riderTrips = DB.getDatabase().trips.filter(t => t.riderId === riderId);
            const recentTrips = riderTrips.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).slice(0, 5);
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content modal-lg">
                    <div class="modal-header">
                        <h3>👤 Rider Profile: ${rider.name}</h3>
                        <button class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="rider-profile">
                            <div class="profile-header">
                                <div class="profile-avatar ${rider.photo ? 'has-photo' : ''}"
                                     style="${rider.photo ? `background-image: url(${rider.photo})` : ''}">
                                    ${rider.photo ? '' : (rider.name ? rider.name.charAt(0).toUpperCase() : '?')}
                                </div>
                                <div class="profile-info">
                                    <h2>${rider.name || 'Unknown'}</h2>
                                    <div class="rider-code-large">${rider.code || 'No code'}</div>
                                    <div class="rider-status ${rider.isActive ? 'active' : 'inactive'}">
                                        ${rider.isActive ? '🟢 Active' : '⚪ Inactive'}
                                    </div>
                                    <div class="profile-stats">
                                        <div class="stat">
                                            <div class="stat-value">${rider.totalTrips || 0}</div>
                                            <div class="stat-label">Total Trips</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-value">${recentTrips.length}</div>
                                            <div class="stat-label">Recent Trips</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-value">${rider.joinDate ? new Date(rider.joinDate).toLocaleDateString() : 'N/A'}</div>
                                            <div class="stat-label">Join Date</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="profile-tabs">
                                <button class="tab-btn active" data-tab="details">Details</button>
                                <button class="tab-btn" data-tab="trips">Recent Trips</button>
                                <button class="tab-btn" data-tab="qr">QR Code</button>
                            </div>
                            
                            <div class="tab-content">
                                <div class="tab-pane active" id="details-tab">
                                    ${rider.phone || rider.email || rider.badge ? `
                                    <div class="detail-section">
                                        <h4>📞 Contact Information</h4>
                                        <div class="detail-grid">
                                            ${rider.phone ? `<div><strong>Phone:</strong> ${rider.phone}</div>` : ''}
                                            ${rider.email ? `<div><strong>Email:</strong> ${rider.email}</div>` : ''}
                                            ${rider.badge ? `<div><strong>Badge No:</strong> ${rider.badge}</div>` : ''}
                                        </div>
                                    </div>` : ''}
                                    
                                    ${rider.vehicleType || rider.vehicleNumber ? `
                                    <div class="detail-section">
                                        <h4>🚗 Vehicle Information</h4>
                                        <div class="detail-grid">
                                            ${rider.vehicleType ? `<div><strong>Vehicle Type:</strong> ${rider.vehicleType}</div>` : ''}
                                            ${rider.vehicleNumber ? `<div><strong>Vehicle No:</strong> ${rider.vehicleNumber}</div>` : ''}
                                        </div>
                                    </div>` : ''}
                                    
                                    <div class="detail-section">
                                        <h4>🏢 Employment Details</h4>
                                        <div class="detail-grid">
                                            ${rider.joinDate ? `<div><strong>Join Date:</strong> ${new Date(rider.joinDate).toLocaleDateString()}</div>` : ''}
                                            ${rider.shiftTime ? `<div><strong>Shift:</strong> ${this.formatShiftTime(rider.shiftTime)}</div>` : ''}
                                            <div><strong>Can Use Large Boxes:</strong> ${rider.canUseLargeBoxes ? '✅ Yes' : '❌ No'}</div>
                                        </div>
                                    </div>
                                    
                                    ${rider.emergencyName ? `
                                    <div class="detail-section">
                                        <h4>🆘 Emergency Contact</h4>
                                        <div class="detail-grid">
                                            <div><strong>Name:</strong> ${rider.emergencyName}</div>
                                            ${rider.emergencyPhone ? `<div><strong>Phone:</strong> ${rider.emergencyPhone}</div>` : ''}
                                            ${rider.emergencyRelation ? `<div><strong>Relationship:</strong> ${rider.emergencyRelation}</div>` : ''}
                                        </div>
                                    </div>` : ''}
                                    
                                    ${rider.notes ? `
                                    <div class="detail-section">
                                        <h4>📝 Notes</h4>
                                        <p>${rider.notes}</p>
                                    </div>` : ''}
                                </div>
                                
                                <div class="tab-pane" id="trips-tab">
                                    ${recentTrips.length > 0 ? `
                                    <div class="trip-history">
                                        <h4>Recent Trip History</h4>
                                        <div class="trip-list">
                                            ${recentTrips.map(trip => `
                                                <div class="trip-item" data-id="${trip.id}">
                                                    <div class="trip-header">
                                                        <span class="trip-type ${trip.type}">${trip.type}</span>
                                                        <span class="trip-time">${new Date(trip.startTime).toLocaleString()}</span>
                                                    </div>
                                                    <div class="trip-details">
                                                        <span class="trip-boxes">${trip.boxes.length} boxes</span>
                                                        ${trip.largeBoxCount ? `<span class="box-count large">${trip.largeBoxCount} large</span>` : ''}
                                                        ${trip.smallBoxCount ? `<span class="box-count small">${trip.smallBoxCount} small</span>` : ''}
                                                        <span class="trip-status">${trip.completed ? '✅ Completed' : '🔄 Active'}</span>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>` : `
                                    <div class="empty-state">
                                        <div style="font-size: 48px; margin-bottom: 10px;">📭</div>
                                        <h4>No Trip History</h4>
                                        <p>This rider hasn't made any trips yet.</p>
                                    </div>`}
                                </div>
                                
                                <div class="tab-pane" id="qr-tab">
                                    <div class="qr-section">
                                        <div class="qr-preview-large" id="riderQrPreview">
                                            <!-- QR code will be generated here -->
                                        </div>
                                        <div class="qr-info">
                                            <h4>Scan to Select Rider</h4>
                                            <p>Scan this QR code with any scanner to quickly select ${rider.name}.</p>
                                            <div class="qr-actions">
                                                <button class="btn btn-primary" id="printRiderQrBtn">
                                                    🖨️ Print QR Code
                                                </button>
                                                <button class="btn btn-secondary" id="downloadRiderQrBtn">
                                                    💾 Download QR Code
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary close-modal">Close</button>
                        <button class="btn btn-warning edit-rider-details-btn">Edit Rider</button>
                        <button class="btn btn-danger toggle-status-btn">
                            ${rider.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Generate QR code
            this.generateRiderQRCodeForModal(rider.code, rider.name, 'riderQrPreview');
            
            // Close handlers
            const closeModal = () => modal.remove();
            modal.querySelectorAll('.btn-close, .close-modal').forEach(btn => {
                btn.addEventListener('click', closeModal);
            });
            
            // Tab functionality
            modal.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tab = e.target.dataset.tab;
                    
                    // Update active tab
                    modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // Show selected tab content
                    modal.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                    modal.querySelector(`#${tab}-tab`).classList.add('active');
                });
            });
            
            // Edit button
            modal.querySelector('.edit-rider-details-btn').addEventListener('click', () => {
                closeModal();
                this.editRider(riderId);
            });
            
            // Toggle status button
            modal.querySelector('.toggle-status-btn').addEventListener('click', () => {
                closeModal();
                this.toggleRiderStatus(riderId);
            });
            
            // Print QR button
            modal.querySelector('#printRiderQrBtn')?.addEventListener('click', () => {
                this.printRiderQRCode(rider.code, rider.name);
            });
            
            // Download QR button
            modal.querySelector('#downloadRiderQrBtn')?.addEventListener('click', () => {
                this.saveRiderQRCode(rider.code, rider.name);
            });
            
            // Trip item clicks
            modal.querySelectorAll('.trip-item').forEach(item => {
                item.addEventListener('click', () => {
                    const tripId = item.dataset.id;
                    closeModal();
                    this.viewTripDetails(tripId);
                });
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        } catch (error) {
            console.error('Error viewing rider details:', error);
            this.showMessage('Error loading rider details', 'error');
        }
    }
    
    generateRiderQRCodeForModal(riderCode, riderName, elementId) {
        try {
            const qrContainer = document.getElementById(elementId);
            if (qrContainer) {
                qrContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 64px; margin-bottom: 15px; color: #2e7d32;">📇</div>
                        <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px;">${riderName}</div>
                        <div style="font-family: monospace; background: #f0f0f0; padding: 10px; margin: 15px 0; border-radius: 8px; font-size: 20px; letter-spacing: 2px;">
                            ${riderCode}
                        </div>
                        <div style="color: #666; font-size: 14px;">Scan to select rider in system</div>
                        <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
                            <div>Greenspoon Cooler Box Tracker</div>
                            <div>Rider Selection Code</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }
    
    editRider(riderId) {
        try {
            const rider = DB.getDatabase().riders.find(r => r.id === riderId);
            if (!rider) {
                this.showMessage('Rider not found', 'error');
                return;
            }
            
            // Close details modal if open
            const detailsModal = document.querySelector('.modal-overlay');
            if (detailsModal) detailsModal.remove();
            
            // Open registration modal with rider data
            this.showRiderRegistrationModal();
            
            // Fill form with rider data
            const formFields = {
                'riderCode': rider.code,
                'riderBadge': rider.badge,
                'fullName': rider.name,
                'phoneNumber': rider.phone,
                'email': rider.email,
                'vehicleType': rider.vehicleType,
                'vehicleNumber': rider.vehicleNumber,
                'joinDate': rider.joinDate ? new Date(rider.joinDate).toISOString().split('T')[0] : '',
                'shiftTime': rider.shiftTime,
                'riderNotes': rider.notes,
                'emergencyName': rider.emergencyName,
                'emergencyPhone': rider.emergencyPhone,
                'emergencyRelation': rider.emergencyRelation
            };
            
            Object.entries(formFields).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element && value !== undefined) {
                    if (element.type === 'checkbox') {
                        element.checked = Boolean(value);
                    } else {
                        element.value = value || '';
                    }
                }
            });
            
            // Set checkboxes
            const isActiveCheckbox = document.getElementById('isActive');
            const canUseLargeBoxesCheckbox = document.getElementById('canUseLargeBoxes');
            if (isActiveCheckbox) isActiveCheckbox.checked = Boolean(rider.isActive);
            if (canUseLargeBoxesCheckbox) canUseLargeBoxesCheckbox.checked = Boolean(rider.canUseLargeBoxes);
            
            // Set photo if exists
            if (rider.photo) {
                const photoPreview = document.getElementById('photoPreview');
                if (photoPreview) {
                    photoPreview.style.backgroundImage = rider.photo;
                    photoPreview.classList.add('has-photo');
                    photoPreview.innerHTML = '';
                }
            }
            
            // Generate QR code
            this.generateRiderQRCode(rider.code, rider.name);
            
            // Store rider ID for update
            const riderForm = document.getElementById('riderRegistrationForm');
            if (riderForm) {
                riderForm.dataset.riderId = riderId;
            }
        } catch (error) {
            console.error('Error editing rider:', error);
            this.showMessage('Error loading rider for editing', 'error');
        }
    }
    
    toggleRiderStatus(riderId) {
        try {
            const rider = DB.getDatabase().riders.find(r => r.id === riderId);
            if (!rider) {
                this.showMessage('Rider not found', 'error');
                return;
            }
            
            const newStatus = !rider.isActive;
            const confirmMessage = newStatus ? 
                `Activate ${rider.name}? They will appear in the scanner.` :
                `Deactivate ${rider.name}? They will no longer appear in the scanner.`;
            
            if (confirm(confirmMessage)) {
                rider.isActive = newStatus;
                DB.saveDatabase(DB.getDatabase());
                
                this.showMessage(`${rider.name} ${newStatus ? 'activated' : 'deactivated'}`, 'success');
                this.loadRidersList();
                
                // Update scanner dropdown if it exists
                if (window.ScannerApp) {
                    ScannerApp.loadRiders();
                }
            }
        } catch (error) {
            console.error('Error toggling rider status:', error);
            this.showMessage('Error updating rider status', 'error');
        }
    }
    
    generateRiderQRCode(riderCode, riderName) {
        try {
            const qrContainer = document.getElementById('qrCodePreview');
            if (qrContainer) {
                qrContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px; color: #2e7d32;">📇</div>
                        <div style="font-weight: bold;">${riderName}</div>
                        <div style="font-family: monospace; background: #f0f0f0; padding: 8px; margin: 12px 0; border-radius: 6px; font-size: 18px;">
                            ${riderCode}
                        </div>
                        <small style="color: #666;">Scan this code to select rider</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error generating rider QR code:', error);
        }
    }
    
    // Enhanced Rider Filter Methods
    filterRiders() {
        try {
            const searchTerm = document.getElementById('riderSearchFilter')?.value.toLowerCase() || '';
            const statusFilter = document.getElementById('riderStatusFilter')?.value || 'all';
            
            // Store filters in session for persistence
            sessionStorage.setItem('riderFilters', JSON.stringify({
                search: searchTerm,
                status: statusFilter
            }));
            
            // Apply filters
            this.loadRidersList();
            
            // Update filter button state
            const hasActiveFilters = searchTerm || statusFilter !== 'all';
            const clearFiltersBtn = document.getElementById('clearFiltersBtn');
            if (clearFiltersBtn) {
                clearFiltersBtn.disabled = !hasActiveFilters;
                clearFiltersBtn.title = hasActiveFilters ? 'Clear all filters' : 'No active filters';
            }
        } catch (error) {
            console.error('Error filtering riders:', error);
        }
    }
    
    filterBoxes() {
        try {
            const searchTerm = document.getElementById('boxSearchFilter')?.value.toLowerCase() || '';
            const typeFilter = document.getElementById('boxTypeFilter')?.value || 'all';
            const statusFilter = document.getElementById('boxStatusFilter')?.value || 'all';
            
            // Store filters in session for persistence
            sessionStorage.setItem('boxFilters', JSON.stringify({
                search: searchTerm,
                type: typeFilter,
                status: statusFilter
            }));
            
            // Apply filters
            this.loadBoxesList();
        } catch (error) {
            console.error('Error filtering boxes:', error);
        }
    }
    
    loadBoxesList() {
        try {
            const boxes = DB.getDatabase().boxes || [];
            
            // Update counts
            const totalBoxes = document.getElementById('totalBoxes');
            const largeBoxesCount = document.getElementById('largeBoxesCount');
            const smallBoxesCount = document.getElementById('smallBoxesCount');
            
            const largeBoxes = boxes.filter(b => b.type === 'large');
            const smallBoxes = boxes.filter(b => b.type === 'small');
            
            if (totalBoxes) totalBoxes.textContent = boxes.length;
            if (largeBoxesCount) largeBoxesCount.textContent = largeBoxes.length;
            if (smallBoxesCount) smallBoxesCount.textContent = smallBoxes.length;
            
            // Apply filters
            const searchTerm = document.getElementById('boxSearchFilter')?.value.toLowerCase() || '';
            const typeFilter = document.getElementById('boxTypeFilter')?.value || 'all';
            const statusFilter = document.getElementById('boxStatusFilter')?.value || 'all';
            
            let filteredBoxes = boxes;
            
            if (searchTerm || typeFilter !== 'all' || statusFilter !== 'all') {
                filteredBoxes = this.filterBoxList(boxes, searchTerm, typeFilter, statusFilter);
            }
            
            // Load boxes into table
            const boxesTable = document.getElementById('boxesTable');
            if (boxesTable) {
                boxesTable.innerHTML = '';
                
                if (filteredBoxes.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="6" class="text-center text-muted">No boxes found</td>';
                    boxesTable.appendChild(row);
                } else {
                    filteredBoxes.forEach(box => {
                        boxesTable.appendChild(this.createBoxRow(box));
                    });
                }
            }
        } catch (error) {
            console.error('Error loading boxes list:', error);
            const boxesTable = document.getElementById('boxesTable');
            if (boxesTable) {
                boxesTable.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading boxes</td></tr>';
            }
        }
    }
    
    filterBoxList(boxes, searchTerm, typeFilter, statusFilter) {
        return boxes.filter(box => {
            // Search filter
            const matchesSearch = !searchTerm || 
                (box.code && box.code.toLowerCase().includes(searchTerm));
            
            // Type filter
            const matchesType = typeFilter === 'all' ||
                (typeFilter === 'large' && box.type === 'large') ||
                (typeFilter === 'small' && box.type === 'small');
            
            // Status filter
            const matchesStatus = statusFilter === 'all' ||
                box.status === statusFilter;
            
            return matchesSearch && matchesType && matchesStatus;
        });
    }
    
    createBoxRow(box) {
        const row = document.createElement('tr');
        
        // Box Code cell
        const codeCell = document.createElement('td');
        codeCell.textContent = box.code || 'Unknown';
        
        // Type cell
        const typeCell = document.createElement('td');
        const typeBadge = document.createElement('span');
        typeBadge.className = `badge ${box.type === 'large' ? 'bg-primary' : 'bg-info'}`;
        typeBadge.textContent = box.type === 'large' ? 'Large' : 'Small';
        typeCell.appendChild(typeBadge);
        
        // Status cell
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        let statusClass = 'bg-secondary';
        if (box.status === 'available') statusClass = 'bg-success';
        else if (box.status === 'in_use') statusClass = 'bg-warning';
        else if (box.status === 'missing') statusClass = 'bg-danger';
        else if (box.status === 'damaged') statusClass = 'bg-dark';
        statusBadge.className = `badge ${statusClass}`;
        statusBadge.textContent = box.status ? box.status.charAt(0).toUpperCase() + box.status.slice(1) : 'Unknown';
        statusCell.appendChild(statusBadge);
        
        // Trips cell
        const tripsCell = document.createElement('td');
        tripsCell.textContent = box.totalTrips || 0;
        
        // Last Used cell
        const lastUsedCell = document.createElement('td');
        if (box.lastUsed) {
            const date = new Date(box.lastUsed);
            lastUsedCell.textContent = date.toLocaleDateString();
        } else {
            lastUsedCell.textContent = 'Never';
        }
        
        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <button class="btn btn-sm btn-outline-primary me-1" title="View details" onclick="app.viewBoxDetails('${box.code}')">
                <i class="bi bi-eye"></i>
            </button>
        `;
        
        row.appendChild(codeCell);
        row.appendChild(typeCell);
        row.appendChild(statusCell);
        row.appendChild(tripsCell);
        row.appendChild(lastUsedCell);
        row.appendChild(actionsCell);
        
        return row;
    }
    
    clearRiderFilters() {
        try {
            const searchRiders = document.getElementById('riderSearchFilter');
            const filterStatus = document.getElementById('riderStatusFilter');
            
            if (searchRiders) searchRiders.value = '';
            if (filterStatus) filterStatus.value = 'all';
            
            // Clear stored filters
            sessionStorage.removeItem('riderFilters');
            
            // Reload all riders
            this.loadRidersList();
            
            // Disable clear button
            const clearFiltersBtn = document.getElementById('clearFiltersBtn');
            if (clearFiltersBtn) {
                clearFiltersBtn.disabled = true;
            }
            
            this.showMessage('Filters cleared', 'info');
            
            // Focus back on search
            if (searchRiders) searchRiders.focus();
        } catch (error) {
            console.error('Error clearing rider filters:', error);
            this.showMessage('Error clearing filters', 'error');
        }
    }
    
    renderFilteredRiders(filteredRiders) {
        try {
            const activeRiders = filteredRiders.filter(r => r.isActive);
            const inactiveRiders = filteredRiders.filter(r => !r.isActive);
            
            // Update active riders list
            const activeList = document.getElementById('activeRidersList');
            if (activeList) {
                activeList.innerHTML = '';
                
                if (activeRiders.length === 0) {
                    activeList.innerHTML = '<div class="empty-state">No matching active riders</div>';
                } else {
                    activeRiders.forEach(rider => {
                        activeList.appendChild(this.createRiderCard(rider));
                    });
                }
            }
            
            // Update inactive riders list
            const inactiveList = document.getElementById('inactiveRidersList');
            if (inactiveList) {
                inactiveList.innerHTML = '';
                
                if (inactiveRiders.length === 0) {
                    inactiveList.innerHTML = '<div class="empty-state">No matching inactive riders</div>';
                } else {
                    inactiveRiders.forEach(rider => {
                        inactiveList.appendChild(this.createRiderCard(rider));
                    });
                }
            }
            
            // Update result count
            const resultCount = document.getElementById('riderResultsCount');
            if (resultCount) {
                const total = activeRiders.length + inactiveRiders.length;
                resultCount.textContent = `${total} rider${total !== 1 ? 's' : ''} found`;
                resultCount.style.display = 'block';
            }
        } catch (error) {
            console.error('Error rendering filtered riders:', error);
        }
    }

    generateDailyReport() {
        try {
            const report = DB.generateDailyReport();
            
            // Create report modal
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content modal-lg">
                    <div class="modal-header">
                        <h3>📊 Daily Report - ${report.date}</h3>
                        <button class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="report-summary">
                            <div class="stat-card">
                                <div class="stat-value">${report.departures}</div>
                                <div class="stat-label">Departures</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.returns}</div>
                                <div class="stat-label">Returns</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.uniqueRiders}</div>
                                <div class="stat-label">Unique Riders</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.boxesUsed}</div>
                                <div class="stat-label">Boxes Used</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.largeBoxesUsed}</div>
                                <div class="stat-label">Large Boxes</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.smallBoxesUsed}</div>
                                <div class="stat-label">Small Boxes</div>
                            </div>
                            <div class="stat-card warning">
                                <div class="stat-value">${report.missingReported}</div>
                                <div class="stat-label">Missing Reported</div>
                            </div>
                        </div>
                        
                        <h4>Today's Trips</h4>
                        <div class="trips-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Type</th>
                                        <th>Rider</th>
                                        <th>Boxes</th>
                                        <th>Large</th>
                                        <th>Small</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${report.trips.map(trip => `
                                        <tr>
                                            <td>${trip.time}</td>
                                            <td><span class="trip-type ${trip.type}">${trip.type}</span></td>
                                            <td>${trip.rider}</td>
                                            <td>${trip.boxes}</td>
                                            <td>${trip.largeBoxes}</td>
                                            <td>${trip.smallBoxes}</td>
                                            <td>${trip.completed ? '✅ Completed' : '🔄 Active'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary btn-close-modal">Close</button>
                        <button class="btn btn-success" id="exportReportBtn">Export as CSV</button>
                        <button class="btn btn-primary" id="printReportBtn">Print Report</button>
                        <button class="btn btn-info" id="emailReportBtn">Email Report</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close handlers
            const closeModal = () => modal.remove();
            modal.querySelector('.btn-close').addEventListener('click', closeModal);
            modal.querySelector('.btn-close-modal').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            
            // Export report
            modal.querySelector('#exportReportBtn').addEventListener('click', () => {
                this.exportData('csv');
                closeModal();
            });
            
            // Print report
            modal.querySelector('#printReportBtn').addEventListener('click', () => {
                this.printReport(report);
                closeModal();
            });
            
            // Email report
            modal.querySelector('#emailReportBtn').addEventListener('click', () => {
                this.emailReport(report);
                closeModal();
            });
        } catch (error) {
            console.error('Error generating daily report:', error);
            this.showMessage('Error generating report', 'error');
        }
    }
    
    printReport(report) {
        try {
            const printWindow = window.open('', '_blank');
            const printContent = `
                <html>
                    <head>
                        <title>Daily Report - ${report.date}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2e7d32; padding-bottom: 20px; }
                            .header h1 { color: #2e7d32; margin: 0; }
                            .header .date { color: #666; font-size: 18px; }
                            .stats { display: grid; grid-template-columns: repeat(7, 1fr); gap: 15px; margin: 30px 0; }
                            .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px; }
                            .stat-value { font-size: 24px; font-weight: bold; color: #2e7d32; }
                            .stat-label { color: #666; font-size: 14px; }
                            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            .table th { background: #f5f5f5; padding: 10px; text-align: left; border: 1px solid #ddd; }
                            .table td { padding: 10px; border: 1px solid #ddd; }
                            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
                            @media print {
                                body { padding: 0; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Greenspoon Cooler Box Tracker</h1>
                            <div class="date">Daily Report - ${report.date}</div>
                            <div class="printed">Printed: ${new Date().toLocaleString()}</div>
                        </div>
                        
                        <div class="stats">
                            <div class="stat-card">
                                <div class="stat-value">${report.departures}</div>
                                <div class="stat-label">Departures</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.returns}</div>
                                <div class="stat-label">Returns</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.uniqueRiders}</div>
                                <div class="stat-label">Unique Riders</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.boxesUsed}</div>
                                <div class="stat-label">Boxes Used</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.largeBoxesUsed}</div>
                                <div class="stat-label">Large Boxes</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.smallBoxesUsed}</div>
                                <div class="stat-label">Small Boxes</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${report.missingReported}</div>
                                <div class="stat-label">Missing Reported</div>
                            </div>
                        </div>
                        
                        <h3>Today's Trips</h3>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Type</th>
                                    <th>Rider</th>
                                    <th>Boxes</th>
                                    <th>Large</th>
                                    <th>Small</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.trips.map(trip => `
                                    <tr>
                                        <td>${trip.time}</td>
                                        <td>${trip.type}</td>
                                        <td>${trip.rider}</td>
                                        <td>${trip.boxes}</td>
                                        <td>${trip.largeBoxes}</td>
                                        <td>${trip.smallBoxes}</td>
                                        <td>${trip.completed ? 'Completed' : 'Active'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div class="footer">
                            <div>Generated by Greenspoon Cooler Box Tracking System</div>
                            <div>For internal use only</div>
                        </div>
                        
                        <script>
                            window.onload = function() { 
                                window.print(); 
                                setTimeout(() => { window.close(); }, 1000);
                            }
                        </script>
                    </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
        } catch (error) {
            console.error('Error printing report:', error);
            this.showMessage('Error printing report', 'error');
        }
    }
    
    emailReport(report) {
        try {
            const emailBody = `
                Greenspoon Daily Report - ${report.date}
                
                Summary:
                - Departures: ${report.departures}
                - Returns: ${report.returns}
                - Unique Riders: ${report.uniqueRiders}
                - Boxes Used: ${report.boxesUsed}
                - Large Boxes: ${report.largeBoxesUsed}
                - Small Boxes: ${report.smallBoxesUsed}
                - Missing Reported: ${report.missingReported}
                
                Today's Trips:
                ${report.trips.map(trip => `- ${trip.time} ${trip.type.toUpperCase()}: ${trip.rider} (${trip.boxes} boxes, ${trip.largeBoxes} large, ${trip.smallBoxes} small) - ${trip.completed ? 'Completed' : 'Active'}`).join('\n')}
                
                Generated by Greenspoon Cooler Box Tracking System
                Report Date: ${new Date().toLocaleString()}
            `;
            
            const mailtoLink = `mailto:?subject=Greenspoon Daily Report - ${report.date}&body=${encodeURIComponent(emailBody)}`;
            window.open(mailtoLink, '_blank');
        } catch (error) {
            console.error('Error emailing report:', error);
            this.showMessage('Error creating email', 'error');
        }
    }

    exportData(format = 'json') {
        try {
            const data = DB.exportData(format);
            
            if (!data) {
                this.showMessage('Export failed', 'error');
                return;
            }
            
            // Create download link
            const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            a.href = url;
            a.download = `greenspoon-export-${timestamp}.${format === 'json' ? 'json' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage(`Data exported as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showMessage('Error exporting data', 'error');
        }
    }

    backupData() {
        try {
            const backup = DB.backupData();
            const backupStr = JSON.stringify(backup, null, 2);
            
            // Store in localStorage as backup
            localStorage.setItem('greenspoon_backup_' + new Date().toISOString(), backupStr);
            
            // Offer download
            const blob = new Blob([backupStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            a.href = url;
            a.download = `greenspoon-backup-${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('Backup created and downloaded', 'success');
        } catch (error) {
            console.error('Error backing up data:', error);
            this.showMessage('Error creating backup', 'error');
        }
    }

    showSettingsModal() {
        try {
            const settings = DB.getDatabase().settings || {};
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>⚙️ System Settings</h3>
                        <button class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="settingsForm">
                            <div class="settings-section">
                                <h4>🕒 Missing Box Alerts</h4>
                                <div class="form-group">
                                    <label for="missingAlertHours">Alert after (hours):</label>
                                    <input type="range" id="missingAlertHours" min="1" max="168" value="${settings.missingBoxAlertHours || 24}" 
                                           oninput="document.getElementById('hoursValue').textContent = this.value + ' hours'">
                                    <div class="range-value">
                                        <span id="hoursValue">${settings.missingBoxAlertHours || 24} hours</span>
                                    </div>
                                    <small>Alert when boxes not returned after specified hours</small>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="enableEmailAlerts" ${settings.enableEmailAlerts ? 'checked' : ''}>
                                        Enable email alerts for missing boxes
                                    </label>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h4>🔊 Audio Settings</h4>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="soundEnabled" ${settings.soundEnabled !== false ? 'checked' : ''}>
                                        Enable scan sounds
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label for="volumeLevel">Volume Level:</label>
                                    <input type="range" id="volumeLevel" min="0" max="100" value="${settings.volumeLevel || 50}"
                                           oninput="document.getElementById('volumeValue').textContent = this.value + '%'">
                                    <div class="range-value">
                                        <span id="volumeValue">${settings.volumeLevel || 50}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h4>🎨 Appearance</h4>
                                <div class="form-group">
                                    <label for="themeSelect">Theme:</label>
                                    <select id="themeSelect">
                                        <option value="green" ${(settings.theme || 'green') === 'green' ? 'selected' : ''}>🌿 Green Theme</option>
                                        <option value="blue" ${settings.theme === 'blue' ? 'selected' : ''}>🔵 Blue Theme</option>
                                        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>🌙 Dark Mode</option>
                                        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>☀️ Light Mode</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="languageSelect">Language:</label>
                                    <select id="languageSelect">
                                        <option value="en" selected>English</option>
                                        <option value="es">Español</option>
                                        <option value="fr">Français</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h4>💾 Data Management</h4>
                                <div class="button-group">
                                    <button type="button" class="btn btn-warning" id="importDataBtn">
                                        📥 Import Data
                                    </button>
                                    <button type="button" class="btn btn-info" id="exportSettingsBtn">
                                        📤 Export Settings
                                    </button>
                                    <button type="button" class="btn btn-danger" id="clearDataBtn">
                                        🗑️ Clear All Data
                                    </button>
                                </div>
                                <small class="warning-text">Warning: Clear Data cannot be undone!</small>
                                
                                <div class="form-group">
                                    <label for="autoBackup">Auto-backup every:</label>
                                    <select id="autoBackup">
                                        <option value="never" ${(settings.autoBackup || 'never') === 'never' ? 'selected' : ''}>Never</option>
                                        <option value="daily" ${settings.autoBackup === 'daily' ? 'selected' : ''}>Daily</option>
                                        <option value="weekly" ${settings.autoBackup === 'weekly' ? 'selected' : ''}>Weekly</option>
                                        <option value="monthly" ${settings.autoBackup === 'monthly' ? 'selected' : ''}>Monthly</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary btn-close-modal">Cancel</button>
                        <button class="btn btn-success" id="saveSettingsBtn">Save Settings</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close handlers
            const closeModal = () => modal.remove();
            modal.querySelector('.btn-close').addEventListener('click', closeModal);
            modal.querySelector('.btn-close-modal').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            
            // Save settings
            modal.querySelector('#saveSettingsBtn').addEventListener('click', () => {
                try {
                    const db = DB.getDatabase();
                    
                    db.settings = db.settings || {};
                    db.settings.missingBoxAlertHours = parseInt(modal.querySelector('#missingAlertHours').value);
                    db.settings.soundEnabled = modal.querySelector('#soundEnabled').checked;
                    db.settings.enableEmailAlerts = modal.querySelector('#enableEmailAlerts').checked;
                    db.settings.volumeLevel = parseInt(modal.querySelector('#volumeLevel').value);
                    db.settings.theme = modal.querySelector('#themeSelect').value;
                    db.settings.language = modal.querySelector('#languageSelect').value;
                    db.settings.autoBackup = modal.querySelector('#autoBackup').value;
                    
                    DB.saveDatabase(db);
                    this.applyTheme(db.settings.theme);
                    
                    this.showMessage('Settings saved successfully', 'success');
                    closeModal();
                } catch (error) {
                    console.error('Error saving settings:', error);
                    this.showMessage('Error saving settings', 'error');
                }
            });
            
            // Import data
            modal.querySelector('#importDataBtn').addEventListener('click', () => {
                closeModal();
                this.importData();
            });
            
            // Export settings
            modal.querySelector('#exportSettingsBtn').addEventListener('click', () => {
                this.exportSettings();
            });
            
            // Clear data
            modal.querySelector('#clearDataBtn').addEventListener('click', () => {
                closeModal();
                this.confirmClearData();
            });
        } catch (error) {
            console.error('Error showing settings modal:', error);
            this.showMessage('Error loading settings', 'error');
        }
    }
    
    exportSettings() {
        try {
            const settings = DB.getDatabase().settings || {};
            const settingsStr = JSON.stringify(settings, null, 2);
            
            const blob = new Blob([settingsStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = `greenspoon-settings-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('Settings exported', 'success');
        } catch (error) {
            console.error('Error exporting settings:', error);
            this.showMessage('Error exporting settings', 'error');
        }
    }
    
    confirmClearData() {
        try {
            if (confirm('⚠️ WARNING: This will delete ALL data including riders, boxes, and trips. This cannot be undone!\n\nAre you ABSOLUTELY sure?')) {
                const response = prompt('FINAL WARNING: All data will be lost. Type "DELETE" to confirm.');
                if (response === 'DELETE') {
                    DB.clearAllData();
                    this.showMessage('All data cleared. System reset.', 'warning');
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else {
                    this.showMessage('Data clear cancelled', 'info');
                }
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showMessage('Error clearing data', 'error');
        }
    }

    importData() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        if (confirm(`Import data from ${file.name}?\n\nThis will replace all current data.`)) {
                            if (DB.importData(event.target.result)) {
                                this.showMessage('Data imported successfully', 'success');
                                setTimeout(() => {
                                    location.reload();
                                }, 1500);
                            } else {
                                this.showMessage('Import failed. Invalid file format.', 'error');
                            }
                        }
                    } catch (error) {
                        console.error('Import error:', error);
                        this.showMessage('Import failed. Invalid JSON file.', 'error');
                    }
                };
                reader.readAsText(file);
            });
            
            input.click();
        } catch (error) {
            console.error('Error importing data:', error);
            this.showMessage('Error importing data', 'error');
        }
    }

    applyTheme(theme) {
        try {
            document.body.className = theme + '-theme';
            
            // Update theme in settings
            const db = DB.getDatabase();
            db.settings = db.settings || {};
            db.settings.theme = theme;
            DB.saveDatabase(db);
            
            // Dispatch theme change event
            document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
        } catch (error) {
            console.error('Error applying theme:', error);
        }
    }

    showMessage(message, type = 'info') {
        try {
            // Create toast notification
            const toast = document.createElement('div');
            toast.className = `toast-notification ${type}`;
            
            const icons = {
                'success': '✅',
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️'
            };
            
            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
                    <span class="toast-message">${message}</span>
                    <button class="toast-close">&times;</button>
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // Auto remove after duration
            const duration = type === 'error' ? 5000 : 3000;
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }, duration);
            
            // Close button
            toast.querySelector('.toast-close').addEventListener('click', () => {
                toast.remove();
            });
            
            // Play sound for important notifications
            const db = DB.getDatabase();
            if ((type === 'error' || type === 'warning') && db.settings?.soundEnabled) {
                const audio = new Audio();
                audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
                audio.volume = db.settings.volumeLevel ? db.settings.volumeLevel / 100 : 0.5;
                audio.play().catch(() => {});
            }
        } catch (error) {
            console.error('Error showing message:', error);
            // Fallback to simple alert
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    checkCompatibility() {
        try {
            // Check for required browser features
            const issues = [];
            
            if (!window.localStorage) {
                issues.push('localStorage is not supported. Data cannot be saved.');
            }
            
            if (!navigator.onLine) {
                this.showMessage('You appear to be offline. Some features may not work.', 'warning');
            }
            
            // Check screen size
            if (window.innerWidth < 768) {
                this.showMessage('For best experience, use landscape mode on mobile devices.', 'info');
            }
            
            if (issues.length > 0) {
                console.warn('Compatibility issues:', issues);
                
                // Show warning to user if critical issues
                if (issues.some(issue => issue.includes('localStorage'))) {
                    this.showMessage('Your browser does not support local storage. Data will not be saved!', 'error');
                }
            }
        } catch (error) {
            console.error('Error checking compatibility:', error);
        }
    }
    
    // Helper methods
    takePhotoWithCamera() {
        // In a real app, this would use the camera API
        alert("Camera functionality would be implemented here. For now, please upload a photo file.");
    }
    
    printRiderQRCode(riderCode = '', riderName = '') {
        try {
            if (!riderCode || !riderName) {
                const codeInput = document.getElementById('riderCode');
                const nameInput = document.getElementById('fullName');
                riderCode = codeInput?.value || 'RIDER_CODE';
                riderName = nameInput?.value || 'RIDER_NAME';
            }
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print QR Badge: ${riderCode}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                            .badge { border: 2px solid #2e7d32; padding: 30px; text-align: center; width: 400px; border-radius: 12px; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); }
                            .badge-header { color: #2e7d32; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                            .rider-name { font-size: 28px; font-weight: bold; margin: 15px 0; }
                            .rider-code { font-size: 20px; background: white; padding: 10px; border-radius: 6px; margin: 15px 0; letter-spacing: 2px; }
                            .qr-placeholder { background: white; padding: 20px; margin: 20px auto; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; border: 1px dashed #ccc; }
                            .instructions { margin-top: 20px; color: #666; font-size: 14px; }
                            @media print {
                                body { padding: 0; }
                                .badge { border: none; box-shadow: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="badge">
                            <div class="badge-header">GREESPOON COOLER BOX TRACKER</div>
                            <div class="rider-name">${riderName}</div>
                            <div class="rider-code">${riderCode}</div>
                            <div class="qr-placeholder">
                                <div style="font-size: 64px;">📇</div>
                            </div>
                            <div class="instructions">
                                Scan QR code to select this rider in the tracking system
                            </div>
                            <div style="margin-top: 20px; font-size: 12px; color: #999;">
                                Issued: ${new Date().toLocaleDateString()}
                            </div>
                        </div>
                        <script>
                            window.onload = function() { 
                                window.print(); 
                                setTimeout(() => { window.close(); }, 1000);
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        } catch (error) {
            console.error('Error printing rider QR code:', error);
            this.showMessage('Error printing badge', 'error');
        }
    }
    
    saveRiderQRCode(riderCode = '', riderName = '') {
        try {
            if (!riderCode || !riderName) {
                const codeInput = document.getElementById('riderCode');
                const nameInput = document.getElementById('fullName');
                riderCode = codeInput?.value || 'RIDER_CODE';
                riderName = nameInput?.value || 'RIDER_NAME';
            }
            
            // In a real app, this would generate an actual QR code image
            const content = `Greenspoon Rider QR Code\n\nName: ${riderName}\nCode: ${riderCode}\nDate: ${new Date().toLocaleDateString()}\n\nScan this code to select rider in the Greenspoon Cooler Box Tracking System.`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = `rider-qr-${riderCode}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('QR code information saved', 'info');
        } catch (error) {
            console.error('Error saving rider QR code:', error);
            this.showMessage('Error saving QR code', 'error');
        }
    }
}

// Enhanced Activity Feed Helper
function addToActivityFeed(activity) {
    try {
        const feed = document.getElementById('activityFeed');
        if (!feed) return;
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item new';
        
        const icon = activity.type === 'departure' ? '🎒' : '📦';
        const typeClass = activity.type;
        
        let details = `${activity.boxes} box${activity.boxes !== 1 ? 'es' : ''}`;
        if (activity.largeBoxes || activity.smallBoxes) {
            details = `${activity.largeBoxes || 0} large, ${activity.smallBoxes || 0} small`;
        }
        if (activity.missing) {
            details += ` (${activity.missing} missing)`;
        }
        
        activityItem.innerHTML = `
            <div class="activity-icon">${icon}</div>
            <div class="activity-details">
                <div class="activity-title">
                    <span class="activity-type ${typeClass}">${activity.type}</span>
                    <span class="activity-rider">${activity.rider}</span>
                </div>
                <div class="activity-info">
                    <span class="activity-boxes">${details}</span>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `;
        
        // Add at the top
        if (feed.firstChild) {
            feed.insertBefore(activityItem, feed.firstChild);
        } else {
            feed.appendChild(activityItem);
        }
        
        // Remove old items if too many
        const items = feed.querySelectorAll('.activity-item');
        if (items.length > 10) {
            for (let i = 10; i < items.length; i++) {
                items[i].remove();
            }
        }
        
        // Add click handler
        activityItem.addEventListener('click', () => {
            // Find the most recent trip for this rider
            const trips = DB.getDatabase().trips;
            const recentTrip = trips
                .filter(t => {
                    const rider = DB.getDatabase().riders.find(r => r.name === activity.rider);
                    return rider && t.riderId === rider.id;
                })
                .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
            
            if (recentTrip && window.GreenspoonApp) {
                window.GreenspoonApp.viewTripDetails(recentTrip.id);
            }
        });
        
        // Remove new class after animation
        setTimeout(() => {
            activityItem.classList.remove('new');
        }, 1000);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('activityAdded', { 
            detail: { activity }
        }));
    } catch (error) {
        console.error('Error adding to activity feed:', error);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new GreenspoonTracker();
        
        // Make app globally available for debugging and automation
        window.GreenspoonApp = app;
        window.app = app;  // For HTML button calls
        window.addToActivityFeed = addToActivityFeed;
        
        console.log('Greenspoon Tracker fully initialized!', app);
        
        // Auto-save check
        setInterval(() => {
            try {
                const db = DB.getDatabase();
                const settings = db.settings || {};
                
                if (settings.autoBackup && settings.autoBackup !== 'never') {
                    const lastBackup = settings.lastBackup;
                    const now = new Date();
                    const shouldBackup = !lastBackup || 
                        (settings.autoBackup === 'daily' && (now - new Date(lastBackup)) > 24 * 60 * 60 * 1000) ||
                        (settings.autoBackup === 'weekly' && (now - new Date(lastBackup)) > 7 * 24 * 60 * 60 * 1000) ||
                        (settings.autoBackup === 'monthly' && (now - new Date(lastBackup)) > 30 * 24 * 60 * 60 * 1000);
                    
                    if (shouldBackup) {
                        console.log('Auto-backup triggered');
                        db.settings.lastBackup = now.toISOString();
                        DB.saveDatabase(db);
                        window.GreenspoonApp.backupData();
                    }
                }
            } catch (error) {
                console.error('Error in auto-backup check:', error);
            }
        }, 60 * 1000); // Check every minute
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error initializing Greenspoon Tracker. Please refresh the page.');
    }
});

// ============= DEPARTURE MODE FUNCTIONS =============
let departureState = {
    selectedRider: null,
    boxes: []
};

function loadDepartureRiders() {
    try {
        const riders = DB.getDatabase().riders || [];
        const activeRiders = riders.filter(r => r.isActive);
        
        const select = document.getElementById('departureRider');
        if (select) {
            select.innerHTML = '<option value="">-- Choose Rider --</option>';
            activeRiders.forEach(rider => {
                const option = document.createElement('option');
                option.value = rider.id;
                option.textContent = `${rider.name} (${rider.code})`;
                select.appendChild(option);
            });
        }
        
        loadRecentDepartures();
    } catch (error) {
        console.error('Error loading departure riders:', error);
    }
}

function confirmRider() {
    const riderSelect = document.getElementById('departureRider');
    const riderId = riderSelect?.value;
    
    if (!riderId) {
        alert('Please select a rider');
        return;
    }
    
    const riders = DB.getDatabase().riders || [];
    // Match by rider_id (like "R-001"), not by database id
    const rider = riders.find(r => r.rider_id === riderId);
    
    if (!rider) {
        alert('Rider not found');
        return;
    }
    
    departureState.selectedRider = rider;
    departureState.boxes = [];
    
    document.getElementById('selectedRiderName').textContent = `${rider.name} (${rider.rider_id})`;
    document.getElementById('step1Section').style.display = 'none';
    document.getElementById('step2Section').style.display = 'block';
    document.getElementById('departureBoxInput').focus();
}

function backToRiderSelection() {
    departureState.selectedRider = null;
    departureState.boxes = [];
    
    document.getElementById('step2Section').style.display = 'none';
    document.getElementById('step1Section').style.display = 'block';
    document.getElementById('departureRider').value = '';
}

function addDepartureBox() {
    const input = document.getElementById('departureBoxInput');
    let boxNumber = input?.value.trim().toUpperCase();
    
    if (!boxNumber) {
        alert('Please enter a box number');
        return;
    }
    
    // Format box number
    boxNumber = formatBoxNumber(boxNumber);
    
    // Check if box exists
    const boxes = DB.getDatabase().boxes || [];
    const box = boxes.find(b => b.boxNumber === boxNumber);
    
    if (!box) {
        alert('Box not found: ' + boxNumber);
        return;
    }
    
    if (box.status !== 'available') {
        alert('Box is not available. Current status: ' + box.status);
        return;
    }
    
    // Check if already added
    if (departureState.boxes.find(b => b.boxNumber === boxNumber)) {
        alert('Box already added');
        return;
    }
    
    departureState.boxes.push(box);
    input.value = '';
    updateDepartureBoxList();
    input.focus();
}

function updateDepartureBoxList() {
    const list = document.getElementById('departureBoxList');
    if (!list) return;
    
    if (departureState.boxes.length === 0) {
        list.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No boxes added yet</div>';
        return;
    }
    
    list.innerHTML = departureState.boxes.map(box => `
        <div class="box-list-item">
            <div>
                <strong>${box.boxNumber}</strong>
                <span class="badge ${box.type === 'Big' ? 'box-type-big' : 'box-type-small'} ms-2">${box.type}</span>
            </div>
            <button class="btn btn-sm btn-danger" onclick="removeDepartureBox('${box.boxNumber}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeDepartureBox(boxNumber) {
    departureState.boxes = departureState.boxes.filter(b => b.boxNumber !== boxNumber);
    updateDepartureBoxList();
}

function showDepartureSummary() {
    if (departureState.boxes.length === 0) {
        alert('Please add at least one box');
        return;
    }
    
    const summaryDiv = document.getElementById('departureSummary');
    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <div class="alert alert-info mb-3">
                <strong>Rider:</strong> ${departureState.selectedRider.name} (${departureState.selectedRider.code})
            </div>
            <div class="alert alert-success mb-3">
                <strong>Total Boxes:</strong> ${departureState.boxes.length}
            </div>
            <div class="list-group mb-3">
                ${departureState.boxes.map(box => `
                    <div class="list-group-item">
                        <strong>${box.boxNumber}</strong>
                        <span class="badge ${box.type === 'Big' ? 'box-type-big' : 'box-type-small'} ms-2">${box.type}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    document.getElementById('step2Section').style.display = 'none';
    document.getElementById('step3Section').style.display = 'block';
}

function backToBoxScanning() {
    document.getElementById('step3Section').style.display = 'none';
    document.getElementById('step2Section').style.display = 'block';
}

function confirmDeparture() {
    if (!departureState.selectedRider || departureState.boxes.length === 0) {
        alert('Invalid departure data');
        return;
    }
    
    try {
        const db = DB.getDatabase();
        
        // Create trip
        const trip = {
            id: 'TRIP-' + Date.now(),
            riderId: departureState.selectedRider.id,
            riderName: departureState.selectedRider.name,
            boxes: departureState.boxes.map(b => b.boxNumber),
            departureTime: new Date().toISOString(),
            returnTime: null,
            status: 'active'
        };
        
        db.trips = db.trips || [];
        db.trips.push(trip);
        
        // Update box statuses
        departureState.boxes.forEach(box => {
            const dbBox = db.boxes.find(b => b.boxNumber === box.boxNumber);
            if (dbBox) {
                dbBox.status = 'in_transit';
                dbBox.currentRider = departureState.selectedRider.id;
                dbBox.lastDeparture = new Date().toISOString();
            }
        });
        
        DB.saveDatabase(db);
        
        alert(`Departure confirmed!\n${departureState.boxes.length} boxes dispatched to ${departureState.selectedRider.name}`);
        
        // Reset and go back to step 1
        departureState = { selectedRider: null, boxes: [] };
        document.getElementById('step3Section').style.display = 'none';
        document.getElementById('step1Section').style.display = 'block';
        
        loadDepartureRiders();
        
        // Update dashboard
        if (window.tracker) {
            tracker.updateDashboard();
            tracker.loadRecentActivity();
        }
    } catch (error) {
        console.error('Error confirming departure:', error);
        alert('Error confirming departure. Please try again.');
    }
}

function loadRecentDepartures() {
    try {
        const db = DB.getDatabase();
        const trips = db.trips || [];
        const recentTrips = trips
            .filter(t => t.status === 'active')
            .sort((a, b) => new Date(b.departureTime) - new Date(a.departureTime))
            .slice(0, 5);
        
        const list = document.getElementById('recentDeparturesList');
        if (!list) return;
        
        if (recentTrips.length === 0) {
            list.innerHTML = '<div class="text-center text-muted py-3">No recent departures</div>';
            return;
        }
        
        list.innerHTML = recentTrips.map(trip => {
            const time = new Date(trip.departureTime);
            const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${trip.riderName}</strong>
                            <div class="text-muted small">${trip.boxes.length} boxes</div>
                        </div>
                        <small class="text-muted">${timeStr}</small>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent departures:', error);
    }
}

function formatBoxNumber(input) {
    // Remove all spaces and hyphens
    let cleaned = input.replace(/[\s\-]/g, '');
    
    // Check if it starts with GS
    if (!cleaned.startsWith('GS')) {
        return input; // Return as is if not in expected format
    }
    
    // Extract parts: GS + B/L + number
    const prefix = cleaned.substring(0, 2); // GS
    const type = cleaned.substring(2, 3).toUpperCase(); // B or L
    const number = cleaned.substring(3); // remaining numbers
    
    // Format as GS-B - 0001 or GS-L - 0001
    return `${prefix}-${type} - ${number.padStart(4, '0')}`;
}

// Initialize departure mode when tab is shown
document.addEventListener('DOMContentLoaded', () => {
    const departureTab = document.querySelector('[data-bs-target="#departure"]');
    if (departureTab) {
        departureTab.addEventListener('shown.bs.tab', loadDepartureRiders);
    }
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GreenspoonTracker, addToActivityFeed };
}