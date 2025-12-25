// COMPLETE SCANNER WITH DEPARTURE & RETURN MODES

class GreenspoonScanner {
    constructor() {
        this.currentMode = 'departure'; // 'departure' or 'return'
        this.currentRider = null;
        this.currentTrip = null; // For return mode only
        this.currentBoxes = [];
        this.returnedBoxes = [];
        this.scanBuffer = '';
        this.scanTimer = null;
        
        // Check if scanner UI elements exist
        const hasScannerUI = document.getElementById('departureModeBtn') !== null;
        
        if (hasScannerUI) {
            this.initializeScanner();
            this.initializeEventListeners();
        } else {
            // Minimal initialization for basic scanning
            this.initializeBasicScanner();
        }
    }
    
    initializeScanner() {
        // Set up scan buffer for QR scanner input
        document.addEventListener('keydown', (e) => {
            // Only capture in scanner tab
            const scannerTab = document.getElementById('scanner');
            if (!scannerTab || scannerTab.style.display !== 'block') return;
            
            // Handle Enter key (QR scanners often send Enter after code)
            if (e.key === 'Enter') {
                e.preventDefault();
                this.processScan(this.scanBuffer);
                this.scanBuffer = '';
                return;
            }
            
            // Ignore modifier keys
            if (e.key.length === 1) {
                this.scanBuffer += e.key;
                
                // Auto-submit after delay (for scanners without Enter)
                clearTimeout(this.scanTimer);
                this.scanTimer = setTimeout(() => {
                    this.processScan(this.scanBuffer);
                    this.scanBuffer = '';
                }, 200);
            }
        });
    }
    
    initializeBasicScanner() {
        // Set up scan buffer for QR scanner input (only for scanner tab)
        document.addEventListener('keydown', (e) => {
            // Only capture in scanner tab
            const scannerTab = document.getElementById('scanner');
            if (!scannerTab || scannerTab.style.display === 'none' || 
                !scannerTab.classList.contains('show')) return;
            
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                this.scanBuffer += e.key;
                clearTimeout(this.scanTimer);
                this.scanTimer = setTimeout(() => {
                    if (this.scanBuffer.length > 3) {
                        this.processScan(this.scanBuffer);
                    }
                    this.scanBuffer = '';
                }, 200);
            }
        });
    }
    
    initializeEventListeners() {
        // Mode switching - only if elements exist
        const departureBtn = document.getElementById('departureModeBtn');
        if (departureBtn) {
            departureBtn.addEventListener('click', () => {
                this.switchMode('departure');
            });
        }
        
        const returnBtn = document.getElementById('returnModeBtn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                this.switchMode('return');
            });
        }
        
        // Departure mode buttons
        const confirmDepartureBtn = document.getElementById('confirmDepartureBtn');
        if (confirmDepartureBtn) {
            confirmDepartureBtn.addEventListener('click', () => {
                this.confirmDeparture();
            });
        }
        
        const clearDepartureBtn = document.getElementById('clearDepartureBtn');
        if (clearDepartureBtn) {
            clearDepartureBtn.addEventListener('click', () => {
                this.clearDeparture();
            });
        }
        
        // Return mode buttons
        const confirmReturnBtn = document.getElementById('confirmReturnBtn');
        if (confirmReturnBtn) {
            confirmReturnBtn.addEventListener('click', () => {
                this.confirmReturn();
            });
        }
        
        const clearReturnBtn = document.getElementById('clearReturnBtn');
        if (clearReturnBtn) {
            clearReturnBtn.addEventListener('click', () => {
                this.clearReturn();
            });
        }
        
        const markAllMissingBtn = document.getElementById('markAllMissingBtn');
        if (markAllMissingBtn) {
            markAllMissingBtn.addEventListener('click', () => {
                this.markAllAsMissing();
            });
        }
        
        // Manual box addition
        const manualAddBox = document.getElementById('manualAddBox');
        if (manualAddBox) {
            manualAddBox.addEventListener('click', () => {
                const input = document.getElementById('departureScannerInput');
                if (input.value) {
                    this.handleBoxScan(input.value, 'departure');
                    input.value = '';
                    input.focus();
                }
            });
        }
        
        const manualAddReturnBox = document.getElementById('manualAddReturnBox');
        if (manualAddReturnBox) {
            manualAddReturnBox.addEventListener('click', () => {
                const input = document.getElementById('returnScannerInput');
                if (input.value) {
                    this.handleBoxScan(input.value, 'return');
                    input.value = '';
                    input.focus();
                }
            });
        }
        
        // Rider search
        const riderSearch = document.getElementById('riderSearch');
        if (riderSearch) {
            riderSearch.addEventListener('input', (e) => {
                this.searchRiders(e.target.value);
            });
        }
        
        const returnRiderSearch = document.getElementById('returnRiderSearch');
        if (returnRiderSearch) {
            returnRiderSearch.addEventListener('input', (e) => {
                this.searchReturnRiders(e.target.value);
            });
        }
        
        // Scanner input enter key
        const departureScannerInput = document.getElementById('departureScannerInput');
        if (departureScannerInput) {
            departureScannerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleBoxScan(e.target.value, 'departure');
                    e.target.value = '';
                }
            });
        }
        
        const returnScannerInput = document.getElementById('returnScannerInput');
        if (returnScannerInput) {
            returnScannerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleBoxScan(e.target.value, 'return');
                    e.target.value = '';
                }
            });
        }
        
        // Initialize UI
        this.updateDepartureTime();
        setInterval(() => this.updateDepartureTime(), 60000);
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update UI - only if elements exist
        const departureModeBtn = document.getElementById('departureModeBtn');
        if (departureModeBtn) {
            departureModeBtn.classList.toggle('active', mode === 'departure');
        }
        
        const returnModeBtn = document.getElementById('returnModeBtn');
        if (returnModeBtn) {
            returnModeBtn.classList.toggle('active', mode === 'return');
        }
        
        const departureMode = document.getElementById('departureMode');
        if (departureMode) {
            departureMode.style.display = mode === 'departure' ? 'block' : 'none';
        }
        
        const returnMode = document.getElementById('returnMode');
        if (returnMode) {
            returnMode.style.display = mode === 'return' ? 'block' : 'none';
        }
        
        // Clear any current state
        if (mode === 'departure') {
            this.clearReturn();
        } else {
            this.clearDeparture();
        }
        
        // Update footer status
        const dataStatus = document.getElementById('dataStatus');
        if (dataStatus) {
            dataStatus.textContent = 
                `Mode: ${mode === 'departure' ? 'Departure' : 'Return'}`;
        }
    }
    
    processScan(code) {
        if (!code || code.trim() === '') return;
        
        const cleanCode = code.trim();
        
        // Play scan sound if enabled
        const settings = DB.getSettings();
        if (settings.soundEnabled) {
            this.playScanSound();
        }
        
        // Check if it's a rider QR code
        if (cleanCode.startsWith('RIDER-')) {
            this.handleRiderScan(cleanCode);
            return;
        }
        
        // Check if it's a box code
        if (DB.isValidBoxCode(cleanCode)) {
            this.handleBoxScan(cleanCode, this.currentMode);
            return;
        }
        
        // Unknown code
        this.showMessage(`Unrecognized code: ${cleanCode}`, 'error');
    }
    
    handleRiderScan(code) {
        const riderId = code.replace('RIDER-', '');
        const rider = DB.getRider(riderId);
        
        if (rider) {
            if (this.currentMode === 'departure') {
                this.setCurrentRider(rider);
                this.showMessage(`Rider selected: ${rider.name}`, 'success');
            } else {
                // In return mode, check if rider has active trip
                const activeTrip = this.getActiveTripForRider(rider.id);
                if (activeTrip) {
                    this.setReturnRider(rider, activeTrip);
                    this.showMessage(`Rider selected: ${rider.name} - Active trip found`, 'success');
                } else {
                    this.showMessage(`${rider.name} has no active trip to return`, 'error');
                }
            }
        } else {
            this.showMessage('Rider not found. Please register first.', 'error');
        }
    }
    
    handleBoxScan(code, mode) {
        const normalizedCode = DB.normalizeBoxCode(code);
        
        // Check if box exists, create if not
        let box = DB.getBox(normalizedCode);
        if (!box) {
            box = DB.createBox(normalizedCode);
            this.showMessage(`New box registered: ${box.code} (${box.type})`, 'info');
        }
        
        // Check box status
        if (box.status === 'damaged') {
            this.showMessage(`Box ${box.code} is marked as damaged and cannot be used.`, 'warning');
            return;
        }
        
        if (mode === 'departure') {
            // For departure mode
            if (box.status === 'in_use') {
                this.showMessage(`Box ${box.code} is already in use`, 'error');
                return;
            }
            
            // Add to current boxes if not already added
            if (!this.currentBoxes.includes(box.code)) {
                this.currentBoxes.push(box.code);
                this.updateDepartureBoxList();
                this.showMessage(`Box added: ${box.code}`, 'success');
            } else {
                this.showMessage(`Box ${box.code} is already in the list`, 'info');
            }
        } else {
            // For return mode
            if (!this.currentTrip) {
                this.showMessage('Please select a rider with an active trip first', 'error');
                return;
            }
            
            // Check if this box belongs to the current trip
            if (!this.currentTrip.boxes.includes(box.code)) {
                this.showMessage(`Box ${box.code} is not part of this trip`, 'warning');
                return;
            }
            
            // Check if already returned
            if (this.returnedBoxes.includes(box.code)) {
                this.showMessage(`Box ${box.code} has already been returned`, 'info');
                return;
            }
            
            // Add to returned boxes
            this.returnedBoxes.push(box.code);
            this.updateReturnBoxList();
            this.showMessage(`Box returned: ${box.code}`, 'success');
        }
    }
    
    // ============ DEPARTURE MODE FUNCTIONS ============
    
    searchRiders(query) {
        if (!query || query.length < 2) {
            document.getElementById('riderResults').innerHTML = '';
            return;
        }
        
        const riders = DB.getActiveRiders();
        const filtered = riders.filter(rider => 
            rider.name.toLowerCase().includes(query.toLowerCase()) ||
            rider.vehicleNumber.toLowerCase().includes(query.toLowerCase())
        );
        
        this.displayRiderResults(filtered);
    }
    
    displayRiderResults(riders) {
        const resultsDiv = document.getElementById('riderResults');
        resultsDiv.innerHTML = '';
        
        if (riders.length === 0) {
            resultsDiv.innerHTML = '<div class="text-muted p-2">No riders found</div>';
            return;
        }
        
        riders.forEach(rider => {
            const div = document.createElement('div');
            div.className = 'rider-result-item';
            div.innerHTML = `
                <div class="d-flex align-items-center">
                    ${rider.photo ? 
                        `<img src="${rider.photo}" class="rider-thumb me-2" alt="${rider.name}">` : 
                        `<div class="rider-thumb-placeholder me-2">${rider.name.charAt(0)}</div>`}
                    <div>
                        <strong>${rider.name}</strong>
                        <small class="text-muted d-block">${rider.vehicleType} - ${rider.vehicleNumber}</small>
                    </div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                this.setCurrentRider(rider);
                document.getElementById('riderSearch').value = '';
                resultsDiv.innerHTML = '';
            });
            
            resultsDiv.appendChild(div);
        });
    }
    
    setCurrentRider(rider) {
        this.currentRider = rider;
        
        // Update UI
        const displayDiv = document.getElementById('selectedRiderDisplay');
        displayDiv.innerHTML = `
            <div class="text-center">
                ${rider.photo ? 
                    `<img src="${rider.photo}" class="rider-photo mb-2" alt="${rider.name}">` : 
                    `<div class="rider-photo-placeholder mb-2">${rider.name.charAt(0)}</div>`}
                <h5>${rider.name}</h5>
                <p class="text-muted mb-1">${rider.vehicleType} - ${rider.vehicleNumber}</p>
                <small class="text-muted">${rider.phone || 'No phone'}</small>
            </div>
        `;
        
        // Update summary
        document.getElementById('summaryRiderName').textContent = rider.name;
        
        this.updateDepartureBoxList();
    }
    
    updateDepartureBoxList() {
        const boxList = document.getElementById('departureBoxesList');
        boxList.innerHTML = '';
        
        let largeCount = 0;
        let smallCount = 0;
        
        this.currentBoxes.forEach(boxCode => {
            const box = DB.getBox(boxCode);
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            if (box.type === 'large') largeCount++;
            if (box.type === 'small') smallCount++;
            
            const boxTypeBadge = box.type === 'large' ? 
                '<span class="badge bg-primary">L</span>' : 
                '<span class="badge bg-secondary">S</span>';
            
            li.innerHTML = `
                <div>
                    <strong>${box.code}</strong>
                    ${boxTypeBadge}
                </div>
                <button class="btn btn-sm btn-outline-danger remove-departure-box" data-code="${box.code}">
                    <i class="bi bi-x-circle"></i>
                </button>
            `;
            
            boxList.appendChild(li);
        });
        
        // Update counts
        document.getElementById('departureLargeCount').textContent = largeCount;
        document.getElementById('departureSmallCount').textContent = smallCount;
        document.getElementById('departureTotalCount').textContent = this.currentBoxes.length;
        document.getElementById('summaryBoxCount').textContent = this.currentBoxes.length;
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-departure-box').forEach(button => {
            button.addEventListener('click', (e) => {
                const code = e.target.closest('button').dataset.code;
                this.removeDepartureBox(code);
            });
        });
    }
    
    removeDepartureBox(code) {
        const index = this.currentBoxes.indexOf(code);
        if (index > -1) {
            this.currentBoxes.splice(index, 1);
            this.updateDepartureBoxList();
            this.showMessage(`Box ${code} removed`, 'info');
        }
    }
    
    async confirmDeparture() {
        if (!this.currentRider) {
            this.showMessage('Please select a rider first', 'error');
            return;
        }
        
        if (this.currentBoxes.length === 0) {
            this.showMessage('Please scan at least one box', 'error');
            return;
        }
        
        // Check for duplicates
        const hasDuplicates = this.currentBoxes.some((box, index) => 
            this.currentBoxes.indexOf(box) !== index
        );
        
        if (hasDuplicates) {
            this.showMessage('Duplicate box codes detected. Please remove duplicates.', 'error');
            return;
        }
        
        // Check if boxes are already in use
        const inUseBoxes = this.currentBoxes.filter(code => {
            const box = DB.getBox(code);
            return box && box.status === 'in_use';
        });
        
        if (inUseBoxes.length > 0) {
            const inUseList = inUseBoxes.join(', ');
            this.showMessage(`These boxes are already in use: ${inUseList}`, 'error');
            return;
        }
        
        // Create trip
        const trip = DB.createTrip({
            riderId: this.currentRider.id,
            riderName: this.currentRider.name,
            boxes: this.currentBoxes,
            notes: document.getElementById('departureNotes').value
        });
        
        if (trip) {
            this.showMessage(`Departure recorded! ${this.currentBoxes.length} boxes assigned.`, 'success');
            
            // Add to recent departures
            this.addRecentDeparture(trip);
            
            // Clear form
            this.clearDeparture();
            
            // Update dashboard
            if (window.updateDashboard) {
                window.updateDashboard();
            }
            
            // Play success sound
            this.playSuccessSound();
        } else {
            this.showMessage('Failed to record departure', 'error');
        }
    }
    
    clearDeparture() {
        this.currentRider = null;
        this.currentBoxes = [];
        
        // Clear UI
        document.getElementById('selectedRiderDisplay').innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-person-x" style="font-size: 3rem;"></i>
                <p class="mt-2">No rider selected</p>
                <small>Search for a rider or scan their badge</small>
            </div>
        `;
        
        document.getElementById('riderSearch').value = '';
        document.getElementById('departureScannerInput').value = '';
        document.getElementById('departureNotes').value = '';
        document.getElementById('riderResults').innerHTML = '';
        
        document.getElementById('summaryRiderName').textContent = 'Not selected';
        document.getElementById('summaryBoxCount').textContent = '0';
        
        this.updateDepartureBoxList();
    }
    
    // ============ RETURN MODE FUNCTIONS ============
    
    searchReturnRiders(query) {
        if (!query || query.length < 2) {
            document.getElementById('activeTripsList').innerHTML = '';
            return;
        }
        
        const activeTrips = DB.getActiveTrips();
        const riders = DB.getActiveRiders();
        
        // Filter riders with active trips
        const ridersWithTrips = riders.filter(rider => 
            activeTrips.some(trip => trip.riderId === rider.id) &&
            (rider.name.toLowerCase().includes(query.toLowerCase()) ||
             rider.vehicleNumber.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.displayActiveTripsList(ridersWithTrips, activeTrips);
    }
    
    displayActiveTripsList(riders, activeTrips) {
        const listDiv = document.getElementById('activeTripsList');
        listDiv.innerHTML = '';
        
        if (riders.length === 0) {
            listDiv.innerHTML = '<div class="text-muted p-2">No active trips found</div>';
            return;
        }
        
        riders.forEach(rider => {
            const trip = activeTrips.find(t => t.riderId === rider.id);
            const div = document.createElement('div');
            div.className = 'trip-result-item';
            
            const departureTime = new Date(trip.departureTime);
            const duration = this.calculateDuration(departureTime);
            
            div.innerHTML = `
                <div class="d-flex align-items-center">
                    ${rider.photo ? 
                        `<img src="${rider.photo}" class="rider-thumb me-2" alt="${rider.name}">` : 
                        `<div class="rider-thumb-placeholder me-2">${rider.name.charAt(0)}</div>`}
                    <div class="flex-grow-1">
                        <strong>${rider.name}</strong>
                        <small class="text-muted d-block">
                            ${trip.boxes.length} boxes • Departed: ${departureTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </small>
                        <small class="text-muted">Duration: ${duration}</small>
                    </div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                this.setReturnRider(rider, trip);
                document.getElementById('returnRiderSearch').value = '';
                listDiv.innerHTML = '';
            });
            
            listDiv.appendChild(div);
        });
    }
    
    getActiveTripForRider(riderId) {
        const activeTrips = DB.getActiveTrips();
        return activeTrips.find(trip => trip.riderId === riderId);
    }
    
    setReturnRider(rider, trip) {
        this.currentRider = rider;
        this.currentTrip = trip;
        this.returnedBoxes = [];
        
        // Update UI
        const displayDiv = document.getElementById('selectedReturnRiderDisplay');
        displayDiv.innerHTML = `
            <div class="text-center">
                ${rider.photo ? 
                    `<img src="${rider.photo}" class="rider-photo mb-2" alt="${rider.name}">` : 
                    `<div class="rider-photo-placeholder mb-2">${rider.name.charAt(0)}</div>`}
                <h5>${rider.name}</h5>
                <p class="text-muted mb-1">Active Trip</p>
                <small class="text-muted">${trip.boxes.length} boxes taken</small>
            </div>
        `;
        
        // Show trip details
        document.getElementById('returnTripDetails').style.display = 'block';
        
        const departureTime = new Date(trip.departureTime);
        const duration = this.calculateDuration(departureTime);
        
        document.getElementById('returnDepartureTime').textContent = 
            departureTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        document.getElementById('returnTripDuration').textContent = duration;
        document.getElementById('returnBoxesTaken').textContent = trip.boxes.length;
        
        // Update summary
        document.getElementById('summaryReturnRiderName').textContent = rider.name;
        document.getElementById('summaryExpectedCount').textContent = trip.boxes.length;
        document.getElementById('expectedReturnCount').textContent = trip.boxes.length;
        
        // Update progress
        this.updateReturnProgress();
        
        // Enable confirm button
        document.getElementById('confirmReturnBtn').disabled = false;
        
        this.updateReturnBoxList();
    }
    
    updateReturnBoxList() {
        const returnedList = document.getElementById('returnedBoxesList');
        const missingList = document.getElementById('missingBoxesListItems');
        
        returnedList.innerHTML = '';
        missingList.innerHTML = '';
        
        if (!this.currentTrip) return;
        
        let returnedLarge = 0;
        let returnedSmall = 0;
        
        // Show returned boxes
        this.returnedBoxes.forEach(boxCode => {
            const box = DB.getBox(boxCode);
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-success d-flex justify-content-between align-items-center';
            
            if (box.type === 'large') returnedLarge++;
            if (box.type === 'small') returnedSmall++;
            
            li.innerHTML = `
                <div>
                    <strong>${box.code}</strong>
                    <span class="badge ${box.type === 'large' ? 'bg-primary' : 'bg-secondary'} ms-2">${box.type.charAt(0).toUpperCase()}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-return-box" data-code="${box.code}">
                    <i class="bi bi-x-circle"></i>
                </button>
            `;
            
            returnedList.appendChild(li);
        });
        
        // Show missing boxes (boxes from trip that haven't been returned)
        const missingBoxes = this.currentTrip.boxes.filter(box => 
            !this.returnedBoxes.includes(box)
        );
        
        missingBoxes.forEach(boxCode => {
            const box = DB.getBox(boxCode);
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-danger';
            
            li.innerHTML = `
                <div>
                    <strong>${box.code}</strong>
                    <span class="badge ${box.type === 'large' ? 'bg-primary' : 'bg-secondary'} ms-2">${box.type.charAt(0).toUpperCase()}</span>
                    <small class="text-muted d-block">Not returned</small>
                </div>
            `;
            
            missingList.appendChild(li);
        });
        
        // Update counts
        document.getElementById('returnLargeCount').textContent = returnedLarge;
        document.getElementById('returnSmallCount').textContent = returnedSmall;
        document.getElementById('returnTotalCount').textContent = this.returnedBoxes.length;
        
        document.getElementById('summaryReturnedCount').textContent = this.returnedBoxes.length;
        document.getElementById('summaryMissingCount').textContent = missingBoxes.length;
        document.getElementById('missingCount').textContent = missingBoxes.length;
        
        // Update progress bar
        const progress = this.currentTrip.boxes.length > 0 ? 
            (this.returnedBoxes.length / this.currentTrip.boxes.length) * 100 : 0;
        
        document.getElementById('returnProgressBar').style.width = `${progress}%`;
        
        // Show/hide missing boxes section
        if (missingBoxes.length > 0) {
            document.getElementById('missingBoxesReturnList').style.display = 'block';
            document.getElementById('missingCountDisplay').style.display = 'block';
            document.getElementById('missingBoxWarning').style.display = 'block';
            document.getElementById('markAllMissingBtn').style.display = 'block';
        } else {
            document.getElementById('missingBoxesReturnList').style.display = 'none';
            document.getElementById('missingCountDisplay').style.display = 'none';
            document.getElementById('missingBoxWarning').style.display = 'none';
            document.getElementById('markAllMissingBtn').style.display = 'none';
        }
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-return-box').forEach(button => {
            button.addEventListener('click', (e) => {
                const code = e.target.closest('button').dataset.code;
                this.removeReturnedBox(code);
            });
        });
    }
    
    removeReturnedBox(code) {
        const index = this.returnedBoxes.indexOf(code);
        if (index > -1) {
            this.returnedBoxes.splice(index, 1);
            this.updateReturnBoxList();
            this.showMessage(`Box ${code} removed from returns`, 'info');
        }
    }
    
    updateReturnProgress() {
        if (!this.currentTrip) return;
        
        const progress = this.currentTrip.boxes.length > 0 ? 
            (this.returnedBoxes.length / this.currentTrip.boxes.length) * 100 : 0;
        
        document.getElementById('returnProgressBar').style.width = `${progress}%`;
        
        // Update button state
        document.getElementById('confirmReturnBtn').disabled = this.returnedBoxes.length === 0;
    }
    
    async confirmReturn() {
        if (!this.currentTrip) {
            this.showMessage('No active trip selected', 'error');
            return;
        }
        
        if (this.returnedBoxes.length === 0) {
            this.showMessage('Please scan at least one returned box', 'error');
            return;
        }
        
        // Check for duplicates in returned boxes
        const hasDuplicates = this.returnedBoxes.some((box, index) => 
            this.returnedBoxes.indexOf(box) !== index
        );
        
        if (hasDuplicates) {
            this.showMessage('Duplicate box codes in returned boxes', 'error');
            return;
        }
        
        // Complete the trip
        const success = DB.completeTrip(this.currentTrip.id, this.returnedBoxes);
        
        if (success) {
            const missingBoxes = this.currentTrip.boxes.filter(box => 
                !this.returnedBoxes.includes(box)
            );
            
            if (missingBoxes.length > 0) {
                this.showMessage(
                    `Return recorded! ${missingBoxes.length} box(es) marked as missing.`, 
                    'warning'
                );
                
                // Show missing boxes alert
                const missingList = missingBoxes.join(', ');
                setTimeout(() => {
                    alert(`⚠️ MISSING BOXES ALERT:\n\n${missingList}\n\nThese boxes have been marked as missing and will appear on the dashboard.`);
                }, 500);
            } else {
                this.showMessage('Return recorded! All boxes accounted for.', 'success');
            }
            
            // Add to recent returns
            this.addRecentReturn(this.currentTrip, this.returnedBoxes, missingBoxes);
            
            // Clear form
            this.clearReturn();
            
            // Update dashboard
            if (window.updateDashboard) {
                window.updateDashboard();
            }
            
            // Play success sound
            this.playSuccessSound();
        } else {
            this.showMessage('Failed to record return', 'error');
        }
    }
    
    markAllAsMissing() {
        if (!this.currentTrip || !confirm('Mark ALL remaining boxes as missing? This cannot be undone.')) {
            return;
        }
        
        // All boxes from trip are missing
        this.returnedBoxes = [];
        this.confirmReturn();
    }
    
    clearReturn() {
        this.currentRider = null;
        this.currentTrip = null;
        this.returnedBoxes = [];
        
        // Clear UI
        document.getElementById('selectedReturnRiderDisplay').innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-person-check" style="font-size: 3rem;"></i>
                <p class="mt-2">No rider selected</p>
                <small>Select a rider with active trip</small>
            </div>
        `;
        
        document.getElementById('returnTripDetails').style.display = 'none';
        document.getElementById('returnRiderSearch').value = '';
        document.getElementById('returnScannerInput').value = '';
        document.getElementById('returnNotes').value = '';
        document.getElementById('activeTripsList').innerHTML = '';
        document.getElementById('missingBoxesReturnList').style.display = 'none';
        document.getElementById('missingCountDisplay').style.display = 'none';
        document.getElementById('missingBoxWarning').style.display = 'none';
        document.getElementById('markAllMissingBtn').style.display = 'none';
        
        document.getElementById('summaryReturnRiderName').textContent = 'Not selected';
        document.getElementById('summaryReturnedCount').textContent = '0';
        document.getElementById('summaryExpectedCount').textContent = '0';
        document.getElementById('summaryMissingCount').textContent = '0';
        
        document.getElementById('returnProgressBar').style.width = '0%';
        document.getElementById('confirmReturnBtn').disabled = true;
        
        this.updateReturnBoxList();
    }
    
    // ============ HELPER FUNCTIONS ============
    
    calculateDuration(startTime) {
        const now = new Date();
        const diffMs = now - startTime;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes}m`;
        }
        return `${diffMinutes}m`;
    }
    
    updateDepartureTime() {
        const now = new Date();
        const summaryDepartureTime = document.getElementById('summaryDepartureTime');
        if (summaryDepartureTime) {
            summaryDepartureTime.textContent = 
                now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        
        const summaryReturnTime = document.getElementById('summaryReturnTime');
        if (summaryReturnTime) {
            summaryReturnTime.textContent = 
                now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    }
    
    addRecentDeparture(trip) {
        const list = document.getElementById('recentDeparturesList');
        const li = document.createElement('li');
        li.className = 'list-group-item';
        
        const time = new Date(trip.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        li.innerHTML = `
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${trip.riderName}</strong>
                    <small class="text-muted d-block">${trip.boxes.length} boxes</small>
                </div>
                <small class="text-muted">${time}</small>
            </div>
        `;
        
        // Add to top
        list.insertBefore(li, list.firstChild);
        
        // Keep only last 5
        while (list.children.length > 5) {
            list.removeChild(list.lastChild);
        }
    }
    
    addRecentReturn(trip, returnedBoxes, missingBoxes) {
        const list = document.getElementById('recentReturnsList');
        const li = document.createElement('li');
        li.className = 'list-group-item';
        
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        li.innerHTML = `
            <div>
                <div class="d-flex justify-content-between">
                    <strong>${trip.riderName}</strong>
                    <small class="text-muted">${now}</small>
                </div>
                <small class="text-muted d-block">
                    Returned: ${returnedBoxes.length} | Missing: ${missingBoxes.length}
                </small>
            </div>
        `;
        
        // Add to top
        list.insertBefore(li, list.firstChild);
        
        // Keep only last 5
        while (list.children.length > 5) {
            list.removeChild(list.lastChild);
        }
    }
    
    showMessage(message, type = 'info') {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} alert-dismissible fade show`;
        messageDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to scanner tab
        const scannerContent = document.querySelector('#scanner .scanner-container');
        if (scannerContent) {
            // Remove existing alerts
            document.querySelectorAll('#scanner .alert').forEach(alert => alert.remove());
            
            // Add new alert at top
            scannerContent.insertBefore(messageDiv, scannerContent.firstChild);
        }
    }
    
    playScanSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSuccessSound() {
        const settings = DB.getSettings();
        if (!settings.soundEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    loadRiders() {
        // Refresh rider data in scanner (if any dropdowns or caches exist)
        // For now, clear any active search results
        const riderResults = document.getElementById('riderResults');
        if (riderResults) {
            riderResults.innerHTML = '';
        }
        const returnRiderResults = document.getElementById('returnRiderResults');
        if (returnRiderResults) {
            returnRiderResults.innerHTML = '';
        }
    }
}

// Create global scanner instance
window.ScannerApp = new GreenspoonScanner();
