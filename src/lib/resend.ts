import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type BookingInfo = {
  name: string;
  email: string;
  phone: string;
  experience: string;
  message: string;
  date: string;
  time: string;
  location: string;
};

export async function sendBookingNotification(booking: BookingInfo) {
  const to = process.env.NOTIFICATION_EMAIL || "hirokitakaya00@gmail.com";

  // Notify Hiroki
  await resend.emails.send({
    from: "BJJ Booking <onboarding@resend.dev>",
    to,
    subject: `🥋 New Booking: ${booking.name} — ${booking.date} ${booking.time}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #0891b2;">New Private Lesson Booking</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0; font-weight: bold;">${booking.date}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Time</td><td style="padding: 8px 0; font-weight: bold;">${booking.time}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Location</td><td style="padding: 8px 0; font-weight: bold;">${booking.location}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Name</td><td style="padding: 8px 0;">${booking.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${booking.email}">${booking.email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;">${booking.phone || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Experience</td><td style="padding: 8px 0;">${booking.experience}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Message</td><td style="padding: 8px 0;">${booking.message || "—"}</td></tr>
        </table>
      </div>
    `,
  });

  // Confirmation to student
  await resend.emails.send({
    from: "Hiroki Takaya BJJ <onboarding@resend.dev>",
    to: booking.email,
    subject: `Your BJJ Private Lesson is Confirmed — ${booking.date} ${booking.time}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #0891b2;">Booking Confirmed! 🤙</h2>
        <p>Hi ${booking.name},</p>
        <p>Your private Jiu-Jitsu session with Hiroki Takaya has been confirmed:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0; font-weight: bold;">${booking.date}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Time</td><td style="padding: 8px 0; font-weight: bold;">${booking.time}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Location</td><td style="padding: 8px 0; font-weight: bold;">${booking.location}</td></tr>
        </table>
        <p>Please arrive 5-10 minutes early. Bring your gi (or no-gi gear) and a positive attitude!</p>
        <p>If you need to cancel or reschedule, please email <a href="mailto:hirokitakaya00@gmail.com">hirokitakaya00@gmail.com</a>.</p>
        <p>OSS! 🥋</p>
        <p>— Hiroki Takaya</p>
      </div>
    `,
  });
}