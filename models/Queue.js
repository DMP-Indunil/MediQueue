const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  clinicId: {
    type: String,
    required: true,
    ref: 'Clinic'
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0)
  },
  currentQueue: [{
    checkInId: String,
    patientId: String,
    patientName: String,
    position: Number,
    status: String,
    priority: String,
    checkInTime: Date,
    estimatedWaitTime: Number
  }],
  servedToday: {
    type: Number,
    default: 0
  },
  averageWaitTime: {
    type: Number,
    default: 0
  },
  averageServiceTime: {
    type: Number,
    default: 0
  },
  peakHours: [{
    hour: Number,
    count: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

queueSchema.index({ clinicId: 1, date: 1 });

queueSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Queue', queueSchema);
