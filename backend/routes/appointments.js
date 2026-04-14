const express = require('express');
const router  = express.Router();
const Appointment = require('../models/Appointment');
const auth    = require('../middleware/auth');

// ── List with filters + pagination ─────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 8, search = '', status = '', doctorId = '', date = '' } = req.query;
    const query = {};

    if (status)   query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (date)     {
      const d = new Date(date);
      query.appointmentDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    let base = Appointment.find(query)
      .populate('patient', 'firstName lastName patientId phone')
      .populate('doctor',  'name email role department specialization')
      .populate('study',   'studyName studyId')
      .populate('site',    'siteName location')
      .sort({ appointmentDate: 1, timeSlot: 1 });

    const total = await Appointment.countDocuments(query);
    const appointments = await base.skip((page - 1) * limit).limit(Number(limit));
    res.json({ appointments, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Today's appointments ────────────────────────────────
router.get('/today', auth, async (req, res) => {
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    const appointments = await Appointment.find({ appointmentDate: { $gte: start, $lte: end } })
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor',  'name department')
      .sort({ timeSlot: 1 });
    res.json(appointments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Stats for dashboard ─────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const [total, todayCount, scheduled, completed, cancelled] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ appointmentDate: { $gte: today, $lte: todayEnd } }),
      Appointment.countDocuments({ status: 'Scheduled' }),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'Cancelled' }),
    ]);
    res.json({ total, todayCount, scheduled, completed, cancelled });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Single ──────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId phone email dateOfBirth gender')
      .populate('doctor',  'name email role department specialization')
      .populate('study',   'studyName studyId phase')
      .populate('site',    'siteName location principalInvestigator')
      .populate('createdBy', 'name');
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appt);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Create ──────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const appt = new Appointment({ ...req.body, createdBy: req.user._id });
    await appt.save();
    const populated = await Appointment.findById(appt._id)
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor',  'name department');
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Appointment ID already exists' });
    res.status(400).json({ message: err.message });
  }
});

// ── Update ──────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor',  'name department');
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appt);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ── Delete ──────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndDelete(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
