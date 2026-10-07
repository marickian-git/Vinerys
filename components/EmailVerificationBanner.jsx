'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { authClient } from '@/utils/auth-client';
import { appPath } from '@/utils/appPath';

export default function EmailVerificationBanner({ email }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    setSending(true);
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: appPath('/dashboard?verified=1') });
    setSending(false);
    if (error) {
      toast.error(error.status === 429 ? 'Prea multe cereri. Încearcă mai târziu.' : 'Nu am putut trimite emailul');
      return;
    }
    setSent(true);
    toast.success('Email de confirmare trimis');
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
      padding: '1rem 1.25rem', marginBottom: '1.25rem', borderRadius: 12,
      background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.25)',
      color: 'rgba(245,230,232,0.8)', fontSize: '0.82rem', fontFamily: "'Jost', sans-serif",
    }}>
      <span>
        Adresa <strong>{email}</strong> nu este confirmată. Confirmarea îți permite să-ți recuperezi contul.
      </span>
      <button type="button" onClick={resend} disabled={sending || sent} style={{
        padding: '0.55rem 1rem', borderRadius: 8, border: '1px solid rgba(212,175,55,0.4)',
        background: 'transparent', color: '#d4af37', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem',
      }}>
        {sent ? 'Trimis ✓' : sending ? 'Se trimite…' : 'Trimite emailul de confirmare'}
      </button>
    </div>
  );
}
