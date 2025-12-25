// =========== GLOBAL VARIABLES ===========
// Detect how the app is being accessed and set API base accordingly
const IS_HTML_FILE = window.location.protocol === 'file:';
const IS_VS_CODE_SERVER = window.location.port === '5500';
const BACKEND_PORT = '3000';
// Always use localhost:3000 for API calls when on VS Code Server or file protocol
const BACKEND_URL = (IS_HTML_FILE || IS_VS_CODE_SERVER) ? `http://localhost:${BACKEND_PORT}` : '';

console.log('🚀 App Mode:', IS_HTML_FILE ? 'HTML File' : IS_VS_CODE_SERVER ? 'VS Code Server' : 'Express Server');
console.log('📡 Current URL:', window.location.href);
console.log('📡 API Base:', BACKEND_URL || 'Relative');
console.log('📡 Backend is expected at: http://localhost:3000');

let boxesData = [];
let ridersData = [];
let tripsData = [];
let selectedRider = null;
let tripBoxes = [];
let returnType = 'available';

// =========== INITIALIZATION ===========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Greenspoon Box Tracker Initializing...');
    
    // Initialize UI
    updateDateTime();
    setInterval(updateDateTime, 1000);
    setupEventListeners();
    
    // Load data
    setTimeout(loadAllData, 500);
});

// =========== UTILITY FUNCTIONS ===========
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const datetimeElement = document.getElementById('currentDateTime');
    if (datetimeElement) {
        datetimeElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.id = toastId;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: duration
    });
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

function formatStatus(status) {
    const statusMap = {
        'available': 'Available',
        'in_transit': 'In Transit',
        'returned': 'Returned',
        'needs_repair': 'Needs Repair'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classes = {
        'available': 'bg-success',
        'in_transit': 'bg-warning',
        'returned': 'bg-secondary',
        'needs_repair': 'bg-danger'
    };
    return classes[status] || 'bg-light text-dark';
}

function normalizeBoxNumber(boxNumber) {
    if (!boxNumber) return '';
    
    let result = String(boxNumber).toUpperCase().trim();
    
    // Remove extra spaces and normalize
    result = result.replace(/\s+/g, '');
    
    // Format: GS-B-001 or GS-S-001
    const match = result.match(/GS[-\s]*([BS])[-\s]*(\d+)/i);
    if (match) {
        const type = match[1].toUpperCase();
        let num = match[2];
        
        // Pad to at least 3 digits
        if (num.length < 3) {
            num = num.padStart(3, '0');
        }
        
        result = `GS-${type}-${num}`;
    }
    
    return result;
}

// =========== API HELPER FUNCTION ===========
async function apiFetch(endpoint, options = {}) {
    const url = `${BACKEND_URL}/api${endpoint}`;
    console.log(`🌐 API Call: ${url}`);
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`❌ API Error (${endpoint}):`, error);
        throw error;
    }
}

// =========== SETUP EVENT LISTENERS ===========
function setupEventListeners() {
    // Scanner tab - Enter key
    const manualBoxInput = document.getElementById('manualBoxInput');
    if (manualBoxInput) {
        manualBoxInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') processManualBox();
        });
    }
    
    // Departure mode - Enter key for box input
    const tripBoxInput = document.getElementById('tripBoxInput');
    if (tripBoxInput) {
        tripBoxInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addBoxToTrip();
        });
    }
    
    // Return mode - Enter key
    const returnBoxInput = document.getElementById('returnBoxInput');
    if (returnBoxInput) {
        returnBoxInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') processReturnBox();
        });
    }
    
    // Tab change events
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target');
            
            setTimeout(() => {
                if (targetId === '#boxes') {
                    populateBoxesTable();
                } else if (targetId === '#riders') {
                    populateRidersGrid();
                } else if (targetId === '#trips') {
                    loadTrips();
                } else if (targetId === '#return') {
                    loadReturnBoxes();
                }
            }, 100);
        });
    });
}

// =========== DATA LOADING FUNCTIONS ===========
async function loadAllData() {
    console.log('📊 Loading all data...');
    
    try {
        // Test connection first
        await testBackendConnection();
        
        // Load data in sequence
        await loadBoxes();
        await loadRiders();
        await loadTrips();
        
        // Update UI
        updateDashboardStats();
        populateRiderSelect();
        updateRecentDepartures();
        
        console.log('✅ All data loaded successfully');
        showToast('System ready', 'success');
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Backend not available. Starting in offline mode.', 'warning');
        showOfflineMode();
    }
}

async function testBackendConnection() {
    try {
        const data = await apiFetch('/health');
        console.log('✅ Backend connected:', data);
        return true;
    } catch (error) {
        console.error('❌ Backend connection failed');
        throw error;
    }
}

async function loadBoxes() {
    try {
        const data = await apiFetch('/boxes');
        boxesData = data.success ? data.boxes : (data.boxes || data);
        console.log(`📦 Loaded ${boxesData.length} boxes`);
        populateBoxesTable();
    } catch (error) {
        boxesData = [];
        console.log('📦 Using empty boxes data');
    }
}

async function loadRiders() {
    try {
        const data = await apiFetch('/riders');
        ridersData = data.success ? data.riders : (data.riders || data);
        console.log(`🚴 Loaded ${ridersData.length} riders`);
        populateRidersGrid();
    } catch (error) {
        ridersData = [];
        console.log('🚴 Using empty riders data');
    }
}

async function loadTrips() {
    try {
        const data = await apiFetch('/trips');
        tripsData = data.success ? data.trips : (data.trips || data);
        console.log(`📋 Loaded ${tripsData.length} trips`);
        populateTripsTable();
    } catch (error) {
        tripsData = [];
        console.log('📋 Using empty trips data');
    }
}

function updateDashboardStats() {
    const totalBoxes = boxesData.length;
    const availableBoxes = boxesData.filter(b => b.status === 'available').length;
    const totalRiders = ridersData.length;
    const activeTrips = tripsData.filter(t => t.status === 'departed').length;
    
    document.getElementById('totalBoxes').textContent = totalBoxes;
    document.getElementById('availableBoxes').textContent = availableBoxes;
    document.getElementById('totalRiders').textContent = totalRiders;
    document.getElementById('activeTrips').textContent = activeTrips;
}

function updateRecentDepartures() {
    const container = document.getElementById('recentDepartures');
    if (!container) return;
    
    const recentTrips = tripsData
        .filter(t => t.status === 'departed')
        .slice(0, 5);
    
    if (recentTrips.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-clock fa-2x mb-2"></i>
                <p>No recent departures</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    recentTrips.forEach(trip => {
        const time = new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const boxCount = Array.isArray(trip.boxes) ? trip.boxes.length : 0;
        
        html += `
            <div class="border-bottom pb-2 mb-2">
                <div class="d-flex justify-content-between">
                    <strong>${trip.rider_name}</strong>
                    <span class="badge bg-warning">Departed</span>
                </div>
                <small class="text-muted">${boxCount} boxes • ${time}</small>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function showOfflineMode() {
    // Show warning and disable forms
    const warningHtml = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Offline Mode</strong><br>
            Backend server not found. Please ensure server.js is running on port 3000.
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-primary" onclick="location.reload()">
                    <i class="fas fa-sync-alt me-1"></i>Retry Connection
                </button>
            </div>
        </div>
    `;
    
    const connectionAlert = document.getElementById('connectionAlert');
    if (connectionAlert) {
        connectionAlert.innerHTML = warningHtml;
        connectionAlert.style.display = 'block';
    }
}

// =========== BOX MANAGEMENT ===========
function populateBoxesTable() {
    const tbody = document.getElementById('boxesTableBody');
    if (!tbody) return;
    
    if (boxesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <i class="fas fa-boxes fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No boxes found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    boxesData.forEach(box => {
        const typeClass = box.box_type === 'B' ? 'box-type-big' : 'box-type-small';
        const typeText = box.box_type === 'B' ? 'Big' : 'Small';
        const statusClass = getStatusClass(box.status);
        const statusText = formatStatus(box.status);
        
        html += `
            <tr>
                <td><strong>${box.box_number}</strong></td>
                <td><span class="badge ${typeClass}">${typeText}</span></td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewBoxDetails('${box.box_number}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function populateRiderSelect() {
    const select = document.getElementById('riderSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Select a rider --</option>';
    
    if (ridersData.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No riders available';
        option.disabled = true;
        select.appendChild(option);
        return;
    }
    
    ridersData.forEach(rider => {
        const option = document.createElement('option');
        option.value = rider.rider_id;
        option.textContent = `${rider.name} (${rider.rider_id})`;
        select.appendChild(option);
    });
}

// =========== SCANNER FUNCTIONS ===========
async function processManualBox() {
    const input = document.getElementById('manualBoxInput');
    if (!input) return;
    
    const boxNumber = normalizeBoxNumber(input.value.trim());
    
    if (!boxNumber) {
        showToast('Please enter a box number', 'warning');
        return;
    }
    
    try {
        const data = await apiFetch(`/boxes/${encodeURIComponent(boxNumber)}`);
        
        if (data.success && data.box) {
            displayBoxInfo(data.box);
            showToast(`Found box: ${boxNumber}`, 'success');
        } else {
            showToast('Box not found', 'danger');
            displayBoxInfo(null);
        }
    } catch (error) {
        showToast('Box not found', 'danger');
        displayBoxInfo(null);
    }
    
    input.value = '';
}

function displayBoxInfo(box) {
    const container = document.getElementById('boxInfo');
    
    if (!box) {
        container.innerHTML = `
            <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
            <h5 class="text-muted">No Box Selected</h5>
            <p class="text-muted">Enter a box number to view details</p>
        `;
        return;
    }
    
    const typeClass = box.box_type === 'B' ? 'box-type-big' : 'box-type-small';
    const typeText = box.box_type === 'B' ? 'Big' : 'Small';
    const statusClass = getStatusClass(box.status);
    const statusText = formatStatus(box.status);
    
    container.innerHTML = `
        <div class="text-start">
            <div class="text-center mb-4">
                <i class="fas fa-box fa-4x text-success mb-3"></i>
                <h4 class="fw-bold">${box.box_number}</h4>
            </div>
            
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Type:</strong><br>
                    <span class="badge ${typeClass}">${typeText}</span>
                </div>
                <div class="col-6">
                    <strong>Status:</strong><br>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>
            </div>
            
            <div class="d-grid gap-2 mt-4">
                <button class="btn btn-outline-primary" onclick="switchToTab('boxes')">
                    <i class="fas fa-list me-2"></i>View All Boxes
                </button>
            </div>
        </div>
    `;
}

function viewBoxDetails(boxNumber) {
    const box = boxesData.find(b => b.box_number === boxNumber);
    if (!box) {
        showToast('Box not found', 'danger');
        return;
    }
    
    document.getElementById('manualBoxInput').value = boxNumber;
    processManualBox();
    switchToTab('scanner');
}

// =========== DEPARTURE MODE ===========
function selectRiderById(riderId) {
    const rider = ridersData.find(r => r.rider_id === riderId);
    if (!rider) {
        showToast('Rider not found', 'danger');
        return;
    }
    
    selectedRider = rider;
    
    // Update UI
    document.getElementById('selectedRiderInfo').style.display = 'block';
    document.getElementById('riderDisplayName').textContent = rider.name;
    document.getElementById('riderDisplayId').textContent = rider.rider_id;
    document.getElementById('scanBoxesSection').style.display = 'block';
    document.getElementById('summaryRiderName').textContent = rider.name;
    document.getElementById('summaryDate').textContent = new Date().toLocaleDateString();
    
    showToast(`Selected rider: ${rider.name}`, 'success');
}

async function addBoxToTrip() {
    if (!selectedRider) {
        showToast('Please select a rider first', 'warning');
        return;
    }
    
    const input = document.getElementById('tripBoxInput');
    if (!input) return;
    
    const boxNumber = normalizeBoxNumber(input.value.trim());
    
    if (!boxNumber) {
        showToast('Please enter a box number', 'warning');
        return;
    }
    
    try {
        const data = await apiFetch(`/boxes/${encodeURIComponent(boxNumber)}`);
        
        if (!data.success || !data.box) {
            showToast(`Box ${boxNumber} not found`, 'danger');
            return;
        }
        
        const box = data.box;
        
        if (box.status !== 'available') {
            showToast(`Box ${boxNumber} is not available (status: ${box.status})`, 'warning');
            return;
        }
        
        // Check if already in trip
        if (tripBoxes.includes(boxNumber)) {
            showToast(`Box ${boxNumber} already added`, 'info');
            return;
        }
        
        // Add to trip
        tripBoxes.push(boxNumber);
        input.value = '';
        updateTripBoxesList();
        
        // Show confirm section
        document.getElementById('confirmTripSection').style.display = 'block';
        
        showToast(`Added box ${boxNumber}`, 'success');
        
    } catch (error) {
        showToast('Error checking box status', 'danger');
    }
}

function updateTripBoxesList() {
    const container = document.getElementById('tripBoxesList');
    const badge = document.getElementById('boxCountBadge');
    const summaryBoxCount = document.getElementById('summaryBoxCount');
    
    if (badge) badge.textContent = tripBoxes.length;
    if (summaryBoxCount) summaryBoxCount.textContent = tripBoxes.length;
    
    if (!container) return;
    
    if (tripBoxes.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-3">No boxes added yet</div>';
        return;
    }
    
    let html = '';
    tripBoxes.forEach((boxNumber, index) => {
        html += `
            <div class="box-list-item">
                <div>
                    <strong>${boxNumber}</strong>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeBoxFromTrip(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function removeBoxFromTrip(index) {
    if (index >= 0 && index < tripBoxes.length) {
        const removedBox = tripBoxes[index];
        tripBoxes.splice(index, 1);
        updateTripBoxesList();
        
        if (tripBoxes.length === 0) {
            document.getElementById('confirmTripSection').style.display = 'none';
        }
    }
}

async function confirmTripDeparture() {
    if (!selectedRider) {
        showToast('Please select a rider', 'warning');
        return;
    }
    
    if (tripBoxes.length === 0) {
        showToast('Please add at least one box', 'warning');
        return;
    }
    
    const destination = document.getElementById('tripDestination')?.value.trim() || '';
    const notes = document.getElementById('tripNotes')?.value.trim() || '';
    
    const tripData = {
        rider_id: selectedRider.rider_id,
        rider_name: selectedRider.name,
        boxes: tripBoxes,
        destination: destination,
        notes: notes
    };
    
    try {
        const data = await apiFetch('/trips', {
            method: 'POST',
            body: JSON.stringify(tripData)
        });
        
        if (data.success) {
            showToast(`Trip created successfully!`, 'success');
            
            // Reset workflow
            selectedRider = null;
            tripBoxes = [];
            document.getElementById('selectedRiderInfo').style.display = 'none';
            document.getElementById('scanBoxesSection').style.display = 'none';
            document.getElementById('confirmTripSection').style.display = 'none';
            document.getElementById('riderSelect').value = '';
            document.getElementById('tripBoxInput').value = '';
            document.getElementById('tripDestination').value = '';
            document.getElementById('tripNotes').value = '';
            updateTripBoxesList();
            
            // Reload data
            setTimeout(loadAllData, 500);
            
        } else {
            showToast('Failed to create trip: ' + (data.error || 'Unknown error'), 'danger');
        }
    } catch (error) {
        showToast('Error creating trip', 'danger');
    }
}

// =========== RETURN MODE ===========
async function loadReturnBoxes() {
    try {
        const data = await apiFetch(`/return/boxes?type=${returnType}`);
        populateReturnBoxesList(data);
    } catch (error) {
        console.error('Error loading return boxes:', error);
    }
}

function populateReturnBoxesList(boxes) {
    const container = document.getElementById('returnBoxesList');
    const countElement = document.getElementById('returnBoxCount');
    
    if (!container) return;
    
    if (countElement) {
        countElement.textContent = boxes.length || 0;
    }
    
    if (!boxes || boxes.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle me-2"></i>
                No boxes found for this return type
            </div>
        `;
        return;
    }
    
    let html = '';
    boxes.forEach(box => {
        const typeClass = box.box_type === 'B' ? 'box-type-big' : 'box-type-small';
        const typeText = box.box_type === 'B' ? 'Big' : 'Small';
        const statusClass = getStatusClass(box.status);
        const statusText = formatStatus(box.status);
        
        html += `
            <div class="return-box-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${box.box_number}</strong>
                        <span class="badge ${typeClass} ms-2">${typeText}</span>
                        <span class="badge ${statusClass} ms-2">${statusText}</span>
                    </div>
                    <button class="btn btn-sm btn-success" onclick="processSingleReturn('${box.box_number}')">
                        <i class="fas fa-check"></i> Return
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function setReturnType(type) {
    returnType = type;
    
    // Update button styles
    const availableBtn = document.getElementById('returnAvailableBtn');
    const repairBtn = document.getElementById('returnRepairBtn');
    
    if (availableBtn && repairBtn) {
        if (type === 'available') {
            availableBtn.classList.add('active', 'btn-success');
            availableBtn.classList.remove('btn-outline-success');
            repairBtn.classList.remove('active', 'btn-warning');
            repairBtn.classList.add('btn-outline-warning');
        } else {
            availableBtn.classList.remove('active', 'btn-success');
            availableBtn.classList.add('btn-outline-success');
            repairBtn.classList.add('active', 'btn-warning');
            repairBtn.classList.remove('btn-outline-warning');
        }
    }
    
    loadReturnBoxes();
}

async function processReturnBox() {
    const input = document.getElementById('returnBoxInput');
    if (!input) return;
    
    const boxNumber = normalizeBoxNumber(input.value.trim());
    
    if (!boxNumber) {
        showToast('Please enter a box number', 'warning');
        return;
    }
    
    await processSingleReturn(boxNumber);
    input.value = '';
}

async function processSingleReturn(boxNumber) {
    const condition = returnType === 'available' ? 'available' : 'needs_repair';
    
    try {
        const data = await apiFetch('/return/process', {
            method: 'POST',
            body: JSON.stringify({
                box_number: boxNumber,
                condition: condition
            })
        });
        
        if (data.success) {
            showToast(`Box ${boxNumber} returned as ${condition}`, 'success');
            setTimeout(loadAllData, 500);
        } else {
            showToast('Failed to return box', 'danger');
        }
    } catch (error) {
        showToast('Error returning box', 'danger');
    }
}

// =========== RIDER MANAGEMENT ===========
function populateRidersGrid() {
    const grid = document.getElementById('ridersGrid');
    if (!grid) return;
    
    if (ridersData.length === 0) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-light text-center">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No riders found</p>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    ridersData.forEach(rider => {
        html += `
            <div class="col">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <div class="mb-3">
                            <i class="fas fa-user-circle fa-3x text-success"></i>
                        </div>
                        <h5 class="card-title">${rider.name}</h5>
                        <p class="card-text text-muted">${rider.rider_id}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function showAddRiderModal() {
    document.getElementById('newRiderId').value = '';
    document.getElementById('newRiderName').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('addRiderModal'));
    modal.show();
}

async function saveNewRider() {
    const riderId = document.getElementById('newRiderId').value.trim();
    const name = document.getElementById('newRiderName').value.trim();
    
    if (!riderId || !name) {
        showToast('Rider ID and name are required', 'warning');
        return;
    }
    
    try {
        const data = await apiFetch('/riders', {
            method: 'POST',
            body: JSON.stringify({
                rider_id: riderId,
                name: name
            })
        });
        
        if (data.success) {
            showToast(`Rider ${name} added successfully!`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('addRiderModal')).hide();
            setTimeout(loadAllData, 500);
        } else {
            showToast('Failed to add rider', 'danger');
        }
    } catch (error) {
        showToast('Error adding rider', 'danger');
    }
}

// =========== TRIP MANAGEMENT ===========
function populateTripsTable() {
    const tbody = document.getElementById('tripsTableBody');
    if (!tbody) return;
    
    if (tripsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-shipping-fast fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No trips found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    tripsData.forEach(trip => {
        const statusClass = trip.status === 'departed' ? 'bg-warning' : 'bg-success';
        const statusText = trip.status === 'departed' ? 'Departed' : 'Returned';
        const boxCount = Array.isArray(trip.boxes) ? trip.boxes.length : 0;
        const departureTime = new Date(trip.departure_time).toLocaleString();
        const tripId = trip.id || trip.trip_id;
        
        html += `
            <tr>
                <td>${trip.trip_id || tripId}</td>
                <td>${trip.rider_name}<br><small class="text-muted">${trip.rider_id}</small></td>
                <td>${boxCount} box${boxCount !== 1 ? 'es' : ''}</td>
                <td>${departureTime}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${trip.status === 'departed' ? `
                        <button class="btn btn-sm btn-success" onclick="markTripReturned('${tripId}')">
                            <i class="fas fa-undo"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger ms-1" onclick="deleteTrip('${tripId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

async function markTripReturned(tripId) {
    if (!confirm('Mark this trip as returned?')) return;
    
    try {
        const data = await apiFetch(`/trips/${tripId}/return`, {
            method: 'PUT'
        });
        
        if (data.success) {
            showToast('Trip marked as returned', 'success');
            setTimeout(loadAllData, 500);
        } else {
            showToast('Failed to mark trip as returned', 'danger');
        }
    } catch (error) {
        showToast('Error marking trip returned', 'danger');
    }
}

async function deleteTrip(tripId) {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    
    try {
        const data = await apiFetch(`/trips/${tripId}`, {
            method: 'DELETE'
        });
        
        if (data.success) {
            showToast('Trip deleted successfully', 'success');
            setTimeout(loadAllData, 500);
        } else {
            showToast('Failed to delete trip', 'danger');
        }
    } catch (error) {
        showToast('Error deleting trip', 'danger');
    }
}

// =========== HELPER FUNCTIONS ===========
function switchToTab(tabName) {
    const tab = document.querySelector(`#mainTabs button[data-bs-target="#${tabName}"]`);
    if (tab) {
        bootstrap.Tab.getOrCreateInstance(tab).show();
    }
}

function refreshAllData() {
    loadAllData();
    showToast('Refreshing data...', 'info');
}

// =========== ADD BOX MODAL FUNCTIONS ===========
function showAddBoxModal() {
    selectBoxType('B');
    document.getElementById('boxNumberSuffix').value = '';
    updateBoxPreview();
    
    const modal = new bootstrap.Modal(document.getElementById('addBoxModal'));
    modal.show();
}

function selectBoxType(type) {
    const boxTypeB = document.getElementById('boxTypeB');
    const boxTypeS = document.getElementById('boxTypeS');
    const boxTypeDisplay = document.getElementById('boxTypeDisplay');
    
    if (boxTypeB && boxTypeS && boxTypeDisplay) {
        if (type === 'B') {
            boxTypeB.classList.add('active');
            boxTypeS.classList.remove('active');
            boxTypeDisplay.textContent = 'B';
        } else {
            boxTypeB.classList.remove('active');
            boxTypeS.classList.add('active');
            boxTypeDisplay.textContent = 'S';
        }
        updateBoxPreview();
    }
}

function updateBoxPreview() {
    const type = document.getElementById('boxTypeDisplay')?.textContent || 'B';
    const suffix = document.getElementById('boxNumberSuffix')?.value.trim() || '001';
    const paddedSuffix = suffix.padStart(3, '0');
    
    const boxPreview = document.getElementById('boxPreview');
    if (boxPreview) {
        boxPreview.textContent = `GS-${type}-${paddedSuffix}`;
    }
}

async function saveNewBox() {
    const type = document.getElementById('boxTypeDisplay')?.textContent;
    const suffix = document.getElementById('boxNumberSuffix')?.value.trim();
    
    if (!type || !suffix) {
        showToast('Please enter a box number', 'warning');
        return;
    }
    
    const paddedSuffix = suffix.padStart(3, '0');
    const boxNumber = `GS-${type}-${paddedSuffix}`;
    
    try {
        const data = await apiFetch('/boxes', {
            method: 'POST',
            body: JSON.stringify({
                box_number: boxNumber,
                box_type: type,
                status: 'available'
            })
        });
        
        if (data.success) {
            showToast(`Box ${boxNumber} added successfully!`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('addBoxModal')).hide();
            setTimeout(loadAllData, 500);
        } else {
            showToast('Failed to add box', 'danger');
        }
    } catch (error) {
        showToast('Error adding box', 'danger');
    }
}

// Initialize
console.log('✅ Greenspoon Box Tracker loaded');