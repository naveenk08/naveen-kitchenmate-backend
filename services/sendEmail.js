const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const sendEmail = async (email, otp) => {
  try {
    let client = SibApiV3Sdk.ApiClient.instance;
    let apiKey = client.authentications['api-key'];

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let sendSmtpEmail = {
      to: [{ email: email }],
      sender: { email: process.env.SENDER_EMAIL, name: "kitchenmate" },
      subject: "Your OTP Code",
      htmlContent: `<p>Your OTP code is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;
