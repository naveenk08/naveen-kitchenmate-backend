const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_ID,
    pass: process.env.GMAIL_PASSKEY,
  },
});

async function sendEmail(subject, html) {
  await transporter.sendMail({
    from: `"Kitchenmate Reports" <${process.env.GMAIL_ID}>`,
    to: process.env.REPORT_EMAIL || process.env.GMAIL_ID,
    subject,
    html,
  });
}

module.exports = {
  sendEmail,
};