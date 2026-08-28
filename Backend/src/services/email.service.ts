// Email Service — Send OTP / Verification Codes via SMTP (universalapihub@gmail.com)
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || 'universalapihub@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '"Universal API" <universalapihub@gmail.com>';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
};

export const sendVerificationCodeEmail = async (
  toEmail: string,
  code: string,
  userName?: string
): Promise<boolean> => {
  const nameLabel = userName && userName.trim() ? userName.trim() : 'Customer';
  const subject = "Here's Your Universal API Verification Code";

  const textBody = `Hi ${nameLabel},\n\nHere's your OTP to verify your account: ${code}\n\nEnter it to continue your journey with us.\n\nCheering you on,\nTeam Universal API`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; background-color: #f9fafb; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 20px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px;">Universal API</span>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin-top: 0; margin-bottom: 20px;">
      Hi ${nameLabel},
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin-bottom: 24px;">
      Here's your OTP to verify your account: <strong style="font-size: 20px; color: #111827; background-color: #f3f4f6; padding: 4px 10px; border-radius: 6px; letter-spacing: 2px;">${code}</strong>
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin-bottom: 32px;">
      Enter it to continue your journey with us.
    </p>
    
    <div style="border-top: 1px solid #f3f4f6; pt: 20px; margin-top: 24px;">
      <p style="font-size: 15px; line-height: 1.5; color: #4b5563; margin: 0;">
        Cheering you on,<br>
        <strong style="color: #111827;">Team Universal API</strong>
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    if (!SMTP_PASS) {
      logger.warn(`[EMAIL SERVICE] SMTP_PASS not configured. Verification email code for ${toEmail}: ${code}`);
      return false;
    }

    const mailOptions = {
      from: SMTP_FROM,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody,
    };

    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`[EMAIL SERVICE] Verification email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`[EMAIL SERVICE] Failed to send email to ${toEmail}:`, error);
    return false;
  }
};
