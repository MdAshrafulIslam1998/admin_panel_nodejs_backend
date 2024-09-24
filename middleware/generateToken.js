const jwt = require('jsonwebtoken');

// User data to encode in the token
const user = { id: 'b7746c19-7a61-11ef-8211-80fa5b888c9a' }; // Use a valid user ID

// Secret key for signing the token
const secretKey = 'mukeyhere'; // Set your secret key

// Generate the token
const token = jwt.sign(user, secretKey, { expiresIn: '1h' });

console.log('Generated JWT Token:', token);
