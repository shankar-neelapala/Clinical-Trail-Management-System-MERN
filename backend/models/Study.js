const mongoose = require('mongoose');
const StudySchema = new mongoose.Schema({
  studyId:     { type: String, required: true, unique: true, trim: true },
  studyName:   { type: String, required: true, trim: true },
  phase:       { type: String, enum: ['Phase I','Phase II','Phase III','Phase IV'], required: true },
  status:      { type: String, enum: ['Active','Completed','On Hold'], default: 'Active' },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date },
  description: { type: String },
  sponsor:     { type: String },
  indication:  { type: String }
}, { timestamps: true });
module.exports = mongoose.model('Study', StudySchema);
