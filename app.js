// app.js
const express = require('express');
const dotenv = require('dotenv');
const userpanelRoutes = require('./routes/userpanelRoutes');
const coinpanelRoutes = require('./routes/coinpanelRoutes');
const documentRoutes = require('./routes/documentRoutes');
const staffpanelRoutes = require('./routes/staffspanelRoutes');
const authRoutes = require('./routes/authRoutes');
const agoraRoutes = require('./routes/agoraRoutes');
const cors = require('cors'); // Import the CORS middleware

const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swaggerOptions'); // Import Swagger configuration
const notificationRoutes = require('./routes/notificationRoutes');
const path = require('path');
const staticFilesPath = path.join(__dirname, 'files_server');
const gmailAppPassRoutes = require('./routes/gmailAppPassRoutes'); // Import the new route

const staffAuthRoutes = require('./routes/staffAuthRoutes');


dotenv.config();

const app = express();
app.use(cors()); // Enable CORS for all origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));




// Register your routes

app.use('/api', userpanelRoutes);
app.use('/api', coinpanelRoutes);
app.use('/api', documentRoutes);
app.use('/api', staffAuthRoutes);
app.use(gmailAppPassRoutes); // Register the route
app.use('/files_server', express.static(path.join(__dirname, 'files_server')));
app.use('/api', agoraRoutes); // Agora Related Routes
app.use('/api/staffpanel', staffpanelRoutes); // This registers all routes from userpanelRoutes.js under /api
app.use('/api', authRoutes);
app.use('/api', notificationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
