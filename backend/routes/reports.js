const express = require('express');
const router  = express.Router();
const Study   = require('../models/Study');
const Subject = require('../models/Subject');
const Site    = require('../models/Site');
const Patient = require('../models/Patient');
const auth    = require('../middleware/auth');

router.get('/summary', auth, async (req, res) => {
  try {
    const { studyId } = req.query;
    const sQ = studyId ? { _id: studyId } : {};
    const bQ = studyId ? { study: studyId } : {};

    const [
      totalStudies, activeStudies, completedStudies, onHoldStudies,
      totalSubjects, activeSubjects,
      totalSites, activeSites,
      totalPatients, activePatients
    ] = await Promise.all([
      Study.countDocuments(sQ),
      Study.countDocuments({ ...sQ, status:'Active' }),
      Study.countDocuments({ ...sQ, status:'Completed' }),
      Study.countDocuments({ ...sQ, status:'On Hold' }),
      Subject.countDocuments(bQ),
      Subject.countDocuments({ ...bQ, status:'Active' }),
      Site.countDocuments(),
      Site.countDocuments({ status:'Active' }),
      Patient.countDocuments(bQ),
      Patient.countDocuments({ ...bQ, status:'Active' })
    ]);

    const studyBreakdown = await Study.aggregate([
      ...(studyId ? [{ $match: { _id: require('mongoose').Types.ObjectId.createFromHexString(studyId) } }] : []),
      { $lookup: { from:'subjects', localField:'_id', foreignField:'study', as:'subjects' } },
      { $lookup: { from:'patients', localField:'_id', foreignField:'study', as:'patients' } },
      { $project: {
        studyId:1, studyName:1, phase:1, status:1,
        totalSubjects:{ $size:'$subjects' },
        activeSubjects:{ $size:{ $filter:{ input:'$subjects', as:'s', cond:{ $eq:['$$s.status','Active'] } } } },
        totalPatients:{ $size:'$patients' },
        activePatients:{ $size:{ $filter:{ input:'$patients', as:'p', cond:{ $eq:['$$p.status','Active'] } } } }
      }}
    ]);

    res.json({ totalStudies, activeStudies, completedStudies, onHoldStudies,
      totalSubjects, activeSubjects, totalSites, activeSites,
      totalPatients, activePatients, studyBreakdown });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
