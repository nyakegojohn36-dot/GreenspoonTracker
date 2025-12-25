# Mobile Camera Solution

## Problem
Mobile browsers require HTTPS to access camera, but our local server uses HTTP.

## Solutions (Choose One):

### Option 1: Use Manual Input (Easiest) ✅
- Access: `http://192.168.125.254:3000`
- Type box numbers manually instead of scanning
- Use external Bluetooth scanner if available

### Option 2: Use Laptop for QR Scanning
- Riders use phone to view trips/data
- Use laptop/desktop for QR scanning operations
- Both devices access same server

### Option 3: Use ngrok (Free HTTPS tunnel)
1. Download ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Use the https URL provided (e.g., https://abc123.ngrok.io)
4. Camera will work! ✅

### Option 4: Deploy to Cloud (Advanced)
- Deploy to Heroku, Railway, or similar
- Automatic HTTPS
- Camera works from anywhere

## Current Working Setup:
- **Desktop**: http://localhost:3000 (full features including QR)
- **Mobile Data**: http://192.168.125.254:3000 (manual entry only)
- **Mobile Camera**: Use Option 3 (ngrok) for free HTTPS

## Note:
The self-signed certificate approach doesn't work reliably on mobile browsers.
Use ngrok for the easiest mobile camera support.
