import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const orderConfirmation = async (
  patientId,
  purchaseDate,
  productName,
  quantity,
  totalPrice,
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "2023bcs035@sggs.ac.in", // TODO: replace with dynamic recipient
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
