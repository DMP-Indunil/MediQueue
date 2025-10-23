const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const Queue = require('../models/Queue');
const { v4: uuidv4 } = require('uuid');

// Parse user agent helper
function parseUserAgent(userAgent) {
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                 userAgent.includes('Firefox') ? 'Firefox' :
                 userAgent.includes('Safari') ? 'Safari' :
                 userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  const os = userAgent.includes('Windows') ? 'Windows' :
            userAgent.includes('Mac') ? 'macOS' :
            userAgent.includes('Linux') ? 'Linux' :
            userAgent.includes('Android') ? 'Android' :
            userAgent.includes('iOS') ? 'iOS' : 'Unknown';
  
  const device = userAgent.includes('Mobile') ? 'Mobile' :
                userAgent.includes('Tablet') ? 'Tablet' : 'Desktop';
  
  return { browser, os, device };
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Create new check-in
router.post('/', async (req, res) => {
  try {
    const { clinicId, patientInfo, visitReason, locationData, hasAppointment, appointmentTime, priority } = req.body;
    
    // Validate clinic
    const clinic = await Clinic.findOne({ clinicId, isActive: true });
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found or inactive' });
    }
    
    // Check queue capacity
    if (clinic.currentQueueSize >= clinic.maxQueueSize) {
      return res.status(400).json({ success: false, error: 'Queue is full. Please try again later.' });
    }
    
    // Create or find patient
    let patient;
    if (patientInfo.patientId) {
      patient = await Patient.findOne({ patientId: patientInfo.patientId });
    }
    
    if (!patient) {
      const patientId = uuidv4().split('-')[0];
      patient = new Patient({
        patientId,
        firstName: patientInfo.firstName,
        lastName: patientInfo.lastName,
        contactInfo: {
          phone: patientInfo.phone,
          email: patientInfo.email
        },
        dateOfBirth: patientInfo.dateOfBirth
      });
      await patient.save();
    }
    
    // Verify location if GPS verification is enabled
    let locationVerified = false;
    let distanceFromClinic = null;
    
    if (clinic.settings.enableGPSVerification && locationData) {
      if (clinic.address.latitude && clinic.address.longitude) {
        distanceFromClinic = calculateDistance(
          locationData.latitude,
          locationData.longitude,
          clinic.address.latitude,
          clinic.address.longitude
        );
        locationVerified = distanceFromClinic <= clinic.settings.maxDistanceMeters;
      }
    }
    
    // Get current queue position
    const currentQueue = await CheckIn.countDocuments({
      clinicId,
      status: { $in: ['waiting', 'called'] },
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    
    const queuePosition = currentQueue + 1;
    
    // Estimate wait time
    const estimatedWaitTime = queuePosition * clinic.avgWaitTime;
    
    // Get device info
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';
    const { browser, os, device } = parseUserAgent(userAgent);
    
    // Create check-in
    const checkInId = uuidv4().split('-')[0];
    const checkIn = new CheckIn({
      checkInId,
      clinicId,
      patientId: patient.patientId,
      queuePosition,
      visitReason,
      priority: priority || 'normal',
      hasAppointment: hasAppointment || false,
      appointmentTime,
      estimatedWaitTime,
      locationData: locationData ? {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: new Date(),
        verified: locationVerified,
        distanceFromClinic
      } : null,
      deviceInfo: {
        ip: ip.replace('::ffff:', ''),
        userAgent,
        browser,
        os,
        device
      }
    });
    
    await checkIn.save();
    
    // Update clinic queue size
    await Clinic.findOneAndUpdate(
      { clinicId },
      { $inc: { currentQueueSize: 1, 'statistics.totalCheckIns': 1 } }
    );
    
    // Update daily queue
    const today = new Date().setHours(0, 0, 0, 0);
    let queue = await Queue.findOne({ clinicId, date: today });
    
    if (!queue) {
      queue = new Queue({ clinicId, date: today });
    }
    
    queue.currentQueue.push({
      checkInId,
      patientId: patient.patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      position: queuePosition,
      status: 'waiting',
      priority: checkIn.priority,
      checkInTime: checkIn.checkInTime,
      estimatedWaitTime
    });
    
    await queue.save();
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    io.to(`clinic-${clinicId}`).emit('queue-update', {
      type: 'new-check-in',
      data: {
        checkInId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        position: queuePosition,
        estimatedWaitTime
      }
    });
    
    res.status(201).json({
      success: true,
      data: {
        checkInId,
        queuePosition,
        estimatedWaitTime,
        locationVerified,
        message: 'Check-in successful!'
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get check-in by ID
router.get('/:checkInId', async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({ checkInId: req.params.checkInId });
    if (!checkIn) {
      return res.status(404).json({ success: false, error: 'Check-in not found' });
    }
    
    const patient = await Patient.findOne({ patientId: checkIn.patientId });
    const clinic = await Clinic.findOne({ clinicId: checkIn.clinicId });
    
    res.json({
      success: true,
      data: {
        checkIn,
        patient: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        clinic: clinic ? clinic.name : 'Unknown'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update check-in status
router.put('/:checkInId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const checkIn = await CheckIn.findOne({ checkInId: req.params.checkInId });
    
    if (!checkIn) {
      return res.status(404).json({ success: false, error: 'Check-in not found' });
    }
    
    const oldStatus = checkIn.status;
    checkIn.status = status;
    
    // Set timestamps based on status
    if (status === 'called' && !checkIn.calledTime) {
      checkIn.calledTime = new Date();
    } else if (status === 'in-service' && !checkIn.serviceStartTime) {
      checkIn.serviceStartTime = new Date();
    } else if (status === 'completed' && !checkIn.serviceEndTime) {
      checkIn.serviceEndTime = new Date();
      
      // Update clinic queue size
      await Clinic.findOneAndUpdate(
        { clinicId: checkIn.clinicId },
        { 
          $inc: { currentQueueSize: -1, 'statistics.totalPatientsServed': 1 }
        }
      );
    }
    
    await checkIn.save();
    
    // Update queue
    const today = new Date().setHours(0, 0, 0, 0);
    await Queue.findOneAndUpdate(
      { clinicId: checkIn.clinicId, date: today, 'currentQueue.checkInId': checkIn.checkInId },
      { $set: { 'currentQueue.$.status': status } }
    );
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`clinic-${checkIn.clinicId}`).emit('queue-update', {
      type: 'status-change',
      data: {
        checkInId: checkIn.checkInId,
        oldStatus,
        newStatus: status
      }
    });
    
    res.json({ success: true, data: checkIn });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel check-in
router.delete('/:checkInId', async (req, res) => {
  try {
    const checkIn = await CheckIn.findOneAndUpdate(
      { checkInId: req.params.checkInId },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    
    if (!checkIn) {
      return res.status(404).json({ success: false, error: 'Check-in not found' });
    }
    
    // Update clinic queue size
    if (checkIn.status === 'waiting' || checkIn.status === 'called') {
      await Clinic.findOneAndUpdate(
        { clinicId: checkIn.clinicId },
        { $inc: { currentQueueSize: -1 } }
      );
    }
    
    // Update queue
    const today = new Date().setHours(0, 0, 0, 0);
    await Queue.findOneAndUpdate(
      { clinicId: checkIn.clinicId, date: today },
      { $pull: { currentQueue: { checkInId: checkIn.checkInId } } }
    );
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`clinic-${checkIn.clinicId}`).emit('queue-update', {
      type: 'cancelled',
      data: { checkInId: checkIn.checkInId }
    });
    
    res.json({ success: true, message: 'Check-in cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
