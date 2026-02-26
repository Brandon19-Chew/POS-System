import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize Gmail transporter for sending emails
 */
function getTransporter() {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.error("[Email] Gmail credentials not configured");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  return transporter;
}

/**
 * Send admin verification code email
 */
export async function sendVerificationCodeEmail(
  recipientEmail: string,
  verificationCode: string,
  applicantName: string
): Promise<boolean> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.error("[Email] Transporter not initialized");
      return false;
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipientEmail,
      subject: "Admin Registration Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Admin Registration Request</h2>
          <p>Hello Admin,</p>
          <p><strong>${applicantName}</strong> has requested to create an admin account in the POS & Inventory Management System.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">Share this verification code with the applicant:</p>
            <p style="font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 2px; margin: 10px 0;">
              ${verificationCode}
            </p>
            <p style="margin: 0; color: #999; font-size: 12px;">This code will expire in 1 hour</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Important:</strong> Only share this code with the person you trust to become an admin.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated email from the POS & Inventory Management System. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[Email] Verification code sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send verification code:", error);
    return false;
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.error("[Email] Transporter not initialized");
      return false;
    }

    await transporter.verify();
    console.log("[Email] Configuration verified successfully");
    return true;
  } catch (error) {
    console.error("[Email] Configuration verification failed:", error);
    return false;
  }
}
