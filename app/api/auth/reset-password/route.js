import { NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db/db';
import { sendEmail, getAppUrl } from '@/lib/email';
import { createResetToken } from '@/lib/reset-password';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function ensureResetTable(db = query) {
  await db(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    await ensureResetTable();

    const userRes = await query(
      `SELECT id, email, name
       FROM users
       WHERE lower(email) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { message: 'If an account exists for this email, reset instructions have been sent.' },
        { status: 200 }
      );
    }

    const user = userRes.rows[0];
    const { rawToken, tokenHash } = createResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const appUrl = getAppUrl(request.headers.get('origin'));
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await transaction(async (tx) => {
      await ensureResetTable(tx);
      await tx(
        `DELETE FROM password_reset_tokens
         WHERE user_id = $1 OR expires_at < NOW() OR used_at IS NOT NULL`,
        [user.id]
      );
      await tx(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );
    });

    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `Hello ${user.name || ''}, reset your password here: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin-bottom: 12px;">Reset your password</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>We received a request to reset your password. Use the button below to choose a new one.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #059669; color: white; text-decoration: none; padding: 12px 18px; border-radius: 10px; display: inline-block; font-weight: 700;">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'If an account exists for this email, reset instructions have been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset Password Request Error:', error);
    return NextResponse.json(
      { error: 'Password reset email service is currently unavailable.' },
      { status: 503 }
    );
  }
}
