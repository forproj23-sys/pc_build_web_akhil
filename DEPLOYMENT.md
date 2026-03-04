# DEPLOYMENT GUIDE
## PC Building Website - MERN Stack Application

This guide will walk you through deploying your PC Building Website to:
- **MongoDB Atlas** - Cloud database
- **Render** - Backend hosting (Node.js/Express)
- **Vercel** - Frontend hosting (React/Vite)

---

## TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Step 1: MongoDB Atlas Setup](#step-1-mongodb-atlas-setup)
3. [Step 2: Deploy Backend to Render](#step-2-deploy-backend-to-render)
4. [Step 3: Deploy Frontend to Vercel](#step-3-deploy-frontend-to-vercel)
5. [Step 4: Update Environment Variables](#step-4-update-environment-variables)
6. [Step 5: Testing Your Deployment](#step-5-testing-your-deployment)
7. [Troubleshooting](#troubleshooting)

---

## PREREQUISITES

Before starting, ensure you have:
- ✅ A GitHub account
- ✅ Your code pushed to a GitHub repository
- ✅ A MongoDB Atlas account (free tier available)
- ✅ A Render account (free tier available)
- ✅ A Vercel account (free tier available)

---

## STEP 1: MONGODB ATLAS SETUP

### 1.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (or log in if you already have one)
3. Complete the registration process

### 1.2 Create a New Cluster

1. After logging in, click **"Build a Database"**
2. Select **"M0 FREE"** tier (Free forever)
3. Choose a cloud provider and region (closest to your users)
4. Click **"Create"** (cluster name is optional)
5. Wait 3-5 minutes for the cluster to be created

### 1.3 Configure Database Access

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Enter a username and generate a secure password
   - **IMPORTANT**: Save this password! You'll need it for the connection string
5. Set user privileges to **"Atlas admin"** (or "Read and write to any database")
6. Click **"Add User"**

### 1.4 Configure Network Access

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development/testing, click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to the whitelist
   - **Note**: For production, restrict to specific IPs (Render's IPs)
4. Click **"Confirm"**

### 1.5 Get Your Connection String

1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials
6. Add your database name at the end (before `?`):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pc_build_db?retryWrites=true&w=majority
   ```
7. **Save this connection string** - you'll need it for Render

---

## STEP 2: DEPLOY BACKEND TO RENDER

### 2.1 Prepare Your Backend for Deployment

1. Ensure your `server/package.json` has a `start` script:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

2. Verify your `server/server.js` uses `process.env.PORT`:
   ```javascript
   const PORT = process.env.PORT || 5000;
   ```

3. Make sure your code is pushed to GitHub

### 2.2 Create a Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository from the list
5. Configure the service:
   - **Name**: `pc-build-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server` (important!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** (or paid if you prefer)

6. Click **"Create Web Service"**

### 2.3 Set Environment Variables in Render

1. In your Render service dashboard, go to **"Environment"** tab
2. Add the following environment variables:

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `PORT` | `10000` | Render automatically sets this, but you can set it explicitly |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string from Step 1.5 |
   | `JWT_SECRET` | `your-super-secret-jwt-key` | Generate a strong random string (use a password generator) |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (update after Step 3) |

3. **Important Notes**:
   - For `FRONTEND_URL`, initially set it to `http://localhost:5173`
   - After deploying to Vercel (Step 3), come back and update it to your Vercel URL
   - Never commit `.env` files to GitHub - Render handles this securely

4. Click **"Save Changes"**

### 2.4 Deploy and Get Your Backend URL

1. Render will automatically start building and deploying
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll see a URL like: `https://pc-build-backend.onrender.com`
4. **Save this URL** - you'll need it for Vercel
5. Test the backend by visiting: `https://your-backend-url.onrender.com/`
   - You should see: `API is running`

### 2.5 Update FRONTEND_URL After Vercel Deployment

After completing Step 3 (Vercel deployment):
1. Go back to Render → Your Service → Environment
2. Update `FRONTEND_URL` to your Vercel URL (e.g., `https://pc-build-app.vercel.app`)
3. Click **"Save Changes"**
4. Render will automatically redeploy with the new CORS settings

---

## STEP 3: DEPLOY FRONTEND TO VERCEL

### 3.1 Prepare Your Frontend for Deployment

1. Ensure your `client/src/utils/api.js` uses environment variables:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
   ```

2. Create a `vercel.json` file in your **project root** (not in client folder):
   ```json
   {
     "buildCommand": "cd client && npm install && npm run build",
     "outputDirectory": "client/dist",
     "devCommand": "cd client && npm run dev",
     "installCommand": "cd client && npm install",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

3. Make sure your code is pushed to GitHub

### 3.2 Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. **IMPORTANT**: Before configuring, click **"Edit"** next to **"Root Directory"**
   - Set Root Directory to: `client`
   - This tells Vercel to treat the `client` folder as the project root
5. Configure the project:
   - **Framework Preset**: Select **"Vite"** (or "Other")
   - **Root Directory**: Should now show `client` (from step 4)
   - **Build Command**: `npm run build` (Vercel will auto-detect this for Vite)
   - **Output Directory**: `dist` (Vercel will auto-detect this for Vite)
   - **Install Command**: `npm install` (default)

6. **Environment Variables** section - Add:
   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `VITE_API_URL` | `https://your-backend-url.onrender.com/api` | Your Render backend URL + `/api` |

7. Click **"Deploy"**

**Note**: If you've already created the project, you can update the Root Directory by going to:
- Project Settings → General → Root Directory → Set to `client` → Save

### 3.3 Get Your Frontend URL

1. Wait for deployment to complete (usually 1-3 minutes)
2. Once deployed, Vercel will provide a URL like: `https://pc-build-app.vercel.app`
3. **Save this URL** - you'll need it to update Render's `FRONTEND_URL`

### 3.4 Update Render's FRONTEND_URL

1. Go back to Render dashboard → Your backend service → Environment
2. Update `FRONTEND_URL` to your Vercel URL
3. Save changes (this triggers a redeploy with correct CORS settings)

---

## STEP 4: UPDATE ENVIRONMENT VARIABLES

### 4.1 Backend (Render) - Final Environment Variables

Ensure these are set in Render:

```
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pc_build_db?retryWrites=true&w=majority
JWT_SECRET=your-strong-random-secret-key-here
FRONTEND_URL=https://your-app.vercel.app
```

### 4.2 Frontend (Vercel) - Final Environment Variables

Ensure this is set in Vercel:

```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## STEP 5: TESTING YOUR DEPLOYMENT

### 5.1 Test Backend

1. Visit: `https://your-backend.onrender.com/`
   - Should display: `API is running`

2. Test API endpoint:
   - Visit: `https://your-backend.onrender.com/api/components`
   - Should return JSON (may be empty array if no components)

### 5.2 Test Frontend

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try to:
   - Register a new user
   - Login
   - Browse components
   - Create a build

### 5.3 Test CORS

1. Open browser console (F12)
2. Try making API calls from your frontend
3. Check for CORS errors in the console
4. If you see CORS errors:
   - Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
   - Ensure no trailing slashes
   - Wait for Render to redeploy after environment variable changes

---

## TROUBLESHOOTING

### Issue: CORS Errors in Browser Console

**Symptoms**: 
- `Access to XMLHttpRequest blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header`

**Solutions**:
1. Verify `FRONTEND_URL` in Render matches your Vercel URL exactly (including `https://`)
2. Check for trailing slashes - remove them
3. Wait 2-3 minutes after updating environment variables for redeploy
4. Clear browser cache and try again
5. Check Render logs for any errors

### Issue: Backend Not Starting

**Symptoms**: 
- Render shows "Build failed" or "Service unavailable"

**Solutions**:
1. Check Render logs: Service → Logs tab
2. Verify `MONGO_URI` is correct (check username/password)
3. Ensure MongoDB Atlas network access allows `0.0.0.0/0`
4. Verify `package.json` has correct `start` script
5. Check that `server.js` is in the `server` folder

### Issue: Frontend Can't Connect to Backend

**Symptoms**:
- Network errors in browser console
- "Failed to fetch" errors

**Solutions**:
1. Verify `VITE_API_URL` in Vercel is correct (include `/api` at the end)
2. Check that backend URL is accessible: `https://your-backend.onrender.com/`
3. Ensure backend is running (check Render dashboard)
4. Verify CORS is configured correctly

### Issue: MongoDB Connection Failed

**Symptoms**:
- Backend logs show "MongoServerError" or connection timeout

**Solutions**:
1. Verify `MONGO_URI` connection string is correct
2. Check MongoDB Atlas → Network Access (should allow `0.0.0.0/0` or Render IPs)
3. Verify database user credentials are correct
4. Check if database name in connection string matches your database

### Issue: Environment Variables Not Working

**Solutions**:
1. **Render**: Environment variables are case-sensitive
2. **Vercel**: Variables must start with `VITE_` to be accessible in frontend
3. After adding/updating variables, trigger a redeploy:
   - **Render**: Click "Manual Deploy" → "Deploy latest commit"
   - **Vercel**: Push a new commit or click "Redeploy"

### Issue: Build Fails on Vercel

**Solutions**:
1. Check Vercel build logs
2. Verify `vercel.json` is in project root (not in `client` folder)
3. Ensure `package.json` is in `client` folder
4. Check that all dependencies are in `package.json` (not just `package-lock.json`)

---

## ADDITIONAL NOTES

### Render Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds (cold start)
- Consider upgrading to paid tier for production use

### Vercel Free Tier

- Unlimited deployments
- Automatic HTTPS
- Global CDN
- Perfect for production use

### MongoDB Atlas Free Tier

- 512 MB storage
- Shared cluster
- Sufficient for development and small projects

### Security Best Practices

1. **Never commit** `.env` files to GitHub
2. Use strong, random `JWT_SECRET` (at least 32 characters)
3. For production, restrict MongoDB network access to Render IPs only
4. Regularly rotate secrets and passwords
5. Monitor Render and Vercel logs for suspicious activity

---

## QUICK REFERENCE

### Backend URL Format
```
https://your-service-name.onrender.com
```

### Frontend URL Format
```
https://your-app-name.vercel.app
```

### API Endpoint Format
```
https://your-backend.onrender.com/api/endpoint
```

### Environment Variables Checklist

**Render (Backend)**:
- ✅ `MONGO_URI`
- ✅ `JWT_SECRET`
- ✅ `FRONTEND_URL`
- ✅ `PORT` (optional, Render sets this automatically)

**Vercel (Frontend)**:
- ✅ `VITE_API_URL`

---

## SUPPORT

If you encounter issues not covered here:

1. Check Render logs: Service → Logs tab
2. Check Vercel build logs: Project → Deployments → Click deployment → View logs
3. Check MongoDB Atlas logs: Database → Logs
4. Review browser console for frontend errors
5. Verify all environment variables are set correctly

---

## DEPLOYMENT CHECKLIST

Before going live, ensure:

- [ ] MongoDB Atlas cluster is running
- [ ] Database user is created with correct permissions
- [ ] Network access is configured (allows Render IPs)
- [ ] Backend is deployed to Render and accessible
- [ ] Frontend is deployed to Vercel and accessible
- [ ] All environment variables are set correctly
- [ ] CORS is configured (FRONTEND_URL in Render)
- [ ] Test registration and login
- [ ] Test component browsing
- [ ] Test build creation
- [ ] No console errors in browser
- [ ] No CORS errors

---

**Congratulations! Your PC Building Website is now live! 🎉**

For updates, simply push to your GitHub repository:
- **Render** will automatically redeploy the backend
- **Vercel** will automatically redeploy the frontend
