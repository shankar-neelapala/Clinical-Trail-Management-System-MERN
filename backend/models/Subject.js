const mongoose = require('mongoose');
const SubjectSchema = new mongoose.Schema({
  subjectId:      { type: String, required: true, unique: true, trim: true },
  study:          { type: mongoose.Schema.Types.ObjectId, ref: 'Study', required: true },
  gender:         { type: String, enum: ['Male','Female','Other'], required: true },
  age:            { type: Number, required: true, min: 1, max: 120 },
  enrollmentDate: { type: Date, required: true },
  status:         { type: String, enum: ['Active','Completed','Withdrawn','Screening'], default: 'Screening' }
}, { timestamps: true });
module.exports = mongoose.model('Subject', SubjectSchema);
