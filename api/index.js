require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with caching for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const MONGO_URI = process.env.MONGO_URI;
  
  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  const connection = await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  cachedDb = connection;
  return connection;
}

// Import Models
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const CheckIn = require('../models/CheckIn');
const Queue = require('../models/Queue');

// Import Routes
const clinicRoutes = require('../routes/clinics');
const patientRoutes = require('../routes/patients');
const checkInRoutes = require('../routes/checkIns');
const queueRoutes = require('../routes/queues');
const analyticsRoutes = require('../routes/analytics');

// API Routes
app.use('/api/clinics', clinicRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ 
      status: 'healthy',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

// Serve static files (HTML pages)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/check-in', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'check-in.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.get('/patient-portal', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'patient-portal.html'));
});

app.get('/staff-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'staff-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'analytics.html'));
});

// Initialize DB connection on first request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel serverless
module.exports = app;
