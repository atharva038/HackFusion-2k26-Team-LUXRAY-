import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const orderConfirmation = async (
  patientEmail,
  patientId,
  purchaseDate,
  productName,
  quantity,
  totalPrice,
) => {
  if (!patientEmail) {
    console.error("orderConfirmation: patientEmail is required");
    return { success: false, error: "No recipient email provided" };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject: "Order Confirmation - Pharmacy",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2c7be5;">Order Confirmation</h2>
        
        <p>Dear Customer,</p>
        
        <p>Thank you for your purchase. Your order has been successfully placed. Below are your order details:</p>

        <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Patient ID</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${patientId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Purchase Date</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${purchaseDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Medicine</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Quantity</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Price</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">₹${totalPrice}</td>
          </tr>
        </table>

        <p style="margin-top: 20px;">
          Your order will be processed shortly. If you have any questions, please contact our support team.
        </p>

        <p>Thank you for choosing our pharmacy.</p>

        <p>
          Regards,<br/>
          <strong>Pharmacy Support Team</strong>
        </p>

        <hr style="margin-top: 20px;" />
        <small>This is an automated email. Please do not reply directly to this message.</small>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send a low-stock alert email to pharmacists/admins.
 * @param {string[]} recipientEmails - Array of email addresses to notify
 * @param {Array<{name:string, stock:number, lowStockThreshold:number, unitType:string}>} medicines
 * @returns {{ success: boolean, error?: string }}
 */
export const sendLowStockAlert = async (recipientEmails, medicines) => {
  if (!recipientEmails || recipientEmails.length === 0) {
    console.error("sendLowStockAlert: no recipient emails provided");
    return { success: false, error: "No recipient emails provided" };
  }
  if (!medicines || medicines.length === 0) {
    return { success: false, error: "No low-stock medicines provided" };
  }

  const rows = medicines
    .map(
      (m) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${m.name}</td>
        <td style="padding:8px;border:1px solid #ddd;color:#e53e3e;font-weight:bold;">${m.stock}</td>
        <td style="padding:8px;border:1px solid #ddd;">${m.lowStockThreshold}</td>
        <td style="padding:8px;border:1px solid #ddd;">${m.unitType}</td>
      </tr>`
    )
    .join("");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmails.join(", "),
    subject: `⚠️ Low Stock Alert — ${medicines.length} medicine(s) need restocking`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <h2 style="color:#e53e3e;">Low Stock Alert</h2>
        <p>The following medicine(s) have reached or dropped below their minimum stock threshold and require restocking:</p>

        <table style="border-collapse:collapse;width:100%;max-width:640px;">
          <thead>
            <tr style="background:#f7f7f7;">
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Medicine</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Current Stock</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Threshold</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Unit Type</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <p style="margin-top:20px;">Please restock these items as soon as possible to avoid service disruptions.</p>
        <p>Regards,<br/><strong>Pharmacy Inventory System</strong></p>
        <hr style="margin-top:20px;"/>
        <small>This is an automated alert. Do not reply to this email.</small>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Low stock alert email error:", error);
    return { success: false, error: error.message };
  }
};
