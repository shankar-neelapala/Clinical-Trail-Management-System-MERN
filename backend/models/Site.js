const mongoose = require('mongoose');
const SiteSchema = new mongoose.Schema({
  siteName:               { type: String, required: true, trim: true },
  principalInvestigator:  { type: String, required: true, trim: true },
  location:               { type: String, required: true, trim: true },
  status:                 { type: String, enum: ['Active','Inactive','Pending'], default: 'Active' },
  contactEmail:           { type: String, trim: true },
  phone:                  { type: String },
  capacity:               { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Site', SiteSchema);
