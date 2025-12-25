# Deploy Greenspoon Tracker Online (Free)

## Option 1: Railway (Recommended - Easiest)

### Step 1: Create Railway Account
1. Go to: https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (or email)

### Step 2: Deploy
1. Click "Deploy from GitHub repo"
2. Connect your GitHub account
3. Upload this folder to GitHub
4. Select the repository
5. Railway will auto-deploy!

### Step 3: Get Your URL
- Railway gives you: `https://yourapp.railway.app`
- Open on ANY device (phone, tablet, computer)
- Camera works! ✅

---

## Option 2: Render (Also Free)

### Step 1: Create Render Account
1. Go to: https://render.com
2. Sign up (free)

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect GitHub repo
3. Settings:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Environment: Node

### Step 3: Deploy
- Click "Create Web Service"
- Get URL: `https://yourapp.onrender.com`

---

## Option 3: Quick Deploy with Glitch (No GitHub needed)

### Step 1: Go to Glitch
1. Visit: https://glitch.com
2. Click "New Project" → "Import from GitHub"

### Step 2: Upload Files
- Or click "New Project" → "hello-express"
- Delete default files
- Upload your backend folder
- Upload Frontend folder

### Step 3: Access
- Your URL: `https://your-project.glitch.me`

---

## Which One Should You Use?

| Platform | Pros | Cons |
|----------|------|------|
| **Railway** ✅ | Auto HTTPS, Easy setup | 500 hours/month free |
| **Render** | Unlimited, Auto HTTPS | Slower cold starts |
| **Glitch** | No GitHub needed | Sleeps after inactivity |

---

## After Deployment:

1. **Share the URL** with your team
2. **Phone access**: Just open the URL
3. **Camera works**: HTTPS enabled automatically
4. **Real-time sync**: All devices connected

---

## Need Help?

Tell me which platform you want to use and I'll guide you step-by-step!
