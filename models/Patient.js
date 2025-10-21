const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  dateOfBirth: Date,
  contactInfo: {
    phone: String,
    email: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    currentMedications: [String],
    chronicConditions: [String]
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String
  },
  visitHistory: [{
    clinicId: String,
    visitDate: Date,
    reason: String,
    diagnosis: String
  }],
  preferences: {
    preferredLanguage: { type: String, default: 'en' },
    smsNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true }
  },
  isActive: {
    type: Boolean,
    default: true
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

patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
