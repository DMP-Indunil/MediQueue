const express = require('express');
const router = express.Router();
const Clinic = require('../models/Clinic');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Get all clinics
router.get('/', async (req, res) => {
  try {
    const clinics = await Clinic.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: clinics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get clinic by ID
router.get('/:clinicId', async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ clinicId: req.params.clinicId });
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found' });
    }
    res.json({ success: true, data: clinic });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new clinic
router.post('/', async (req, res) => {
  try {
    const clinicId = uuidv4().split('-')[0];
    const checkInUrl = `${req.protocol}://${req.get('host')}/check-in?clinic=${clinicId}`;
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(checkInUrl);
    
    const clinic = new Clinic({
      clinicId,
      checkInUrl,
      qrCodeUrl,
      ...req.body
    });
    
    await clinic.save();
    res.status(201).json({ success: true, data: clinic });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update clinic
router.put('/:clinicId', async (req, res) => {
  try {
    const clinic = await Clinic.findOneAndUpdate(
      { clinicId: req.params.clinicId },
      { $set: req.body },
      { new: true }
    );
    
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found' });
    }
    
    res.json({ success: true, data: clinic });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete clinic (soft delete)
router.delete('/:clinicId', async (req, res) => {
  try {
    const clinic = await Clinic.findOneAndUpdate(
      { clinicId: req.params.clinicId },
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found' });
    }
    
    res.json({ success: true, message: 'Clinic deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get clinic QR code
router.get('/:clinicId/qr-code', async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ clinicId: req.params.clinicId });
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found' });
    }
    
    if (!clinic.qrCodeUrl) {
      const checkInUrl = `${req.protocol}://${req.get('host')}/check-in?clinic=${clinic.clinicId}`;
      const qrCodeUrl = await QRCode.toDataURL(checkInUrl);
      clinic.qrCodeUrl = qrCodeUrl;
      await clinic.save();
    }
    
    res.json({ success: true, data: { qrCodeUrl: clinic.qrCodeUrl } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
