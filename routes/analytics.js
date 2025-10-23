const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const Queue = require('../models/Queue');

// Get overall analytics
router.get('/overview', async (req, res) => {
  try {
    const totalClinics = await Clinic.countDocuments({ isActive: true });
    const totalPatients = await Patient.countDocuments({ isActive: true });
    const totalCheckIns = await CheckIn.countDocuments();
    
    const today = new Date().setHours(0, 0, 0, 0);
    const checkInsToday = await CheckIn.countDocuments({
      createdAt: { $gte: today }
    });
    
    const patientsServedToday = await CheckIn.countDocuments({
      createdAt: { $gte: today },
      status: 'completed'
    });
    
    // Average wait time today
    const completedToday = await CheckIn.find({
      createdAt: { $gte: today },
      status: 'completed',
      actualWaitTime: { $exists: true }
    });
    
    const avgWaitTime = completedToday.length > 0
      ? Math.round(completedToday.reduce((sum, c) => sum + c.actualWaitTime, 0) / completedToday.length)
      : 0;
    
    res.json({
      success: true,
      data: {
        totalClinics,
        totalPatients,
        totalCheckIns,
        checkInsToday,
        patientsServedToday,
        avgWaitTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get clinic-specific analytics
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const query = { clinicId };
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }
    
    // Total check-ins
    const totalCheckIns = await CheckIn.countDocuments(query);
    
    // Status breakdown
    const statusBreakdown = await CheckIn.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Priority breakdown
    const priorityBreakdown = await CheckIn.aggregate([
      { $match: query },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    // Average wait time
    const waitTimeStats = await CheckIn.aggregate([
      { $match: { ...query, actualWaitTime: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgWaitTime: { $avg: '$actualWaitTime' },
          minWaitTime: { $min: '$actualWaitTime' },
          maxWaitTime: { $max: '$actualWaitTime' }
        }
      }
    ]);
    
    // Hourly distribution
    const hourlyDistribution = await CheckIn.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $hour: '$checkInTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Daily check-ins for the last 7 days
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyCheckIns = await CheckIn.aggregate([
      {
        $match: {
          clinicId,
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        clinicId,
        totalCheckIns,
        statusBreakdown,
        priorityBreakdown,
        waitTimeStats: waitTimeStats[0] || { avgWaitTime: 0, minWaitTime: 0, maxWaitTime: 0 },
        hourlyDistribution,
        dailyCheckIns
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get patient visit history
router.get('/patient/:patientId/history', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const checkIns = await CheckIn.find({ patientId })
      .sort({ checkInTime: -1 })
      .limit(50);
    
    const enrichedHistory = await Promise.all(checkIns.map(async (checkIn) => {
      const clinic = await Clinic.findOne({ clinicId: checkIn.clinicId });
      return {
        checkInId: checkIn.checkInId,
        clinic: clinic ? clinic.name : 'Unknown',
        visitReason: checkIn.visitReason,
        status: checkIn.status,
        checkInTime: checkIn.checkInTime,
        waitTime: checkIn.actualWaitTime,
        priority: checkIn.priority
      };
    }));
    
    res.json({
      success: true,
      data: {
        patientId,
        totalVisits: checkIns.length,
        visits: enrichedHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get real-time statistics
router.get('/realtime/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const today = new Date().setHours(0, 0, 0, 0);
    
    const currentlyWaiting = await CheckIn.countDocuments({
      clinicId,
      status: 'waiting',
      createdAt: { $gte: today }
    });
    
    const currentlyInService = await CheckIn.countDocuments({
      clinicId,
      status: 'in-service',
      createdAt: { $gte: today }
    });
    
    const completedToday = await CheckIn.countDocuments({
      clinicId,
      status: 'completed',
      createdAt: { $gte: today }
    });
    
    const clinic = await Clinic.findOne({ clinicId });
    
    res.json({
      success: true,
      data: {
        clinicId,
        clinicName: clinic ? clinic.name : 'Unknown',
        currentlyWaiting,
        currentlyInService,
        completedToday,
        queueCapacity: clinic ? clinic.maxQueueSize : 0,
        avgWaitTime: clinic ? clinic.avgWaitTime : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
