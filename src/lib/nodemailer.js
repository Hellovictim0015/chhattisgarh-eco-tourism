import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const OTP_PURPOSE_TEXT = {
  login: 'log in to your account',
  register: 'verify your email and create your account',
};

// Emails a 6-digit OTP for login / registration.
export async function sendOtpEmail(to, otp, purpose) {
  const action = OTP_PURPOSE_TEXT[purpose] || 'continue';
  await transporter.sendMail({
    from: `"Chhattisgarh Eco Tourism" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${otp} is your Chhattisgarh Eco Tourism verification code`,
    text: `Your OTP to ${action} is ${otp}. It is valid for 10 minutes. Do not share it with anyone. If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0a1629">
        <h2 style="margin:0 0 8px">Chhattisgarh Eco Tourism</h2>
        <p style="margin:0 0 20px;color:#475569">Use this code to ${action}:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#fbf6ec;border:1px solid #f1e4c8;border-radius:8px;padding:16px;text-align:center">${otp}</div>
        <p style="margin:20px 0 0;color:#475569;font-size:13px">This code is valid for 10 minutes. Do not share it with anyone.</p>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:12px">If you did not request this, you can safely ignore this email.</p>
      </div>`,
  });
}

const BOOKING_STATUS_TEXT = {
  PENDING: 'has been received and is awaiting confirmation from the hotel',
  CONFIRMED: 'is confirmed',
  CANCELLED: 'has been cancelled',
  REJECTED: 'could not be accepted by the hotel',
  COMPLETED: 'is complete. Thank you for staying with us',
};

// Dates arrive as "YYYY-MM-DD"
const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Emails the guest about a new booking or a status change. Never throws: a failed email
// must not fail the booking itself.
export async function sendBookingEmail(booking) {
  if (!booking?.guest_email || !process.env.GMAIL_USER) return;
  const statusText = BOOKING_STATUS_TEXT[booking.status] || `is ${String(booking.status).toLowerCase()}`;
  const amount = `₹${Number(booking.total_amount).toLocaleString('en-IN')}`;
  const rows = [
    ['Booking ID', booking.booking_code],
    ['Hotel', booking.hotel_name],
    ['Room', `${booking.room_name} × ${booking.rooms_count}`],
    ['Check-in', fmtDay(booking.check_in)],
    ['Check-out', fmtDay(booking.check_out)],
    ['Guests', booking.guests],
    ['Amount (pay at hotel)', amount],
  ];
  try {
    await transporter.sendMail({
      from: `"Chhattisgarh Eco Tourism" <${process.env.GMAIL_USER}>`,
      to: booking.guest_email,
      subject: `Booking ${booking.booking_code} ${booking.status === 'PENDING' ? 'received' : booking.status.toLowerCase()} – ${booking.hotel_name}`,
      text: `Hi ${booking.guest_name}, your booking ${statusText}.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0a1629">
          <h2 style="margin:0 0 8px">Chhattisgarh Eco Tourism</h2>
          <p style="margin:0 0 20px;color:#475569">Hi ${esc(booking.guest_name)}, your booking ${statusText}.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${rows.map(([k, v]) => `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">${k}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold">${esc(v)}</td></tr>`).join('')}
          </table>
        </div>`,
    });
  } catch (err) {
    console.error('Booking email failed:', err.message);
  }
}
