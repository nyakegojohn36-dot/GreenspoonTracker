# Greenspoon Box Tracker - Multi-Platform Guide

## 📱 Mobile App (Android/iOS)

### Installation:
1. Open browser on your phone
2. Navigate to your server IP: `http://YOUR_IP:3000`
3. **Android**: Tap menu → "Add to Home Screen"
4. **iPhone**: Tap Share → "Add to Home Screen"
5. App icon will appear on your home screen

### Features:
✅ Works offline (cached data)
✅ QR scanner uses phone camera
✅ Full functionality like desktop
✅ Push notifications (future)

## 💻 Desktop App

### Windows:
- Run: `Greenspoon Tracker.exe` from dist folder
- OR: Run `npm start` in project folder

### How it works:
- Desktop: Electron app (standalone)
- Mobile: Progressive Web App (installable)
- Both connect to same backend server on port 3000

## 🌐 Web Browser

Access from any device: `http://localhost:3000`

## 📡 Network Setup

### For Multiple Devices:
1. Find your computer's IP address:
   - Windows: `ipconfig` → Look for IPv4 Address
   - Example: `192.168.1.100`

2. Allow firewall access:
   - Windows Firewall → Allow port 3000

3. Connect from phone:
   - Same WiFi network
   - Open: `http://192.168.1.100:3000`

### Server Must Be Running:
- Desktop app: Automatically starts backend
- Manual: `cd backend && node server.js`

## 📊 Database Location

- **Development**: `C:\Users\[user]\Desktop\GreenspoonTracker\database\`
- **Installed Desktop**: `C:\Users\[user]\AppData\Roaming\GreenspoonTracker\`
- **Mobile/Web**: Connects to desktop backend

## 🔒 Security Notes

- App works on local network only (secure)
- For internet access, need proper hosting
- Data stored locally on server computer
