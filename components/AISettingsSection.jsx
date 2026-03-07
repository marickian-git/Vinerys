'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateAISettings } from '@/utils/actions';

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    model: 'Gemini 1.5 Flash',
    free: true,
    desc: 'Gratuit — 1500 req/zi',
    link: 'https://aistudio.google.com/app/apikey',
    color: '#4285f4',
  },
  {
    id: 'groq',
    name: 'Groq',
    model: 'Llama 4 Scout',
    free: true,
    desc: 'Gratuit — foarte rapid',
    link: 'https://console.groq.com/keys',
    color: '#f55036',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    model: 'Claude Sonnet',
    free: false,
    desc: 'Plătit — calitate maximă',
    link: 'https://console.anthropic.com/',
    color: '#c44569',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    model: 'GPT-4o Mini',
    free: false,
    desc: 'Plătit — foarte precis',
    link: 'https://platform.openai.com/api-keys',
    color: '#10a37f',
  },
];

export default function AISettingsSection({ initialProvider, initialHasKey }) {
  const [selected, setSelected]   = useState(initialProvider || 'gemini');
  const [apiKey, setApiKey]       = useState('');
  const [showKey, setShowKey]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [hasKey, setHasKey]       = useState(initialHasKey || false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Introdu cheia API'); return;
    }
    setSaving(true);
    try {
      const result = await updateAISettings(selected, apiKey.trim());
      if (result?.error) { toast.error(result.error); }
      else {
        toast.success('Setări AI salvate!');
        setApiKey('');
        setHasKey(true);
      }
    } catch { toast.error('Eroare la salvare'); }
    finally { setSaving(false); }
  };

  const handleProviderChange = async (id) => {
    setSelected(id);
    setApiKey('');
    setHasKey(false);
    // Salvează doar providerul (fără cheie nouă)
    await updateAISettings(id, null);
  };

  const selectedProvider = PROVIDERS.find(p => p.id === selected);

  return (
    <>
      <style>{`
        .ai-providers { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1.25rem; }
        .ai-provider-card {
          padding: 0.85rem 1rem; border-radius: 10px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: all 0.2s; position: relative;
        }
        .ai-provider-card:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); }
        .ai-provider-card.selected { border-color: rgba(196,69,105,0.4); background: rgba(196,69,105,0.06); }
        .ai-provider-name { font-size: 0.8rem; color: rgba(245,230,232,0.8); font-weight: 500; margin-bottom: 0.15rem; }
        .ai-provider-model { font-size: 0.65rem; color: rgba(245,230,232,0.35); }
        .ai-provider-free {
          position: absolute; top: 0.5rem; right: 0.5rem;
          font-size: 0.58rem; padding: 0.15rem 0.4rem;
          border-radius: 10px; font-weight: 500; letter-spacing: 0.05em;
        }
        .ai-provider-free.free { background: rgba(85,196,78,0.12); color: #55c44e; border: 1px solid rgba(85,196,78,0.2); }
        .ai-provider-free.paid { background: rgba(212,175,55,0.1); color: #d4af37; border: 1px solid rgba(212,175,55,0.2); }
        .ai-provider-desc { font-size: 0.65rem; color: rgba(245,230,232,0.3); margin-top: 0.25rem; }

        .ai-key-wrap { margin-bottom: 1rem; }
        .ai-key-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(245,230,232,0.4); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
        .ai-key-status { font-size: 0.65rem; padding: 0.15rem 0.5rem; border-radius: 10px; }
        .ai-key-status.ok { background: rgba(85,196,78,0.1); color: #55c44e; border: 1px solid rgba(85,196,78,0.2); }
        .ai-key-status.missing { background: rgba(220,80,80,0.1); color: rgba(220,80,80,0.7); border: 1px solid rgba(220,80,80,0.2); }

        .ai-key-input-wrap { display: flex; gap: 0.5rem; }
        .ai-key-input {
          flex: 1; padding: 0.72rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.15);
          border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.82rem;
          font-weight: 300; outline: none; transition: all 0.25s;
          font-family: monospace;
        }
        .ai-key-input:focus { border-color: rgba(196,69,105,0.5); background: rgba(196,69,105,0.04); }
        .ai-key-input::placeholder { color: rgba(245,230,232,0.15); font-family: 'Jost', sans-serif; }
        .ai-show-btn {
          padding: 0.72rem 0.85rem; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.15); border-radius: 8px;
          color: rgba(245,230,232,0.4); cursor: pointer; font-size: 0.8rem;
          transition: all 0.2s;
        }
        .ai-show-btn:hover { border-color: rgba(196,69,105,0.3); color: rgba(245,230,232,0.7); }

        .ai-save-btn {
          width: 100%; padding: 0.72rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none; border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.78rem;
          font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.25s;
        }
        .ai-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(196,69,105,0.3); }
        .ai-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .ai-get-key { font-size: 0.68rem; color: rgba(245,230,232,0.25); margin-top: 0.6rem; line-height: 1.6; }
        .ai-get-key a { color: rgba(196,69,105,0.6); text-decoration: none; }
        .ai-get-key a:hover { color: #c44569; }

        .ai-spinner { width: 12px; height: 12px; border: 2px solid rgba(245,230,232,0.3); border-top-color: #f5e6e8; border-radius: 50%; animation: aispin 0.6s linear infinite; display: inline-block; margin-right: 6px; vertical-align: middle; }
        @keyframes aispin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) { .ai-providers { grid-template-columns: 1fr; } }
      `}</style>

      <div className="ai-providers">
        {PROVIDERS.map(p => (
          <div
            key={p.id}
            className={`ai-provider-card ${selected === p.id ? 'selected' : ''}`}
            onClick={() => handleProviderChange(p.id)}
          >
            <span className={`ai-provider-free ${p.free ? 'free' : 'paid'}`}>
              {p.free ? 'Gratuit' : 'Plătit'}
            </span>
            <div className="ai-provider-name" style={{ color: selected === p.id ? '#f5e6e8' : undefined }}>
              {p.name}
            </div>
            <div className="ai-provider-model">{p.model}</div>
            <div className="ai-provider-desc">{p.desc}</div>
          </div>
        ))}
      </div>

      <div className="ai-key-wrap">
        <div className="ai-key-label">
          <span>Cheie API — {selectedProvider?.name}</span>
          <span className={`ai-key-status ${hasKey ? 'ok' : 'missing'}`}>
            {hasKey ? '✓ Configurată' : '✗ Lipsă'}
          </span>
        </div>
        <div className="ai-key-input-wrap">
          <input
            className="ai-key-input"
            type={showKey ? 'text' : 'password'}
            placeholder={hasKey ? '••••••••••••••••••••••••• (salvată)' : `Introdu cheia API pentru ${selectedProvider?.name}`}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <button type="button" className="ai-show-btn" onClick={() => setShowKey(s => !s)}>
            {showKey ? '🙈' : '👁️'}
          </button>
        </div>
        <p className="ai-get-key">
          Obține cheia gratuită de pe{' '}
          <a href={selectedProvider?.link} target="_blank" rel="noopener noreferrer">
            {selectedProvider?.link?.replace('https://', '').split('/')[0]} ↗
          </a>
        </p>
      </div>

      <button className="ai-save-btn" onClick={handleSave} disabled={saving || !apiKey.trim()}>
        {saving ? <><span className="ai-spinner" />Se salvează...</> : '💾 Salvează cheia API'}
      </button>
    </>
  );
}
