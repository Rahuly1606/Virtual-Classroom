const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./auth/authRoutes');
const dotenv = require('dotenv');
const authMiddleware = require('./auth/authMiddleware');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Virtual Classroom</h1>');
});

app.use('/api/auth', authRoutes);
app.use('/api/auth/logout', authMiddleware);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});