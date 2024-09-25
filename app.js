// app.js
const express = require('express');
const dotenv = require('dotenv');
const userpanelRoutes = require('./routes/userpanelRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Register your routes
app.use('/api', userpanelRoutes); // This registers all routes from userpanelRoutes.js under /api



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
