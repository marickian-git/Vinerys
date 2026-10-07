'use client';

import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import { authClient } from '@/utils/auth-client';
import { appPath } from '@/utils/appPath';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    const { error: err } = await authClient.requestPasswordReset({ email, redirectTo: appPath('/reset-password') });
    if (err) {
      setError(err.status === 429 ? 'Prea multe cereri. Încearcă din nou mai târziu.' : 'Nu am putut trimite cererea. Încearcă din nou.');
      setStatus('error');
      return;
    }
    // Același mesaj indiferent dacă adresa există (nu dezvăluim conturile)
    setStatus('sent');
  };

  return (
    <AuthCard title="Ai uitat parola?" subtitle="Îți trimitem pe email un link pentru a alege o parolă nouă.">
      {status === 'sent' ? (
        <p className="ac-note">
          Dacă există un cont pentru <strong>{email}</strong>, vei primi în câteva minute un email cu linkul de resetare.
          Verifică și folderul Spam.
        </p>
      ) : (
        <form onSubmit={submit}>
          {status === 'error' && <p className="ac-error" style={{ marginBottom: '1.25rem' }}>{error}</p>}
          <label className="ac-label" htmlFor="email">Adresă email</label>
          <input id="email" type="email" className="ac-input" placeholder="email@exemplu.ro" required
            value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <button className="ac-btn" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Se trimite…' : 'Trimite linkul'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
