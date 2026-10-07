'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import AuthCard from '@/components/auth/AuthCard';
import { authClient } from '@/utils/auth-client';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const linkError = params.get('error');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!token || linkError) {
    return (
      <>
        <p className="ac-error">Linkul de resetare este invalid sau a expirat.</p>
        <p className="ac-footer"><Link href="/forgot-password">Cere un link nou</Link></p>
      </>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Parola trebuie să aibă minim 8 caractere.');
    if (form.password !== form.confirm) return setError('Parolele nu coincid.');

    setSaving(true);
    const { error: err } = await authClient.resetPassword({ newPassword: form.password, token });
    setSaving(false);
    if (err) {
      setError(err.code === 'INVALID_TOKEN' ? 'Linkul a expirat sau a fost deja folosit. Cere unul nou.' : 'Nu am putut schimba parola. Încearcă din nou.');
      return;
    }
    toast.success('Parola a fost schimbată. Te poți autentifica.');
    router.replace('/sign-in');
  };

  return (
    <form onSubmit={submit}>
      {error && <p className="ac-error" style={{ marginBottom: '1.25rem' }}>{error}</p>}
      <label className="ac-label" htmlFor="password">Parolă nouă</label>
      <input id="password" type="password" className="ac-input" placeholder="minim 8 caractere" required minLength={8}
        autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <label className="ac-label" htmlFor="confirm">Confirmă parola</label>
      <input id="confirm" type="password" className="ac-input" required minLength={8}
        autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
      <button className="ac-btn" type="submit" disabled={saving}>{saving ? 'Se salvează…' : 'Salvează parola'}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Parolă nouă" subtitle="Alege o parolă nouă pentru contul tău.">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
