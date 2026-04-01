// backend/src/config/email.js
import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // For Gmail
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail
      pass: process.env.EMAIL_PASSWORD // App Password (not regular password)
    }
  });

  // OR for other email services:
  // return nodemailer.createTransporter({
  //   host: process.env.EMAIL_HOST,
  //   port: process.env.EMAIL_PORT,
  //   secure: true,
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASSWORD
  //   }
  // });
};

export default createTransporter;