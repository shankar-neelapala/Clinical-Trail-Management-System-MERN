const express = require('express');
const router  = express.Router();
const Study   = require('../models/Study');
const auth    = require('../middleware/auth');

const paginate = async (Model, query, req) => {
  const { page = 1, limit = 5 } = req.query;
  const total = await Model.countDocuments(query);
  const docs  = await Model.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit));
  return { docs, total, pages: Math.ceil(total/limit), currentPage: Number(page) };
};

router.get('/', auth, async (req, res) => {
  try {
    const { search = '' } = req.query;
    const q = search ? { $or:[{studyId:new RegExp(search,'i')},{studyName:new RegExp(search,'i')}] } : {};
    const { docs, total, pages, currentPage } = await paginate(Study, q, req);
    res.json({ studies: docs, total, pages, currentPage });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/all', auth, async (req, res) => {
  try { res.json(await Study.find({}, 'studyId studyName status phase').sort({ studyName:1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const s = await Study.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Study not found' });
    res.json(s);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await Study.create(req.body)); }
  catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Study ID already exists' });
    res.status(400).json({ message: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const s = await Study.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true });
    if (!s) return res.status(404).json({ message: 'Study not found' });
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const s = await Study.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ message: 'Study not found' });
    res.json({ message: 'Study deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
