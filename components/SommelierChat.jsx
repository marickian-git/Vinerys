'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { askSommelier } from '@/utils/actions';

const STARTERS = ['Ce deschid diseară la miel cu rozmarin, sub 100 lei?', 'Ce vinuri trebuie să beau curând?', 'Ce alb am pentru pește?', 'Ce mi-ar plăcea din pivniță?'];

// AI-001: chat cu Sommelierul, care caută în pivnița reală înainte să recomande
export default function SommelierChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    const history = next.map(({ role, content: c }) => ({ role, content: c })).slice(-20);
    const reply = await askSommelier(history).catch(() => ({ error: 'Eroare de rețea' }));
    setBusy(false);
    setMessages((current) => [...current, reply.error
      ? { role: 'assistant', content: reply.error, error: true }
      : { role: 'assistant', content: reply.answer, wines: reply.wines, tools: reply.tools }]);
  };

  const bubble = (mine) => ({
    alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '0.75rem 1rem', borderRadius: 16,
    background: mine ? '#8b1a2e' : 'rgba(255,255,255,0.05)', border: mine ? 'none' : '1px solid rgba(196,69,105,0.2)', whiteSpace: 'pre-line', fontSize: '0.95rem',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div role="log" aria-live="polite" aria-label="Conversația cu Sommelierul" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 200 }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {STARTERS.map((starter) => (
              <button key={starter} type="button" onClick={() => send(starter)} style={{ padding: '0.5rem 0.9rem', borderRadius: 999, border: '1px solid rgba(196,69,105,0.35)', background: 'transparent', color: '#f5e6e8', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}>
                {starter}
              </button>
            ))}
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} style={bubble(message.role === 'user')}>
            <span style={{ color: message.error ? '#ff8f8f' : undefined }}>{message.content}</span>
            {message.wines?.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '0.6rem 0 0', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {message.wines.map((wine) => (
                  <li key={wine.id}>
                    <Link href={`/wines/${wine.id}`} style={{ display: 'inline-block', padding: '0.3rem 0.7rem', borderRadius: 999, background: 'rgba(196,69,105,0.18)', color: '#f5e6e8', fontSize: '0.8rem', textDecoration: 'none' }}>
                      🍷 {wine.name}{wine.vintage ? ` ${wine.vintage}` : ''}{wine.location ? ` · ${wine.location}` : ''}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {message.tools?.length > 0 && <div style={{ fontSize: '0.68rem', opacity: 0.5, marginTop: 6 }}>A căutat în pivniță ({message.tools.length} {message.tools.length === 1 ? 'interogare' : 'interogări'})</div>}
          </div>
        ))}
        {busy && <div style={{ ...bubble(false), opacity: 0.7 }}>Sommelierul caută în pivniță…</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: '0.5rem', position: 'sticky', bottom: '1rem' }}>
        <label htmlFor="sommelier-input" style={{ position: 'absolute', left: -9999 }}>Întrebarea ta</label>
        <input id="sommelier-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} placeholder="Întreabă Sommelierul…"
          style={{ flexGrow: 1, minWidth: 0, background: '#1a0f12', color: '#f5e6e8', border: '1px solid rgba(196,69,105,0.35)', borderRadius: 999, padding: '0.85rem 1.1rem', fontSize: '1rem' }} />
        <button type="submit" disabled={busy || !input.trim()} style={{ padding: '0 1.3rem', borderRadius: 999, border: 'none', background: '#8b1a2e', color: '#f5e6e8', cursor: 'pointer' }}>Trimite</button>
      </form>
    </div>
  );
}
