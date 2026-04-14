const express = require('express');
const router  = express.Router();
const Patient = require('../models/Patient');
const auth    = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { page=1, limit=5, search='', studyId='', status='' } = req.query;
    const q = {};
    if (search) {
      q.$or = [
        { patientId: new RegExp(search,'i') },
        { firstName: new RegExp(search,'i') },
        { lastName:  new RegExp(search,'i') },
        { email:     new RegExp(search,'i') }
      ];
    }
    if (studyId) q.study = studyId;
    if (status)  q.status = status;

    const total    = await Patient.countDocuments(q);
    const patients = await Patient.find(q)
      .populate('study', 'studyName studyId')
      .populate('site',  'siteName location')
      .sort({ createdAt: -1 })
      .skip((page-1)*limit)
      .limit(Number(limit));
    res.json({ patients, total, pages: Math.ceil(total/limit), currentPage: Number(page) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const [total, active, enrolled, completed, withdrawn, screening] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ status: 'Active' }),
      Patient.countDocuments({ status: 'Enrolled' }),
      Patient.countDocuments({ status: 'Completed' }),
      Patient.countDocuments({ status: 'Withdrawn' }),
      Patient.countDocuments({ status: 'Screening' }),
    ]);
    const bloodGroupDist = await Patient.aggregate([
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }
    ]);
    const genderDist = await Patient.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);
    res.json({ total, active, enrolled, completed, withdrawn, screening, bloodGroupDist, genderDist });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const p = await Patient.findById(req.params.id)
      .populate('study', 'studyName studyId phase')
      .populate('site',  'siteName location');
    if (!p) return res.status(404).json({ message: 'Patient not found' });
    res.json(p);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await Patient.create(req.body)); }
  catch (e) {
    if (e.code===11000) return res.status(400).json({ message: 'Patient ID already exists' });
    res.status(400).json({ message: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const p = await Patient.findByIdAndUpdate(req.params.id, req.body, {new:true,runValidators:true});
    if (!p) return res.status(404).json({ message: 'Patient not found' });
    res.json(p);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!await Patient.findByIdAndDelete(req.params.id)) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Patient deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
