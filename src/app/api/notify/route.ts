import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "hirokitakaya00@gmail.com";

type BookingPayload = {
  name: string;
  email: string;
  phone?: string;
  experience?: string;
  message?: string;
  date: string;
  time: string;
  location: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: BookingPayload = await req.json();
    const { name, email, date, time, location, phone, experience, message } = body;

    if (!name || !email || !date || !time || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Email to Hiroki (notification)
    await resend.emails.send({
      from: "BJJ Booking <onboarding@resend.dev>",
      to: NOTIFICATION_EMAIL,
      subject: `New Booking: ${name} - ${date} ${time}`,
      html: `
        <h2>New Private Lesson Booking</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
          <tr><td style="padding: 8px; font-weight: bold;">Name</td><td style="padding: 8px;">${name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Email</td><td style="padding: 8px;">${email}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Phone</td><td style="padding: 8px;">${phone || "—"}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Date</td><td style="padding: 8px;">${date}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Time</td><td style="padding: 8px;">${time}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Location</td><td style="padding: 8px;">${location}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Experience</td><td style="padding: 8px;">${experience || "—"}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Message</td><td style="padding: 8px;">${message || "—"}</td></tr>
        </table>
      `,
    });

    // Confirmation email to student
    await resend.emails.send({
      from: "Hiroki Takaya BJJ <onboarding@resend.dev>",
      to: email,
      subject: `Booking Confirmed - ${date} ${time}`,
      html: `
        <h2>Your Booking is Confirmed! OSS! 🤙</h2>
        <p>Hi ${name},</p>
        <p>Your private BJJ session has been confirmed:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 400px;">
          <tr><td style="padding: 8px; font-weight: bold;">Date</td><td style="padding: 8px;">${date}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Time</td><td style="padding: 8px;">${time}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Location</td><td style="padding: 8px;">${location}</td></tr>
        </table>
        <p style="margin-top: 20px;">See you on the mats!</p>
        <p>— Hiroki Takaya</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email notification failed:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}