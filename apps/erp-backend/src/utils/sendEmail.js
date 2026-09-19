import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  console.log(`[sendEmail] Attempting to notify: ${options.email}`);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Vektra HR" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendEmail] Success! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[sendEmail] CRITICAL ERROR: ${error.message}`);
    throw error;
  }
};

export default sendEmail;
