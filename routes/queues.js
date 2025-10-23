const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const CheckIn = require('../models/CheckIn');
const Patient = require('../models/Patient');

// Get current queue for a clinic
router.get('/:clinicId/current', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const today = new Date().setHours(0, 0, 0, 0);
    
    let queue = await Queue.findOne({ clinicId, date: today });
    
    if (!queue) {
      queue = new Queue({ clinicId, date: today, currentQueue: [] });
      await queue.save();
    }
    
    // Get detailed check-ins
    const checkIns = await CheckIn.find({
      clinicId,
      status: { $in: ['waiting', 'called', 'in-service'] },
      createdAt: { $gte: today }
    }).sort({ queuePosition: 1 });
    
    const enrichedQueue = await Promise.all(checkIns.map(async (checkIn) => {
      const patient = await Patient.findOne({ patientId: checkIn.patientId });
      return {
        checkInId: checkIn.checkInId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        position: checkIn.queuePosition,
        status: checkIn.status,
        priority: checkIn.priority,
        checkInTime: checkIn.checkInTime,
        estimatedWaitTime: checkIn.estimatedWaitTime,
        visitReason: checkIn.visitReason
      };
    }));
    
    res.json({
      success: true,
      data: {
        clinicId,
        date: today,
        queueSize: enrichedQueue.length,
        currentQueue: enrichedQueue,
        servedToday: queue.servedToday,
        averageWaitTime: queue.averageWaitTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get queue position for a specific check-in
router.get('/position/:checkInId', async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({ checkInId: req.params.checkInId });
    
    if (!checkIn) {
      return res.status(404).json({ success: false, error: 'Check-in not found' });
    }
    
    // Count people ahead in queue
    const peopleAhead = await CheckIn.countDocuments({
      clinicId: checkIn.clinicId,
      status: { $in: ['waiting', 'called'] },
      queuePosition: { $lt: checkIn.queuePosition }
    });
    
    res.json({
      success: true,
      data: {
        checkInId: checkIn.checkInId,
        currentPosition: peopleAhead + 1,
        originalPosition: checkIn.queuePosition,
        status: checkIn.status,
        estimatedWaitTime: peopleAhead * 15 // Rough estimate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Call next patient
router.post('/:clinicId/call-next', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    // Find next waiting patient
    const nextCheckIn = await CheckIn.findOne({
      clinicId,
      status: 'waiting'
    }).sort({ priority: -1, queuePosition: 1 });
    
    if (!nextCheckIn) {
      return res.status(404).json({ success: false, error: 'No patients in queue' });
    }
    
    nextCheckIn.status = 'called';
    nextCheckIn.calledTime = new Date();
    await nextCheckIn.save();
    
    const patient = await Patient.findOne({ patientId: nextCheckIn.patientId });
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`clinic-${clinicId}`).emit('patient-called', {
      checkInId: nextCheckIn.checkInId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
      queuePosition: nextCheckIn.queuePosition
    });
    
    res.json({
      success: true,
      data: {
        checkInId: nextCheckIn.checkInId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        phone: patient ? patient.contactInfo.phone : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
