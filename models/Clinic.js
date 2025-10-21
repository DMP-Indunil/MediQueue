const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  clinicId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  operatingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  specialties: [String],
  avgWaitTime: {
    type: Number,
    default: 15 // minutes
  },
  currentQueueSize: {
    type: Number,
    default: 0
  },
  maxQueueSize: {
    type: Number,
    default: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  qrCodeUrl: String,
  checkInUrl: String,
  settings: {
    enableGPSVerification: { type: Boolean, default: false },
    maxDistanceMeters: { type: Number, default: 500 },
    enableSMSNotifications: { type: Boolean, default: false },
    notifyMinutesBefore: { type: Number, default: 10 },
    requireAppointment: { type: Boolean, default: false }
  },
  statistics: {
    totalCheckIns: { type: Number, default: 0 },
    totalPatientsServed: { type: Number, default: 0 },
    avgServiceTime: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

clinicSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Clinic', clinicSchema);
