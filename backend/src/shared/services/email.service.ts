import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendPasswordResetEmail(to: string, tempPassword: string) {
    if (!process.env.SMTP_USER) {
      console.warn('SMTP_USER not configured. Skipping email send. Temp password:', tempPassword);
      return;
    }

    await this.transporter.sendMail({
      from: `"Krieta Support" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Your Krieta Password Has Been Reset',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset</h2>
          <p>An administrator has reset your password.</p>
          <p>Your temporary password is: <strong>${tempPassword}</strong></p>
          <p>Please log in and change your password immediately.</p>
        </div>
      `,
    });
  }
}
