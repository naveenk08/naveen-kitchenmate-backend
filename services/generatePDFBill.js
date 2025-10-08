const fs = require("fs");
const path = require("path");

const puppeteer = require("puppeteer");

exports.generateReceiptImage = async (order) => {
  return new Promise(async (resolve, reject) => {
    const tempDir =
      process.platform === "win32" ? path.join(__dirname, "tmp") : "/tmp";
    if (process.platform === "win32" && !fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const fileName = `invoice_${order.orderId}.pdf`;
    const filePath = path.join(tempDir, fileName);

    // Ensure the directory exists
    // if (!fs.existsSync("./invoices")) {
    //   fs.mkdirSync("./invoices");
    // }

    

    const logoUrl = order.appLogo; // ✅ Update with actual logo path

    // Create receipt HTML with margins and spacing
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: 283px; /* ~10cm width */
            margin: 10px; /* Add margin around content */
            padding: 10px; /* Add padding inside content */
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 3px;
          }
          .subheader {
            text-align: center;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .separator {
            text-align: center;
            margin: 3px 0;
          }
          .details {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin: 5px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            width: 100%;
          }
          .detail-item {
            font-size: 11px;
          }
          .table-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 11px;
            margin-top: 5px;
            border-bottom: 1px dashed #000;
            padding-bottom: 2px;
          }
          .table-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin: 4px 0;
          }
          .item-name {
            width: 40%;
            text-align: left;
          }
          .item-qty {
            width: 10%;
            text-align: center;
          }
          .item-rate {
            width: 23%;
            text-align: center;
          }
          .item-total {
            width: 27%;
            text-align: right;
          }
          .summary {
            margin-top: 5px;
            border-top: 1px dashed #000;
            padding-top: 3px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            font-size: 11px;
          }
          .summary-label {
            text-align: right;
          }
          .summary-value {
            text-align: right;
            width: 27%;
          }
          .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 11px;
            padding-bottom: 5px;
          }
          .boldCenter {
            text-align: center;
            font-size: 11px;
            padding-bottom: 2px;
          }
             .logo-container {
            text-align: center;
            margin-top: 5px;
          }
          .logo {
            max-width: 150px; /* Ensure logo fits within the receipt */
            height: 50;
          }
          .bold {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">${order.kitchenName}</div>
        <div class="subheader">${order.kitchenAddr}</div>
        <div class="separator">==============================</div>
        
        <div class="details">
        <div class="detail-row">
        <div class="boldCenter">Bill #${order.orderNum
          .toString()
          .padStart(4, "0")}</div>
        </div>
          <div class="detail-row">
            <div class="detail-item">Name: ${order.billName}</div>
            <div class="detail-item">Date: ${order.date}</div>
          </div>
          <div class="detail-row">
            <div class="detail-item">Payment Mode: ${order.paymentType}</div>
            <div class="detail-item">Time: ${order.time}</div>

          </div>
        </div>
        
        <div class="separator">==============================</div>
        
        <div class="table-header">
          <div class="item-name">Item</div>
          <div class="item-qty">Qty</div>
          <div class="item-rate">Rate</div>
          <div class="item-total">Total</div>
        </div>
        
        ${order.items
          .map(
            (item) => `
          <div class="table-row">
            <div class="item-name">${item.itemName}</div>
            <div class="item-qty">${item.quantity}</div>
            <div class="item-rate">₹${item.price.toFixed(2)}</div>
            <div class="item-total">₹${item.totalAmount.toFixed(2)}</div>
          </div>
        `
          )
          .join("")}
        
        <div class="separator">==============================</div>
        
        <div class="summary">
          <div class="summary-row">
            <div class="summary-label">Subtotal:</div>
            <div class="summary-value">₹${order.subTotal.toFixed(2)}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">Discount:</div>
            <div class="summary-value">₹${(order.discount
              ? parseFloat(order.discount)
              : 0
            ).toFixed(2)}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label bold">Total:</div>
            <div class="summary-value bold">₹${order.total.toFixed(2)}</div>
          </div>
        </div>
        
        <div class="separator">==============================</div>
        
        <div class="footer">Thank you for ordering!</div>
        <div class="boldCenter">Powered By</div>
        <div class="logo-container">
          <img src="${logoUrl}" class="logo" alt="Logo">
        </div>
      </body>
      </html>
    `;

    try {
      // Launch browser
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      // Set content and wait for it to load
      await page.setContent(receiptHTML);
      await page.waitForSelector("body");

      // First, get the content height
      const bodyHeight = await page.evaluate(() => {
        return document.body.scrollHeight;
      });

      // Generate PDF with **proper margins**
      await page.pdf({
        path: filePath,
        width: "285px",
        height: `${Math.max(300, bodyHeight + 20)}px`,
        printBackground: true,
        margin: {
          top: "20px", // ✅ Top Margin
          right: "18px", // ✅ Right Margin
          bottom: "20px", // ✅ Bottom Margin
          left: "18px", // ✅ Left Margin
        },
      });

      await browser.close();
      const pdfBuffer = fs.readFileSync(filePath);

      if (process.platform === "win32") {
        fs.unlinkSync(filePath);
      }

      // Return the file path
      return resolve(pdfBuffer);
    } catch (error) {
      console.error("Error generating receipt:", error);
      return reject(error);
    }
  });
};
