const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  checkInId: {
    type: String,
    unique: true,
    required: true
  },
  clinicId: {
    type: String,
    required: true,
    ref: 'Clinic'
  },
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  queuePosition: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'in-service', 'completed', 'cancelled', 'no-show'],
    default: 'waiting'
  },
  visitReason: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'emergency'],
    default: 'normal'
  },
  appointmentTime: Date,
  hasAppointment: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  calledTime: Date,
  serviceStartTime: Date,
  serviceEndTime: Date,
  estimatedWaitTime: Number, // minutes
  actualWaitTime: Number, // minutes
  locationData: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date,
    verified: Boolean,
    distanceFromClinic: Number
  },
  deviceInfo: {
    ip: String,
    userAgent: String,
    browser: String,
    os: String,
    device: String
  },
  notificationsSent: [{
    type: { type: String }, // 'sms', 'email', 'push'
    sentAt: Date,
    status: String
  }],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

checkInSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate actual wait time when status changes to in-service
  if (this.status === 'in-service' && this.serviceStartTime && !this.actualWaitTime) {
    this.actualWaitTime = Math.round((this.serviceStartTime - this.checkInTime) / 60000);
  }
  
  next();
});

module.exports = mongoose.model('CheckIn', checkInSchema);
