const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId:       { type: String, required: true, unique: true, trim: true },
  firstName:       { type: String, required: true, trim: true },
  lastName:        { type: String, required: true, trim: true },
  dateOfBirth:     { type: Date, required: true },
  gender:          { type: String, enum: ['Male','Female','Other'], required: true },
  email:           { type: String, trim: true, lowercase: true },
  phone:           { type: String, trim: true },
  address:         { type: String },
  bloodGroup:      { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'], default: 'Unknown' },
  study:           { type: mongoose.Schema.Types.ObjectId, ref: 'Study' },
  site:            { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  status:          { type: String, enum: ['Active','Inactive','Enrolled','Screening','Completed','Withdrawn'], default: 'Screening' },
  medicalHistory:  { type: String },
  allergies:       { type: String },
  consentSigned:   { type: Boolean, default: false },
  consentDate:     { type: Date },
  emergencyContact:{ type: String },
  emergencyPhone:  { type: String }
}, { timestamps: true });

// virtual: full name
PatientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Patient', PatientSchema);
