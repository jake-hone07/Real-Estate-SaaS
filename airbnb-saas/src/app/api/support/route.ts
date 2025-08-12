import { NextRequest, NextResponse } from 'next/server';

// Optional: uncomment + configure if using Resend
// import { Resend } from 'resend';
// const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
// const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@yourbrand.com';

export async function POST(req: NextRequest) {
  const { email, subject, message } = await req.json();
  if (!email || !subject || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    // If configured, send real email
    // if (resend) {
    //   await resend.emails.send({
    //     from: `YourBrand Support <${SUPPORT_EMAIL}>`,
    //     to: SUPPORT_EMAIL,
    //     reply_to: String(email),
    //     subject: `[Support] ${subject}`,
    //     text: String(message),
    //   });
    //   return NextResponse.json({ ok: true });
    // }

    // Fallback: accept the ticket without error (you can log/store later)
    console.log('Support ticket:', { email, subject, message });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Send failed' }, { status: 500 });
  }
}
