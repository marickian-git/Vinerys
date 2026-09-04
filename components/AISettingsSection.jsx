"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { deleteAIAgent, saveAIAgent } from "@/utils/actions";

const PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    model: "gemini-2.5-flash",
    free: true,
    link: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "groq",
    name: "Groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    free: true,
    link: "https://console.groq.com/keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    model: "google/gemma-3-27b-it:free",
    free: true,
    link: "https://openrouter.ai/keys",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    model: "claude-3-5-sonnet-20241022",
    free: false,
    link: "https://console.anthropic.com/",
  },
];

const emptyAgent = {
  name: "",
  provider: "gemini",
  model: "gemini-2.5-flash",
  apiKey: "",
  enabled: true,
  priority: 0,
  timeoutMs: 20000,
  maxRetries: 1,
  weight: 1,
};

export default function AISettingsSection({
  initialProvider,
  initialHasKey,
  initialAgents = [],
}) {
  const [agents, setAgents] = useState(initialAgents);
  const [form, setForm] = useState(emptyAgent);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setForm(emptyAgent);
    setEditingId(null);
  };

  const edit = (agent) => {
    setEditingId(agent.id);
    setForm({ ...emptyAgent, ...agent, apiKey: "" });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveAIAgent({ ...form, id: editingId });
      if (result?.error) throw new Error(result.error);
      toast.success(editingId ? "Agent actualizat" : "Agent adăugat");
      const saved = {
        ...form,
        id: editingId || `pending-${Date.now()}`,
        lastStatus: "Configured",
      };
      setAgents((current) =>
        editingId
          ? current.map((agent) =>
              agent.id === editingId ? { ...agent, ...saved } : agent,
            )
          : [...current, saved],
      );
      reset();
    } catch (error) {
      toast.error(error.message || "Agentul nu a putut fi salvat");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Ștergi acest agent AI?")) return;
    const result = await deleteAIAgent(id);
    if (result?.error) toast.error(result.error);
    else {
      setAgents((current) => current.filter((agent) => agent.id !== id));
      toast.success("Agent șters");
    }
  };

  return (
    <div className="ai-settings">
      <p className="ai-intro">
        Agenții activi analizează aceeași imagine în paralel. Un agent
        indisponibil nu oprește scanarea.
      </p>
      <div className="ai-list">
        {agents.map((agent) => (
          <div className="ai-agent" key={agent.id}>
            <div>
              <strong>{agent.name}</strong>
              <span>
                {agent.provider} · {agent.model || "model implicit"}
              </span>
            </div>
            <div className="ai-agent-meta">
              <span className={agent.enabled ? "ok" : "off"}>
                {agent.enabled ? "Activ" : "Dezactivat"}
              </span>
              <button type="button" onClick={() => edit(agent)}>
                Editează
              </button>
              <button type="button" onClick={() => remove(agent.id)}>
                Șterge
              </button>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="ai-form">
        <h4>{editingId ? "Editează agent" : "Adaugă agent"}</h4>
        <input
          required
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Nume agent, ex. Gemini principal"
        />
        <select
          value={form.provider}
          onChange={(event) => {
            const provider = PROVIDERS.find(
              (item) => item.id === event.target.value,
            );
            setForm((current) => ({
              ...current,
              provider: provider.id,
              model: provider.model,
            }));
          }}>
          {PROVIDERS.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name} {provider.free ? "(free tier)" : "(paid)"}
            </option>
          ))}
        </select>
        <input
          value={form.model}
          onChange={(event) => update("model", event.target.value)}
          placeholder="Model"
        />
        <input
          type="password"
          required={!editingId}
          value={form.apiKey}
          onChange={(event) => update("apiKey", event.target.value)}
          placeholder={
            editingId ? "Lasă gol pentru cheia existentă" : "API key"
          }
          autoComplete="off"
        />
        <div className="ai-grid">
          <label>
            Prioritate
            <input
              type="number"
              min="0"
              value={form.priority}
              onChange={(event) => update("priority", event.target.value)}
            />
          </label>
          <label>
            Timeout ms
            <input
              type="number"
              min="3000"
              max="60000"
              value={form.timeoutMs}
              onChange={(event) => update("timeoutMs", event.target.value)}
            />
          </label>
          <label>
            Retry-uri
            <input
              type="number"
              min="0"
              max="3"
              value={form.maxRetries}
              onChange={(event) => update("maxRetries", event.target.value)}
            />
          </label>
          <label>
            Greutate
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={form.weight}
              onChange={(event) => update("weight", event.target.value)}
            />
          </label>
        </div>
        <label className="ai-toggle">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => update("enabled", event.target.checked)}
          />{" "}
          Participă la scanări
        </label>
        <div className="ai-actions">
          <button type="submit" disabled={saving}>
            {saving
              ? "Se salvează..."
              : editingId
                ? "Salvează agentul"
                : "Adaugă agentul"}
          </button>
          {editingId && (
            <button type="button" onClick={reset}>
              Anulează
            </button>
          )}
        </div>
      </form>
      {!agents.length && initialHasKey && (
        <p className="ai-legacy">
          Configurația veche pentru {initialProvider} va fi folosită până adaugi
          agenți noi.
        </p>
      )}
      <style>{`.ai-intro{font-size:.78rem;color:rgba(245,230,232,.5);line-height:1.6;margin:0 0 1rem}.ai-list{display:grid;gap:.5rem;margin-bottom:1rem}.ai-agent{display:flex;justify-content:space-between;gap:1rem;padding:.75rem;border:1px solid rgba(196,69,105,.15);border-radius:8px;background:rgba(255,255,255,.025)}.ai-agent strong,.ai-agent span{display:block}.ai-agent strong{font-size:.82rem;color:#f5e6e8}.ai-agent span{font-size:.68rem;color:rgba(245,230,232,.4);margin-top:.2rem}.ai-agent-meta{display:flex;align-items:center;gap:.45rem;white-space:nowrap}.ai-agent-meta button{background:none;border:0;color:#c44569;cursor:pointer;font-size:.68rem}.ai-agent-meta .ok{color:#71c66b}.ai-agent-meta .off{color:#d4af37}.ai-form{display:grid;gap:.65rem}.ai-form h4{margin:.5rem 0 0;color:#f5e6e8;font-size:.85rem}.ai-form input,.ai-form select{width:100%;box-sizing:border-box;padding:.65rem .75rem;background:rgba(255,255,255,.04);border:1px solid rgba(196,69,105,.15);border-radius:7px;color:#f5e6e8;font-size:.82rem}.ai-form select option{background:#1a0810}.ai-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem}.ai-grid label{font-size:.65rem;color:rgba(245,230,232,.45)}.ai-grid input{margin-top:.25rem}.ai-toggle{font-size:.75rem;color:rgba(245,230,232,.6);display:flex;gap:.5rem;align-items:center}.ai-actions{display:flex;gap:.5rem}.ai-actions button{padding:.65rem .9rem;border:0;border-radius:7px;background:#8b1a2e;color:#fff;cursor:pointer}.ai-actions button+button{background:transparent;border:1px solid rgba(196,69,105,.25)}.ai-legacy{font-size:.7rem;color:#d4af37}@media(max-width:520px){.ai-agent{display:block}.ai-agent-meta{margin-top:.6rem}.ai-grid{grid-template-columns:1fr 1fr}}`}</style>
    </div>
  );
}
