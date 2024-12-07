// app.js
const express = require('express');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();

// its a comment
// naother commit

const app = express();
app.use(express.json());

// User panel routes
// lets see
app.use('/api', userRoutes);
app.use('/api', notificationRoutes);



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
