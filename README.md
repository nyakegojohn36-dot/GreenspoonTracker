# 🚚 Greenspoon Box Tracker

A comprehensive real-time tracking system for managing cooler box deliveries, returns, and rider accountability.

## 🎯 The Problem It Solves

**Before:** Manual pen & paper tracking led to:
- 5-10 boxes lost monthly (~$500-1000 in losses)
- No real-time visibility of box locations
- Time-consuming manual searches (2-3 hours daily)
- Frequent disputes about box assignments
- No accountability when boxes went missing

**After:** Digital tracking system provides:
- Real-time box location and status tracking
- Complete audit trail with timestamps
- Automated overdue alerts
- QR code scanning for instant processing
- Zero box losses since implementation

## ✨ Key Features

### 📦 Box Management
- Unique QR code identification for each box (GS-B-001, GS-B-002, etc.)
- Real-time status tracking (Available, In Use, Maintenance)
- Box type categorization (Big/Small boxes)
- Comprehensive box history and usage analytics

### 👥 Rider Management
- Rider registration with unique IDs
- Contact information storage (phone, address)
- Active trip monitoring per rider
- Complete assignment history
- Performance tracking and reports

### 🚚 Trip Tracking
- **Departure Mode**: Scan rider + boxes, select destination
- **Return Mode**: Scan boxes as they return, auto-complete trips
- Predefined destinations (Loresho, Nyari, Gigiri, Runda, Karen, Kilimani)
- Audio feedback on successful scans
- Notes/special instructions per trip
- Automatic timestamp recording

### 📊 Reports & Analytics
- Daily trip summaries with box counts
- Overdue trip alerts (24+ hours)
- Active trips dashboard
- Trip history with filtering
- Rider performance reports
- Box utilization statistics
- Attendance tracking

### 🔋 Battery Management (Optional Module)
- Battery inventory tracking
- Assignment to riders
- Charge level monitoring
- Replacement scheduling

### 📱 Mobile & Desktop Support
- Responsive design for all screen sizes
- Camera QR scanning on mobile devices
- Webcam scanning on desktop
- Touch-optimized interface
- Works offline once loaded

## 💻 System Requirements
- Windows 10/11 or macOS 10.15+ or Linux
- Node.js v18 or later
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Camera/Webcam for QR scanning
- 200MB free disk space

## 🚀 Installation & Deployment

### Option 1: Desktop Application (Windows)
1. Download `Greenspoon-Tracker-Setup-1.2.0.exe`
2. Run installer and follow setup wizard
3. Launch from Desktop shortcut or Start Menu

### Option 2: Web Application (Local)
```bash
# Install dependencies
npm install

# Start backend server
cd backend
npm install
node server.js

# Open frontend
# Navigate to Frontend/index.html in browser
```

### Option 3: Deploy to Railway/Heroku
```bash
# Push to GitHub
git push origin main

# Deploy on Railway
# 1. Connect your GitHub repository
# 2. Configure environment variables
# 3. Deploy automatically from main branch

# Or deploy to Heroku
heroku create greenspoon-tracker
git push heroku main
```

### Environment Variables
```env
PORT=3000
DATABASE_PATH=./database/greenspoon.db
NODE_ENV=production
```

## 📖 Usage Guide

### Initial Setup
1. **Register Boxes**: Add all boxes with unique QR codes
   - Format: GS-B-001, GS-B-002, etc.
   - Assign type (Big/Small)
   - Mark status (Available/Maintenance)

2. **Add Riders**: Register delivery personnel
   - Unique rider ID
   - Full name and contact details
   - Assign to zones/routes (optional)

3. **Configure Destinations**: Set up delivery locations
   - Pre-defined: Loresho, Nyari, Gigiri, Runda, Karen, Kilimani
   - Add custom locations as needed

### Daily Operations

**📤 Sending Boxes (Departure)**
1. Navigate to "Departure Mode" tab
2. Select/search for rider
3. Choose destination from dropdown
4. Click "Start QR Scanner"
5. Scan each box QR code (audio beep confirms)
6. Add notes if needed
7. Click "Complete Trip"

**📥 Receiving Boxes (Return)**
1. Navigate to "Return Boxes" tab
2. View all active trips
3. Click on rider's trip to return boxes
4. Scan returning boxes one by one
5. System auto-completes when all boxes returned

**📊 Viewing Reports**
1. Navigate to "Reports" tab
2. View daily summaries
3. Check overdue trips (24+ hours)
4. Filter by date range
5. Export reports (PDF/Excel)

**🔍 Tracking & Search**
- Search boxes by number or status
- Find rider assignments
- View trip history
- Check box location in real-time

## 💾 Data Storage & Backup
- **Database**: SQLite (`database/greenspoon.db`)
- **Location**: Local storage in project folder
- **Automatic Backups**: Daily backups to `/backups` folder
- **Manual Backup**: Copy `greenspoon.db` file to safe location
- **Data Retention**: All historical data preserved

## 🛠 Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3.0 for responsive design
- Chart.js for analytics visualization
- Html5-qrcode 2.3.8 for QR scanning
- Font Awesome 6.4.0 for icons

**Backend:**
- Node.js with Express.js
- SQLite3 database
- RESTful API architecture
- CORS enabled for cross-origin requests

**Deployment:**
- Railway / Heroku ready
- Environment variable configuration
- Automatic server detection (local/production)

## 🔧 Troubleshooting

### Application won't start
- Ensure port 3000 is available
- Check Node.js installation: `node --version`
- Restart the application
- Check firewall settings

### QR Scanner not working
- Enable camera permissions in browser
- Use HTTPS for mobile camera access
- Check camera is not in use by another app
- Try different browser (Chrome recommended)

### Database issues
- Check `database/greenspoon.db` exists
- Restore from backup if corrupted
- Run `node setup-database.js` to reset

### Cannot access from mobile
- Ensure both devices on same network
- Use computer's IP address (not localhost)
- Enable port forwarding on router if needed

## 🔐 Security Features
- SQL injection prevention (parameterized queries)
- Input validation on all forms
- CORS configuration for API security
- Session management for active users
- Audit trail for all transactions

## 📈 Performance Metrics (Since Implementation)
- **Box Loss Reduction**: 100% (from 5-10/month to 0)
- **Time Saved**: 2-3 hours daily on manual tracking
- **Cost Savings**: $500-1000 monthly (box replacement costs)
- **Accountability**: Complete audit trail for 100% of trips
- **Efficiency**: 95% faster box location lookup

## 🤝 Contributing
Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📜 License
This project is proprietary software for Greenspoon deliveries.

## 📞 Support & Contact
For technical support or feature requests:
- **GitHub**: [https://github.com/Nyakego254/GreenspoonTracker](https://github.com/Nyakego254/GreenspoonTracker)
- **Email**: support@greenspoon.com
- **Documentation**: See SYSTEM_SUMMARY.md for detailed information

## 📚 Additional Documentation
- `SYSTEM_SUMMARY.md` - Complete system overview and business context
- `BATTERY_MANAGEMENT_GUIDE.md` - Battery tracking module guide
- `MOBILE_DESKTOP_GUIDE.md` - Platform-specific instructions
- `DEPLOY_ONLINE.md` - Cloud deployment guide
- `CAMERA_FIX.md` - QR scanner troubleshooting

## 🏆 Version History
- **v1.3.0** (Current) - Enhanced features
  - Battery management module
  - Advanced reporting and analytics
  - Attendance tracking
  - Mobile optimization improvements
  - Performance enhancements

- **v1.2.0** - Desktop application with offline support
  - Reports tab with overdue tracking
  - Required destination selection
  - Improved trip management
  - Full offline capability

- **v1.0.0** - Initial web-based version
  - Basic box and rider management
  - QR code scanning
  - Trip departure and return tracking

---

**Built with ❤️ for efficient delivery management**
  - Trip tracking and returns
  - QR code scanning
