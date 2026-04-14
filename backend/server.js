const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/studies',      require('./routes/studies'));
app.use('/api/subjects',     require('./routes/subjects'));
app.use('/api/sites',        require('./routes/sites'));
app.use('/api/patients',     require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/reports',      require('./routes/reports'));

app.get('/', (req, res) => res.json({ message: 'CTMS API v2 Running', status: 'ok' }));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    await seedUsers();
    app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

async function seedUsers() {
  const User   = require('./models/User');
  const bcrypt = require('bcryptjs');

  const seeds = [
    { name: 'System Admin',    email: 'admin@ctms.com',    password: 'Admin@123',   role: 'admin',       department: 'Administration',   specialization: 'System Administration' },
    { name: 'Dr. Sarah Carter',email: 'doctor@ctms.com',   password: 'Doctor@123',  role: 'doctor',      department: 'Oncology',          specialization: 'Clinical Oncology',   licenseNumber: 'MD-2024-001' },
    { name: 'Dr. James Wilson', email: 'doctor2@ctms.com', password: 'Doctor@123',  role: 'doctor',      department: 'Cardiology',        specialization: 'Interventional Cardiology', licenseNumber: 'MD-2024-002' },
    { name: 'Nurse Emily Ross', email: 'nurse@ctms.com',   password: 'Nurse@123',   role: 'nurse',       department: 'Clinical Research', specialization: 'Trial Coordination' },
    { name: 'John Coordinator', email: 'coord@ctms.com',   password: 'Coord@123',   role: 'coordinator', department: 'Clinical Ops',      specialization: 'Study Coordination' },
  ];

  for (const s of seeds) {
    if (!(await User.findOne({ email: s.email }))) {
      await User.create({ ...s, password: await bcrypt.hash(s.password, 10) });
      console.log(`✅ Seeded ${s.role}: ${s.email} / ${s.password}`);
    }
  }
}

module.exports = app;
