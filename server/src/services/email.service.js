const nodemailer = require('nodemailer');
const { config } = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

if (config.SMTP_HOST && config.SMTP_USER) {
  try {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  } catch (err) {
    logger.warn(`Could not initialize Nodemailer SMTP transport: ${err.message}. Emails will be logged to console.`);
  }
}

/**
 * Send an email or log to console fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (transporter) {
    try {
      const fromAddress = config.EMAIL_FROM.includes('<')
        ? config.EMAIL_FROM
        : `"The Golden Circle" <${config.EMAIL_FROM}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.warn(`Failed to send email via SMTP: ${error.message}. Falling back to console log.`);
    }
  }

  // Graceful fallback: Log to console
  console.log('\n=================== [EMAIL DISPATCH SIMULATION] ===================');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('-------------------------------------------------------------------');
  console.log(text || html);
  console.log('===================================================================\n');
  return { simulated: true };
};

/**
 * Send account verification email
 */
const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${config.CLIENT_URL}/verify-account?token=${token}`;
  const subject = 'Verify your Golden Circle Account';
  const text = `Hello ${name || 'there'},\n\nWelcome to The Golden Circle. Please verify your account by clicking the link below:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe Golden Circle Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0f19; color: #f3f4f6; border-radius: 8px;">
      <h2 style="color: #f59e0b; margin-bottom: 16px;">The Golden Circle</h2>
      <p>Hello <strong>${name || 'there'}</strong>,</p>
      <p>Welcome to The Golden Circle. Please verify your email address to activate your account and access premium ecosystem features.</p>
      <div style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Verify My Account
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 14px;">Or copy and paste this link in your browser:</p>
      <p style="color: #fbbf24; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">This link will expire in 24 hours. If you did not create this account, please ignore this email.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${config.CLIENT_URL}/reset-password?token=${token}`;
  const subject = 'Reset your Golden Circle Password';
  const text = `Hello ${name || 'there'},\n\nYou requested a password reset for your Golden Circle account. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Golden Circle Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0f19; color: #f3f4f6; border-radius: 8px;">
      <h2 style="color: #f59e0b; margin-bottom: 16px;">The Golden Circle</h2>
      <p>Hello <strong>${name || 'there'}</strong>,</p>
      <p>You requested a password reset for your Golden Circle account. Click the button below to choose a new password:</p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 14px;">Or copy and paste this link in your browser:</p>
      <p style="color: #fbbf24; font-size: 14px; word-break: break-all;">${resetUrl}</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">This link will expire in 1 hour. If you did not make this request, your account remains secure and no action is required.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send organization invitation email
 */
const sendInvitationEmail = async (email, orgName, inviterName, role, token) => {
  const inviteUrl = `${config.CLIENT_URL}/invitations/${token}`;
  const subject = `You've been invited to join ${orgName} on The Golden Circle`;
  const text = `Hello,\n\n${inviterName || 'An administrator'} has invited you to join ${orgName} as a ${role} on The Golden Circle.\n\nAccept or decline your invitation here:\n${inviteUrl}\n\nThis invitation expires in 7 days.\n\nBest regards,\nThe Golden Circle Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0f19; color: #f3f4f6; border-radius: 8px;">
      <h2 style="color: #f59e0b; margin-bottom: 16px;">The Golden Circle</h2>
      <p>Hello,</p>
      <p><strong>${inviterName || 'An administrator'}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong>.</p>
      <div style="margin: 24px 0;">
        <a href="${inviteUrl}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View Invitation
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 14px;">Or copy and paste this link in your browser:</p>
      <p style="color: #fbbf24; font-size: 14px; word-break: break-all;">${inviteUrl}</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">This invitation will expire in 7 days.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send event registration confirmation email
 */
const sendEventRegistrationEmail = async (email, userName, event) => {
  const eventUrl = `${config.CLIENT_URL}/events/${event.slug || event._id}`;
  const subject = `Confirmed: Your registration for "${event.title}"`;
  const text = `Hello ${userName || 'there'},\n\nYou are confirmed for "${event.title}" on ${new Date(event.date).toLocaleDateString()}.\n\nFormat: ${event.format}\nTime: ${event.startTime} (${event.timeZone})\n\nView details and access credentials:\n${eventUrl}\n\nBest regards,\nThe Golden Circle Events Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0f19; color: #f3f4f6; border-radius: 8px;">
      <h2 style="color: #f59e0b; margin-bottom: 8px;">The Golden Circle Events</h2>
      <p style="color: #9ca3af; font-size: 14px; margin-top: 0;">Registration Confirmed</p>
      <h3 style="color: #ffffff; margin-top: 16px;">${event.title}</h3>
      <p style="color: #d1d5db;">Hello <strong>${userName || 'there'}</strong>, your ticket / seat is confirmed!</p>
      <div style="background-color: #111827; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #374151;">
        <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
        <p style="margin: 4px 0;"><strong>Time:</strong> ${event.startTime} ${event.endTime ? '- ' + event.endTime : ''} (${event.timeZone})</p>
        <p style="margin: 4px 0;"><strong>Format:</strong> ${event.format}</p>
      </div>
      <div style="margin: 24px 0;">
        <a href="${eventUrl}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View Event & Ticket
        </a>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">See you at the event!</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send custom in-app notification email
 */
const sendNotificationEmail = async (email, name, title, message, link) => {
  const fullLink = link && link.startsWith('http') ? link : `${config.CLIENT_URL}${link || ''}`;
  const subject = `[The Golden Circle] ${title}`;
  const text = `Hello ${name || 'there'},\n\n${message}\n\nView details: ${fullLink}\n\nBest regards,\nThe Golden Circle Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0b0f19; color: #f3f4f6; border: 1px solid #d97706; border-radius: 8px;">
      <h2 style="color: #fbbf24; margin-top: 0;">${title}</h2>
      <p style="font-size: 16px; line-height: 1.5;">${message}</p>
      ${link ? `<a href="${fullLink}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 16px;">View Details</a>` : ''}
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">The Golden Circle Executive Ecosystem</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInvitationEmail,
  sendEventRegistrationEmail,
  sendNotificationEmail,
};
