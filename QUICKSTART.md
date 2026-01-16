# Quick Start Guide

Get your PC Build Configuration Website up and running in minutes!

## Prerequisites Check

- [ ] Node.js installed (v14+)
- [ ] MongoDB installed and running (or MongoDB Atlas account)
- [ ] npm or yarn installed

## Step 1: Backend Setup

```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Create .env file (copy from env.template)
# Windows: copy env.template .env
# Mac/Linux: cp env.template .env

# Edit .env file:
# - Set PORT=5000 (default)
# - Set MONGO_URI (e.g., mongodb://localhost:27017/pc_build_db)
# - Set JWT_SECRET (any random string)
```

## Step 2: Seed Database (Optional but Recommended)

```bash
# Still in server folder
npm run seed

# This creates:
# - 4 test users (admin, user, assembler, supplier)
# - 24 sample components
# All passwords: password123
```

## Step 3: Start Backend Server

```bash
# In server folder
npm start

# Or for development (auto-reload):
npm run dev

# Should see: "Server running on port 5000"
# Should see: "MongoDB Connected: ..."
```

## Step 4: Frontend Setup

```bash
# Open new terminal, navigate to client folder
cd client

# Install dependencies
npm install

# Optional: Create .env file for custom API URL
# Default uses: http://localhost:5000/api

# Start development server
npm run dev

# Should open in browser at http://localhost:5173
```

## Step 5: Test the Application

### Login with Test Accounts:

1. **Admin Account**
   - Email: `admin@example.com`
   - Password: `password123`
   - Access: Full system management

2. **User Account**
   - Email: `user@example.com`
   - Password: `password123`
   - Access: Browse components, create builds

3. **Assembler Account**
   - Email: `assembler@example.com`
   - Password: `password123`
   - Access: View and manage assigned builds

4. **Supplier Account**
   - Email: `supplier@example.com`
   - Password: `password123`
   - Access: Manage component inventory

### Quick Demo Flow:

1. **Login as Admin** → View overview, add more components if needed
2. **Login as Supplier** → Update prices, stock status
3. **Login as User** → Browse components, create a PC build
4. **Login as Admin** → Assign build to assembler
5. **Login as Assembler** → Update assembly status to "Assembling" → "Completed"
6. **Login as User** → Check build status

## Troubleshooting

### MongoDB Connection Error
```
Error: MongoDB connection error: ...
```
**Solution:**
- Ensure MongoDB is running (`mongod` or check Windows Services)
- Verify MONGO_URI in `.env` file
- For MongoDB Atlas: Use full connection string with credentials

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
- Change PORT in `.env` file
- Or stop other processes using port 5000

### CORS Errors in Browser
**Solution:**
- Ensure backend is running
- Check API URL in frontend `.env` (should be `http://localhost:5000/api`)
- Clear browser cache

### Component Not Found / Build Errors
**Solution:**
- Run seed script: `npm run seed` (in server folder)
- Ensure components exist in database

## File Structure Check

```
pc_build_web/
├── server/
│   ├── .env                    # ← Create this!
│   ├── seed.js                 # Seed script
│   ├── server.js               # Main server file
│   └── ...
├── client/
│   ├── .env                    # Optional
│   └── ...
└── README.md                   # Full documentation
```

## Default Ports

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173 (Vite default)

## Next Steps

1. ✅ Backend running on port 5000
2. ✅ Frontend running on port 5173
3. ✅ Database seeded with test data
4. ✅ All 4 test accounts available
5. 🎉 Ready to demo!

For full documentation, see [README.md](./README.md)
