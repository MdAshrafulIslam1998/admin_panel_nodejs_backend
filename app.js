// app.js
const express = require('express');
const dotenv = require('dotenv');
const userpanelRoutes = require('./routes/userpanelRoutes');
const coinpanelRoutes = require('./routes/coinpanelRoutes');
const documentRoutes = require('./routes/documentRoutes');
const staffpanelRoutes = require('./routes/staffspanelRoutes');
const authRoutes = require('./routes/authRoutes');
const agoraRoutes = require('./routes/agoraRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swaggerOptions'); // Import Swagger configuration

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Register your routes
app.use('/api', userpanelRoutes);
app.use('/api', coinpanelRoutes);
app.use('/api', documentRoutes);
app.use('/api', agoraRoutes);
app.use('/api/staffpanel', staffpanelRoutes); 
app.use('/api', authRoutes);
app.use('/api', notificationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
