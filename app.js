// app.js
const express = require('express');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();

const app = express();
app.use(express.json());

// User panel routes
app.use('/api', userRoutes);
app.use('/api', notificationRoutes);



const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
