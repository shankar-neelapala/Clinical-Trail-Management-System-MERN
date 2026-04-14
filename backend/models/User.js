const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  password:       { type: String, required: true },
  role:           { type: String, enum: ['admin', 'doctor', 'nurse', 'coordinator'], default: 'coordinator' },
  phone:          { type: String, trim: true },
  department:     { type: String, trim: true },
  specialization: { type: String, trim: true },
  licenseNumber:  { type: String, trim: true },
  isActive:       { type: Boolean, default: true },
  lastLogin:      { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
