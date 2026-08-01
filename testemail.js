require("dotenv").config();
const nodemailer = require("nodemailer");
const { buildReport } = require("./services/reportTemplateService");

// ---------- Sample test data ----------
const testSummary = {
  totalRequests: 18432,
  totalEndpoints: 12,
  mostUsedEndpoint: {
    method: "GET",
    route: "/api/v1/recipes/search",
    requests: 5210,
  },
  endpoints: [
    { method: "GET", route: "/api/v1/recipes/search", requests: 5210 },
    { method: "POST", route: "/api/v1/orders", requests: 3894 },
    { method: "GET", route: "/api/v1/users/:id/profile", requests: 2765 },
    { method: "GET", route: "/api/v1/recipes/:id", requests: 2140 },
    { method: "PUT", route: "/api/v1/cart/update", requests: 1560 },
    { method: "DELETE", route: "/api/v1/cart/:itemId", requests: 980 },
    { method: "POST", route: "/api/v1/auth/login", requests: 870 },
    { method: "GET", route: "/api/v1/notifications", requests: 610 },
    { method: "POST", route: "/api/v1/feedback", requests: 240 },
    { method: "GET", route: "/api/v1/inventory/status", requests: 163 },
  ],
};

// ---------- Build HTML ----------
const html = buildReport(testSummary);

// ---------- Send via nodemailer using env creds ----------
async function sendTestEmail() {
 const transporter = nodemailer.createTransport({
   service: "gmail",
   auth: {
     user: process.env.GMAIL_ID,
     pass: process.env.GMAIL_PASSKEY,
   },
 });

  try {
    // Optional: verify connection/credentials before sending
    await transporter.verify();
    console.log("SMTP connection verified.");

    const info = await transporter.sendMail({
      from: 'abc@gmail.com',
      to: 'naveenkrishnab08@zohomail.in',
      subject: "Kitchenmate API Daily Report (Test)",
      html,
    });

    console.log("Test email sent successfully.");
    console.log("Message ID:", info.messageId);
  } catch (err) {
    console.error("Failed to send test email:", err);
    process.exit(1);
  }
}

sendTestEmail();