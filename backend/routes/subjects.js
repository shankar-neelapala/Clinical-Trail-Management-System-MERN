const express = require('express');
const router  = express.Router();
const Subject = require('../models/Subject');
const auth    = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { page=1, limit=5, search='' } = req.query;
    const q = search ? { subjectId: new RegExp(search,'i') } : {};
    const total = await Subject.countDocuments(q);
    const subjects = await Subject.find(q).populate('study','studyName studyId').sort({createdAt:-1}).skip((page-1)*limit).limit(Number(limit));
    res.json({ subjects, total, pages: Math.ceil(total/limit), currentPage: Number(page) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const s = await Subject.findById(req.params.id).populate('study','studyName studyId');
    if (!s) return res.status(404).json({ message: 'Subject not found' });
    res.json(s);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await Subject.create(req.body)); }
  catch (e) {
    if (e.code===11000) return res.status(400).json({ message: 'Subject ID already exists' });
    res.status(400).json({ message: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const s = await Subject.findByIdAndUpdate(req.params.id, req.body, {new:true,runValidators:true});
    if (!s) return res.status(404).json({ message: 'Subject not found' });
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!await Subject.findByIdAndDelete(req.params.id)) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Subject deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
