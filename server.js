require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is not set');
  console.log('💡 Create a .env file with: MONGO_URI=your_mongodb_connection_string');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Import Models
const Clinic = require('./models/Clinic');
const Patient = require('./models/Patient');
const CheckIn = require('./models/CheckIn');
const Queue = require('./models/Queue');

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('join-clinic', (clinicId) => {
    socket.join(`clinic-${clinicId}`);
    console.log(`👤 Client joined clinic: ${clinicId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

// Import Routes
const clinicRoutes = require('./routes/clinics');
const patientRoutes = require('./routes/patients');
const checkInRoutes = require('./routes/checkIns');
const queueRoutes = require('./routes/queues');
const analyticsRoutes = require('./routes/analytics');

// Use Routes
app.use('/api/clinics', clinicRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (dbState === 1) {
      await mongoose.connection.db.admin().ping();
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        state: dbStates[dbState],
        connected: dbState === 1
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

// Serve Frontend Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/check-in', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'check-in.html'));
});

app.get('/patient-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'patient-portal.html'));
});

app.get('/staff-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🏥 MediQueue Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📈 Analytics: http://localhost:${PORT}/analytics`);
  console.log(`✅ Ready to accept patient check-ins`);
});

module.exports = { app, io };
