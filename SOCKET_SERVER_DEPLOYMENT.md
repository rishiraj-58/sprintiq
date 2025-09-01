# Socket Server Deployment to Render

This guide will help you deploy the SprintIQ socket server to Render for real-time notifications.

## 🚀 Quick Deployment Steps

### 1. Create Render Web Service

1. **Sign up/Login** to [Render](https://render.com)
2. Click **"New +" → "Web Service"**
3. **Connect GitHub**: Select your `sprintiq` repository
4. **Configure Service**:
   - **Name**: `sprintiq-socket-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:socket`
5. Click **"Create Web Service"**

### 2. Get Your Socket Server URL

After deployment, Render will give you a URL like:
```
https://sprintiq-socket-server.onrender.com
```

### 3. Update Vercel Environment Variable

1. Go to your Vercel dashboard → SprintIQ project → Settings
2. Go to **Environment Variables**
3. Find `NEXT_PUBLIC_SOCKET_URL`
4. **Update the value** to your Render URL:
   ```
   https://sprintiq-socket-server.onrender.com
   ```
5. **Redeploy** your Vercel app to apply changes

## ✅ What's Been Configured

- ✅ **Port Configuration**: Uses `process.env.PORT` (Render provides this)
- ✅ **CORS Origins**: Configured for localhost + your Vercel URLs
- ✅ **Start Script**: `npm run start:socket` ready for Render
- ✅ **ESM Support**: Uses Node.js ES modules

## 🔧 Manual Testing

Test your socket server locally first:
```bash
npm run start:socket
```

Should show: `🔔 Socket.IO server listening on port 4001`

## 📝 Update CORS URLs

Before deploying, update the CORS origins in `src/lib/socket-server.mjs` with your actual Vercel URLs:

```javascript
origin: [
  "http://localhost:3000", // Development
  "https://your-actual-vercel-url.vercel.app", // ← Update this
  "https://sprintiq.vercel.app" // ← Update this
],
```

## 🎯 Expected Result

- ✅ Socket server runs on Render 24/7
- ✅ Next.js app on Vercel connects to socket server
- ✅ Real-time notifications work across your app
- ✅ No deployment conflicts between serverless and long-running services

## 🆘 Troubleshooting

**Socket server not connecting?**
- Check CORS origins match your Vercel URL exactly
- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly in Vercel
- Check Render logs for any startup errors

**Port issues?**
- Render automatically provides `process.env.PORT`
- Local development still uses port 4001 as fallback
