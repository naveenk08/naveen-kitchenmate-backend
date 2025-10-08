const nodemailer = require("nodemailer");
const generateInvoiceImage = require("../services/generatePDFBill");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_ID, // Replace with your Gmail
    pass: process.env.GMAIL_PASSKEY, // Replace with your App Password
  },
});

// Function to send OTP email
async function sendOTP(email, otp) {
  try {
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME}" <${process.env.GMAIL_ID}>`,
      to: email,
      subject: `${process.env.COMPANY_NAME} - Your OTP for Verification`,
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 400px; margin: auto; background-color: #f9f9f9;">
        <h2 style="text-align: center; color: #333;">OTP Verification</h2>
        <p style="text-align: center; font-size: 16px; color: #555;">
          Use the OTP below to complete your verification process. This OTP is valid for <strong>10 minutes</strong>.
        </p>
        <div style="text-align: center; font-size: 24px; font-weight: bold; color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 5px; display: inline-block; margin: 10px auto;">
          ${otp}
        </div>
        <p style="text-align: center; font-size: 14px; color: #777;">
          If you did not request this, please ignore this email or contact support.
        </p>
        <p style="text-align: center; font-size: 14px; color: #777;">
          Best Regards, <br>
          <strong>${process.env.COMPANY_NAME}</strong><br>
          This is an auto-generated email. Please don't reply.
        </p>
      </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: info.messageId };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Function to send Order Confirmation email
async function sendOrderConfirmation(email, orderDetails) {
  if (email) {
    try {
      const { orderId, kitchenName, kitchenAddr } = orderDetails;

      // Generate Order Items Table

      const mailOptions = {
        from: `"${process.env.COMPANY_NAME}" <${process.env.GMAIL_ID}>`,
        to: email,
        subject: `Order Confirmation - ${process.env.COMPANY_NAME}`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto; background-color: #f9f9f9;">
        <h2 style="text-align: center; color: #333;">Order Confirmation</h2>
        <p style="text-align: center; font-size: 16px; color: #555;">
          Thank you for your order! Your order is being prepared and will be ready soon.
        </p>

        <div style="background: #fff; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
          <h3 style="color: #333;">Order #${orderId}</h3>
          <p><strong>Kitchen:</strong> ${kitchenName}</p>
          <p><strong>Address:</strong> ${kitchenAddr}</p>
        </div>

        <p style="text-align: center; font-size: 14px; color: #777; margin-top: 20px;">
          We appreciate your business! If you have any questions, feel free to contact us.
        </p>

        <p style="text-align: center; font-size: 14px; color: #777;">
          Best Regards, <br>
          <strong>${process.env.COMPANY_NAME}</strong><br>
          This is an auto-generated email. Please don't reply.
        </p>
      </div>
      `,
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, message: info.messageId };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

async function sendOrderInvoice(order) {
  try {
    const pdfBuffer = await generateInvoiceImage.generateReceiptImage(order); // Generate PDF

    const pdfBase64 = pdfBuffer.toString("base64");

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME}" <${process.env.GMAIL_ID}>`,
      to: order.billEmail,
      subject: `🧾 Invoice for Order #${order.orderNum
        .toString()
        .padStart(4, "0")}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice - ${process.env.COMPANY_NAME}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f8f9fa;
              padding: 20px;
              color: #333;
            }
            .email-container {
              max-width: 600px;
              margin: auto;
              background: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
            }
            .logo-container {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo {
              max-width: 150px;
            }
            h2 {
              text-align: center;
              color: #333;
              margin-bottom: 10px;
            }
            p {
              font-size: 16px;
              line-height: 1.5;
              text-align: center;
            }
            .button-container {
              text-align: center;
              margin-top: 20px;
            }
            .download-button {
              background-color: #007bff;
              color: white;
              padding: 12px 20px;
              border-radius: 5px;
              text-decoration: none;
              font-size: 16px;
              font-weight: bold;
              display: inline-block;
            }
            .footer {
              text-align: center;
              font-size: 14px;
              color: #777;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- ✅ LOGO -->
            <div class="logo-container">
              <img src="${order.appLogo}" alt="${
        process.env.COMPANY_NAME
      }" class="logo">
            </div>
    
            <h2>Invoice for Your Order #${order.orderNum
              .toString()
              .padStart(4, "0")}</h2>
            <p>Hello <strong>${order.billName}</strong>,</p>
            <p>Thank you for using <strong>${
              process.env.COMPANY_NAME
            }</strong>!</p>
            <p>Click the below button to download your invoice</p>
    
            <!-- ✅ DOWNLOAD INVOICE BUTTON -->
            <div class="button-container">
              <a href="cid:invoice" class="download-button">📥 Download Invoice</a>
            </div>
    
            <p class="footer">If you have any questions, feel free to contact us.</p>
            <p class="footer">Best Regards, <br><strong>${
              process.env.COMPANY_NAME
            }</strong></p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `invoice_${order.orderId}.pdf`,
          content: pdfBase64,
          encoding: "base64",
          contentType: "application/pdf",
          cid: "invoice",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, message: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, message: error.message };
  }
}

module.exports = { sendOTP, sendOrderConfirmation, sendOrderInvoice };
