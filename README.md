# PC Build Configuration Website

A full-stack MERN application for building custom PC configurations with compatibility validation, connecting users, PC assemblers, and suppliers.

## Project Overview

This application allows users to:
- Browse PC components (CPU, GPU, RAM, Storage, PSU, Motherboard, Case)
- Create custom PC builds with automatic compatibility checking
- Request assembly services
- Track build status through the assembly process

The system includes role-based access for:
- **Users (Customers)**: Browse components, create builds, track assembly status
- **Admins**: Manage components, users, and monitor system activity
- **Assemblers**: View assigned builds, update assembly status
- **Suppliers**: Manage component inventory, update prices and stock

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management

## Project Structure

```
pc_build_web/
├── server/              # Backend server
│   ├── config/         # Database configuration
│   ├── middleware/     # Auth middleware
│   ├── models/         # MongoDB models (User, Component, Build)
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions (compatibility checker)
│   ├── server.js       # Express server setup
│   └── package.json
├── client/              # Frontend React app
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── context/    # React Context (Auth)
│   │   ├── pages/      # Page components
│   │   ├── utils/      # API utilities
│   │   ├── App.jsx     # Main app component
│   │   └── main.jsx    # Entry point
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `env.template`):
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/pc_build_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

4. Update `MONGO_URI` with your MongoDB connection string

5. Start the server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to localhost:5000):
```bash
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173` (default Vite port)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Components
- `GET /api/components` - Get all components (with optional filters)
- `GET /api/components/:id` - Get single component
- `POST /api/components` - Create component (Admin/Supplier)
- `PUT /api/components/:id` - Update component (Admin/Supplier)
- `DELETE /api/components/:id` - Delete component (Admin only)

### Builds
- `GET /api/builds` - Get builds (role-based filtering)
- `GET /api/builds/:id` - Get single build
- `POST /api/builds` - Create PC build (User only)
- `PUT /api/builds/:id/status` - Update assembly status (Assembler/Admin)
- `PUT /api/builds/:id/assign` - Assign build to assembler (Admin only)
- `DELETE /api/builds/:id` - Delete build (User/Admin)

### Users
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

## Features

### Compatibility Checking
The system automatically checks:
- CPU and Motherboard socket compatibility
- Power supply wattage requirements
- Component availability

### Role-Based Access Control
- **Users**: Can create and manage their own builds
- **Admins**: Full system access and management
- **Assemblers**: Can view and update assigned builds
- **Suppliers**: Can manage their own component inventory

## Demo Testing

### Creating Test Accounts

1. **Register a User**: 
   - Visit `/register`
   - Select role from dropdown (for demo purposes)
   - Create accounts for different roles: user, admin, assembler, supplier

2. **Admin Account**:
   - Create components in the Admin Dashboard
   - Manage users and their roles
   - View all builds in the system

3. **Supplier Account**:
   - Add components (auto-assigned to supplier)
   - Update prices and stock status
   - View inventory statistics

4. **User Account**:
   - Browse components
   - Create PC builds
   - View saved builds and compatibility checks

5. **Assembler Account**:
   - View assigned builds
   - Update assembly status (Pending → Assembling → Completed)

### Demo Workflow

1. **Admin creates components** via Admin Dashboard
2. **Supplier updates inventory** (prices, stock status)
3. **User creates a build** by selecting components
4. **Admin assigns build to assembler** (or assembler auto-assigns when starting)
5. **Assembler updates status** through assembly process
6. **User tracks progress** in their dashboard

## Database Schema

### User
- name, email, password (hashed), role, timestamps

### Component
- name, category, price, specifications, compatibility, stockStatus, supplierID, timestamps

### Build
- userID, components[], totalPrice, assemblyStatus, assemblerID, compatibilityCheck, isCompatible, timestamps

## Development Notes

- Authentication uses JWT tokens stored in localStorage
- Password hashing uses bcryptjs (10 salt rounds)
- CORS enabled for frontend-backend communication
- Error handling middleware included
- Role-based route protection on both frontend and backend

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGO_URI in `.env` file
- For MongoDB Atlas, use connection string with credentials

### CORS Errors
- Backend CORS is configured for all origins (dev only)
- Ensure backend is running on correct port

### Authentication Issues
- Check JWT_SECRET in `.env` file
- Ensure token is stored in localStorage
- Verify API URL in frontend `.env`

## Production Considerations

This is a demo/final year project. For production:
- Use stronger JWT_SECRET
- Implement refresh tokens
- Add rate limiting
- Use HTTPS
- Implement proper error logging
- Add input validation and sanitization
- Use environment-specific configurations
- Add database indexing for performance

## License

This project is for educational/demonstration purposes.

## Author

Final Year Project - PC Build Configuration System
