export function getAppUrl(origin) {
  const configuredUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  return configuredUrl || origin || 'http://localhost:3000';
}

export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error('Email service is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email send failed: ${response.status} ${details}`);
  }

  return response.json();
}
