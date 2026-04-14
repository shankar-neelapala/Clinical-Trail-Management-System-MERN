const express = require('express');
const router  = express.Router();
const Site    = require('../models/Site');
const auth    = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { page=1, limit=5, search='' } = req.query;
    const q = search ? { $or:[{siteName:new RegExp(search,'i')},{location:new RegExp(search,'i')}] } : {};
    const total = await Site.countDocuments(q);
    const sites = await Site.find(q).sort({createdAt:-1}).skip((page-1)*limit).limit(Number(limit));
    res.json({ sites, total, pages: Math.ceil(total/limit), currentPage: Number(page) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/all', auth, async (req, res) => {
  try { res.json(await Site.find({}, 'siteName location status').sort({ siteName:1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const s = await Site.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Site not found' });
    res.json(s);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await Site.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const s = await Site.findByIdAndUpdate(req.params.id, req.body, {new:true,runValidators:true});
    if (!s) return res.status(404).json({ message: 'Site not found' });
    res.json(s);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!await Site.findByIdAndDelete(req.params.id)) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Site deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
