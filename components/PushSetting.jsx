'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { appPath } from '@/utils/appPath';

// CELLAR-007: abonare la notificări push (rezumat lunar: ce intră / iese din fereastra de consum)
function keyToBytes(base64) {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export default function PushSetting() {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setState({ status: 'unsupported' });
      const config = await fetch(appPath('/api/push/subscribe')).then((r) => r.json()).catch(() => ({}));
      if (!config.enabled) return setState({ status: 'disabled' });
      const registration = await navigator.serviceWorker.getRegistration(appPath('/'));
      const subscription = registration?.active?.scriptURL.endsWith('/push-sw.js') ? await registration.pushManager.getSubscription() : null;
      if (!cancelled) setState({ status: subscription ? 'on' : 'off', publicKey: config.publicKey });
    })();
    return () => { cancelled = true; };
  }, []);

  const enable = async () => {
    try {
      if ((await Notification.requestPermission()) !== 'granted') return toast.error('Permite notificările din setările browserului');
      const registration = await navigator.serviceWorker.register(appPath('/push-sw.js'), { scope: appPath('/') });
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(state.publicKey) });
      const response = await fetch(appPath('/api/push/subscribe'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error((await response.json()).error);
      setState((s) => ({ ...s, status: 'on' }));
      toast.success('Notificările sunt active');
    } catch (error) {
      toast.error(error.message || 'Nu am putut activa notificările');
    }
  };

  const disable = async () => {
    const registration = await navigator.serviceWorker.getRegistration(appPath('/'));
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await fetch(appPath('/api/push/subscribe'), { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
      await subscription.unsubscribe();
    }
    setState((s) => ({ ...s, status: 'off' }));
  };

  const text = {
    loading: 'Se verifică…',
    unsupported: 'Browserul acesta nu suportă notificări push. Pe iPhone, adaugă aplicația pe ecranul principal.',
    disabled: 'Notificările nu sunt încă activate pe server.',
    off: 'Primești o dată pe lună ce vinuri intră sau ies din fereastra de consum.',
    on: 'Activ pe acest dispozitiv. Primești rezumatul lunar.',
  }[state.status];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
      <p style={{ margin: 0, flexGrow: 1, fontSize: '0.85rem' }}>{text}</p>
      {state.status === 'off' && <button type="button" className="set-btn-ghost" style={{ width: 'auto' }} onClick={enable}>Activează notificările</button>}
      {state.status === 'on' && <button type="button" className="set-btn-ghost" style={{ width: 'auto' }} onClick={disable}>Dezactivează</button>}
    </div>
  );
}
