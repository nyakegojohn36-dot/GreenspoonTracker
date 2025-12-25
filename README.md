# Greenspoon Box Tracker - Desktop Application

A complete offline box tracking system for managing deliveries and returns.

## Features
- ✅ Box registration and management
- ✅ Rider management
- ✅ Trip tracking with QR code scanning
- ✅ Real-time return processing
- ✅ Overdue trip reports
- ✅ Complete trip history
- ✅ Works 100% offline
- ✅ Desktop application (no browser needed)

## System Requirements
- Windows 10 or later (64-bit)
- 200MB free disk space

## Installation

### Option 1: Install from Installer (Recommended)
1. Run `Greenspoon-Tracker-Setup-1.2.0.exe`
2. Follow the installation wizard
3. Launch from Desktop shortcut or Start Menu

### Option 2: Run from Source
1. Install Node.js (v18 or later) from https://nodejs.org
2. Open Command Prompt in the project folder
3. Run: `npm install`
4. Run: `npm start`

## Building the Installer

To create the Windows installer:

```bash
# Install dependencies
npm install

# Build the installer
npm run build:win
```

The installer will be created in the `dist` folder.

## Usage

### Starting the Application
- Double-click the desktop shortcut, or
- Find "Greenspoon Tracker" in Start Menu

The application will automatically:
- Start the backend server
- Open the tracking interface
- Be ready to use in seconds

### First Time Setup
1. Register your boxes using QR codes or manual entry
2. Add riders to the system
3. Start tracking departures and returns

### Daily Operations
- **Departure Mode**: Scan rider, scan boxes, select destination
- **Return Mode**: Scan boxes as they come back
- **Reports Tab**: View overdue deliveries and active trips
- **Trip History**: See all completed trips

## Data Storage
All data is stored locally in:
- Database: `database/greenspoon.db`
- Backups: Create copies of this file for backup

## Troubleshooting

### Application won't start
- Ensure no other instance is running
- Check if port 3000 is available
- Restart your computer

### Database issues
- Close the application
- Delete `database/greenspoon.db`
- Restart the application (creates new database)

### QR Scanner not working
- Check camera permissions in Windows Settings
- Ensure camera is not being used by another application

## Support
For issues or questions, contact your system administrator.

## Version History
- **v1.2.0** - Desktop application with offline support
  - Added Reports tab with overdue tracking
  - Required destination selection
  - Improved trip management
  - Full offline capability

- **v1.0.0** - Initial web-based version
  - Basic box and rider management
  - Trip tracking and returns
  - QR code scanning
