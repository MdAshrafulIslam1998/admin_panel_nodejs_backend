const nodemailer = require('nodemailer');
const messages = require('./message'); // Import messages
const db = require('../config/db.config'); // Database pool configuration

// Function to get email credentials from the database
const getEmailCredentials = async () => {
    try {
        const [rows] = await db.query('SELECT email_user, email_pass FROM gmail_app LIMIT 1');
        if (rows.length === 0) {
            throw new Error('No email credentials found in the database');
        }
        return rows[0];
    } catch (error) {
        console.error('Error fetching email credentials:', error.message);
        throw error; // Rethrow the error to be handled by the caller
    }
};

// Function to send an email
const sendEmail = async (to, subject, html) => {
    try {
        // Fetch credentials from the database
        const { email_user, email_pass } = await getEmailCredentials();

        // Configure transporter with fetched credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email_user,
                pass: email_pass,
            },
        });

        const mailOptions = {
            from: email_user, // Use fetched email_user as the sender
            to,
            subject,
            html, // Pass the HTML content here
        };

        
        const info = await transporter.sendMail(mailOptions);
        console.log(messages.MESSAGES.EMAIL_SENT_SUCCESS); // Log centralized success message
        return { success: true, info };
    } catch (error) {
        console.error(`${messages.MESSAGES.EMAIL_SEND_FAILED}: ${error.message}`);
        throw new Error(messages.MESSAGES.EMAIL_SEND_FAILED);
    }
};

module.exports = { sendEmail };
