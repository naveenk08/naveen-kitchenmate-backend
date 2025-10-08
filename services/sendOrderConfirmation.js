const SibApiV3Sdk = require("sib-api-v3-sdk");
require("dotenv").config();

const sendOrderConfirmation = async (email, orderDetails) => {
  try {
    let client = SibApiV3Sdk.ApiClient.instance;
    let apiKey = client.authentications["api-key"];

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const { orderId, kitchenName, kitchenAddr } = orderDetails;



    let sendSmtpEmail = {
      to: [{ email: email }],
      sender: { email: process.env.SENDER_EMAIL, name: "kitchenmate" },
      subject: "Order Confirmation - KitchenMate",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <div style="text-align: center; padding-bottom: 20px;">
            <img src="https://yourlogo.com/logo.png" alt="KitchenMate Logo" style="max-width: 150px;">
          </div>
          
          <h2 style="color: #333; text-align: center;">Order Confirmation @ ${kitchenName}, ${kitchenAddr}</h2>
          <h4 style="color: #333; text-align: center;">Order #${orderId}</h4>
          
          <p style="color: #666; text-align: center;">Thank you for your order! It will be delivered to you shortly!</p>
          <p style="color: #666; text-align: center;">Below are your order details:</p>

          <p style="color: #666; text-align: center; margin-top: 20px;">We appreciate your business! If you have any questions, feel free to contact us.</p>

          <!-- Optional: Add a website button -->
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://yourwebsite.com" style="background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Visit Our Website</a>
          </div>
          
          <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 20px;">KitchenMate &copy; ${new Date().getFullYear()} - All rights reserved.</p>
        </div>`,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
  }
};

module.exports = sendOrderConfirmation;
