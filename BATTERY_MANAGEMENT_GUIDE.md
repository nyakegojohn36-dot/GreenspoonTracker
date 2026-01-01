# Battery Management Feature Guide

## Overview
The Battery Management system tracks vehicle and motorcycle batteries issued to riders using QR code technology, just like the cooler box system.

## Features Added

### 1. **Battery Tab**
New dedicated tab in the main navigation for managing all battery-related operations.

### 2. **Battery Registration**
- Add batteries with unique IDs (e.g., BAT-001, BAT-002)
- Specify vehicle type (Motorcycle or Vehicle)
- Record vehicle registration number
- Add notes about battery condition

### 3. **Battery Issuance**
- Select rider from dropdown
- Scan battery QR code or enter manually
- Select vehicle type
- Enter vehicle registration
- Select destination (6 predefined locations)
- Add optional notes
- System timestamps the issue automatically

### 4. **Battery Return**
- View all active battery assignments
- Scan battery QR code to return
- Or click "Return" button on active assignment
- System timestamps the return automatically
- Battery status automatically updated to "available"

### 5. **Battery Inventory**
- View all registered batteries
- See current status (Available, In Use, Charging, Maintenance)
- View which rider currently has each battery
- Delete batteries if needed

### 6. **Assignment History**
- Complete history of all battery assignments
- View who took which battery and when
- See issue and return times
- Track assignment status

### 7. **Statistics Dashboard**
- Total batteries count
- Available batteries
- Batteries in use
- Overdue batteries (>24 hours)

## How to Use

### Adding a New Battery
1. Go to "Battery Management" tab
2. Click "+ Add Battery" button
3. Enter battery number (e.g., BAT-001)
4. Select vehicle type (Motorcycle/Vehicle)
5. Enter vehicle registration (optional)
6. Add notes (optional)
7. Click "Save Battery"

### Issuing a Battery
1. Go to "Battery Management" tab
2. In the "Issue Battery" section:
   - Select rider from dropdown
   - Scan battery QR code OR enter battery number manually
   - Select vehicle type
   - Enter vehicle registration
   - Select destination
   - Add notes (optional)
3. Click "Issue Battery"
4. System will play success beep

### Returning a Battery
**Method 1: From Active Assignments List**
1. View the "Active Battery Assignments" list
2. Click "Return" button next to the assignment
3. Confirm the return

**Method 2: QR Code Scan**
1. Click "Start Scanner" in the Return Battery section
2. Scan the battery QR code
3. System automatically finds the assignment and returns it

### Viewing Battery Information
- **Battery Inventory**: Shows all batteries with current status
- **Assignment History**: Shows all past and current assignments
- **Statistics Cards**: Real-time counts at top of page

## Database Schema

### Batteries Table
- `battery_number` - Unique identifier (e.g., BAT-001)
- `vehicle_type` - Motorcycle or Vehicle
- `vehicle_registration` - License plate
- `status` - available, in_use, charging, maintenance, retired
- `created_at` - Registration timestamp
- `notes` - Additional information

### Battery Assignments Table
- `assignment_id` - Unique assignment ID
- `battery_number` - Which battery
- `rider_id` - Which rider
- `rider_name` - Rider's name
- `vehicle_type` - Motorcycle/Vehicle
- `vehicle_registration` - License plate
- `destination` - Where rider is going
- `issue_time` - When issued
- `return_time` - When returned
- `status` - active or returned
- `notes` - Additional notes

## API Endpoints

### Battery Endpoints
- `GET /api/batteries` - Get all batteries
- `GET /api/batteries/:battery_number` - Get specific battery
- `POST /api/batteries` - Create new battery
- `PUT /api/batteries/:battery_number` - Update battery
- `DELETE /api/batteries/:battery_number` - Delete battery
- `GET /api/batteries/stats/summary` - Get battery statistics

### Assignment Endpoints
- `GET /api/battery-assignments` - Get all assignments
- `GET /api/battery-assignments/active` - Get active assignments only
- `GET /api/battery-assignments/overdue` - Get overdue assignments (>24hrs)
- `POST /api/battery-assignments` - Issue battery to rider
- `POST /api/battery-assignments/:assignment_id/return` - Return battery

## QR Code Format

**The system accepts ANY QR code format** - no restrictions or format requirements.

The scanners will accept and use whatever content is in your QR codes:
- `BAT-001`, `BATT001`, `B-001` ✅
- `GS-BAT-001`, `GREENSPOON-BAT-1` ✅  
- `BATTERY-MOTORCYCLE-001` ✅
- `12345`, `ABC123XYZ` ✅
- Any alphanumeric string ✅

**The system simply uses whatever you scan** - no parsing, no validation, no format checking. This ensures compatibility with all your existing QR codes regardless of their format.

**Examples of Compatible Formats:**
```
BAT-001
BATTERY-M-001
GS-B-MOTORCYCLE-12
VEH-BATT-2024-001
BIKE-PWR-001
12345
```

All of these will work perfectly!

## Benefits

1. **Complete Accountability**: Track exactly who has which battery at all times
2. **Prevent Loss**: Know immediately when batteries are overdue
3. **Quick Operations**: QR scanning speeds up issue/return process
4. **Historical Data**: Full audit trail of all battery movements
5. **Real-Time Visibility**: Dashboard shows current battery status
6. **Overdue Alerts**: Automatically flags batteries out for >24 hours

## Integration with Existing System

- Uses same rider database as cooler box system
- Same destination options
- Same QR scanning technology
- Same user interface design
- Data stored in same database file
- No conflicts with existing box tracking

## Reports and Analytics

### Available Reports
- Active battery assignments
- Overdue battery assignments (>24 hours)
- Battery assignment history
- Per-rider battery usage

### Future Enhancements (Optional)
- SMS notifications for overdue batteries
- Battery maintenance scheduling
- Battery lifespan tracking
- Export battery reports to Excel/PDF
- Battery charge cycle tracking

## Deployment

The battery management feature is:
- ✅ Fully integrated into existing system
- ✅ Database tables created automatically on server start
- ✅ No additional dependencies required
- ✅ Works on both desktop and mobile
- ✅ Uses HTTPS camera for QR scanning
- ✅ Ready for production use immediately

## Next Steps

1. **Print QR Code Labels**: Create QR code stickers for all batteries (format: BAT-001, BAT-002, etc.)
2. **Register Batteries**: Add all batteries to the system via the "Add Battery" modal
3. **Brief Staff**: 5-minute training on how to issue and return batteries
4. **Start Tracking**: Begin scanning batteries in and out immediately

## Technical Notes

- Battery data persists in SQLite database
- All API calls use same error handling as box system
- QR scanners are independent (can use both box and battery scanners)
- Mobile-responsive design works on all devices
- Auto-refresh every 10 seconds keeps data current

## Support

For issues or questions about the battery management system, refer to the main SYSTEM_SUMMARY.md document or check the backend logs for API errors.

---

**Version**: 1.0  
**Date Added**: January 1, 2026  
**Status**: Production Ready ✅
