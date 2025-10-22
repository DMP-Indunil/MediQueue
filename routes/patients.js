const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { v4: uuidv4 } = require('uuid');

// Get all patients
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const patients = await Patient.find({ isActive: true })
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Patient.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: patients,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get patient by ID
router.get('/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search patients
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const patients = await Patient.find({
      isActive: true,
      $or: [
        { firstName: new RegExp(query, 'i') },
        { lastName: new RegExp(query, 'i') },
        { 'contactInfo.phone': new RegExp(query, 'i') },
        { 'contactInfo.email': new RegExp(query, 'i') }
      ]
    }).limit(20);
    
    res.json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const patientId = uuidv4().split('-')[0];
    
    const patient = new Patient({
      patientId,
      ...req.body
    });
    
    await patient.save();
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update patient
router.put('/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { patientId: req.params.patientId },
      { $set: req.body },
      { new: true }
    );
    
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete patient (soft delete)
router.delete('/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { patientId: req.params.patientId },
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    
    res.json({ success: true, message: 'Patient deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
