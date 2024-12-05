const nodemailer = require('nodemailer');
const messages = require('./message'); // Import messages
require('dotenv').config();


// Configure transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or another email provider
    auth: {
        user: process.env.EMAIL_USER, // Secure via environment variables
        pass: process.env.EMAIL_PASS,
    },
});

// Function to send an email
const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html, // Pass the HTML content here
    };

    try {
        console.log('Generated HTML Content:', html); // Debug log
        const info = await transporter.sendMail(mailOptions);
        console.log(messages.EMAIL_SENT_SUCCESS); // Log centralized success message
        return { success: true, info };
    } catch (error) {
        console.error(`${messages.EMAIL_SEND_FAILED}: ${error.message}`);
        throw new Error(messages.EMAIL_SEND_FAILED);
    }
};






module.exports = { sendEmail };
