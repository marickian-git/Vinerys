import nodemailer from 'nodemailer';

// Email prin SMTP generic: Brevo (gratuit, 300/zi), Resend, Gmail etc. — se schimbă doar din env.
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM ("Vinerys <adresa@verificata.ro>")
let transporter;

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM);
}

function getTransporter() {
  if (!transporter) {
    const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) {
    // Fără SMTP: în dev afișăm linkul în consolă ca fluxul să poată fi testat; în producție doar avertizăm
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[email:dev] către ${to} — ${subject}\n${text}`);
    } else {
      console.warn(`[email] SMTP neconfigurat: emailul „${subject}” nu a fost trimis`);
    }
    return { sent: false };
  }
  await getTransporter().sendMail({ from: process.env.EMAIL_FROM, to, subject, html, text });
  return { sent: true };
}
