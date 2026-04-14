const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  appointmentId:  { type: String, required: true, unique: true, trim: true },
  patient:        { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  study:          { type: mongoose.Schema.Types.ObjectId, ref: 'Study' },
  site:           { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },

  appointmentDate: { type: Date, required: true },
  timeSlot:        { type: String, required: true },   // e.g. "09:00 AM"
  duration:        { type: Number, default: 30 },      // minutes

  type: {
    type: String,
    enum: ['Screening', 'Consultation', 'Follow-Up', 'Lab Visit', 'Treatment', 'Discharge', 'Emergency'],
    default: 'Consultation'
  },

  status: {
    type: String,
    enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show', 'Rescheduled'],
    default: 'Scheduled'
  },

  priority:   { type: String, enum: ['Normal', 'Urgent', 'Critical'], default: 'Normal' },
  notes:      { type: String, trim: true },
  cancelReason: { type: String, trim: true },

  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
