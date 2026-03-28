'use client';
import Link from 'next/link';

export default function SuspendedPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-secondary)', 
      padding: '20px',
      textAlign: 'center'
    }}>
      <div className="card" style={{ maxWidth: '480px', padding: '40px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: 'var(--red-50)', 
          color: 'var(--red-500)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '40px', 
          margin: '0 auto 24px' 
        }}>
          🔒
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Account Suspended
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
          Your store access has been temporarily suspended by the system administrator. 
          This could be due to pending payments, maintenance, or policy updates.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a 
            href="mailto:support@smartcleanerspro.com" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
          >
            Contact Support
          </a>
          <Link href="/login" className="btn btn-secondary" style={{ width: '100%' }}>
            Back to Login
          </Link>
        </div>
        <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
          Powered by SmartCleanersPro
        </p>
      </div>
    </div>
  );
}
