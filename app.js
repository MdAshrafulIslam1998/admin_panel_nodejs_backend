// app.js
const express = require('express');
const dotenv = require('dotenv');
const userpanelRoutes = require('./routes/userpanelRoutes');
const coinpanelRoutes = require('./routes/coinpanelRoutes');
const documentRoutes = require('./routes/documentRoutes');
const staffpanelRoutes = require('./routes/staffspanelRoutes');
const authRoutes = require('./routes/authRoutes');


dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Register your routes

app.use('/api', userpanelRoutes);
app.use('/api', coinpanelRoutes);
app.use('/api', documentRoutes);
app.use('/api/staffpanel', staffpanelRoutes); // This registers all routes from userpanelRoutes.js under /api
app.use('/api', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
