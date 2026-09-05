"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { deleteAIAgent, saveAIAgent, testAIAgent } from "@/utils/actions";

const statusCopy = {
  Healthy: { label: "Healthy", icon: "●", tone: "healthy" },
  "Needs attention": { label: "Needs attention", icon: "▲", tone: "attention" },
  "Model unavailable": {
    label: "Model unavailable",
    icon: "!",
    tone: "danger",
  },
  "Invalid credentials": {
    label: "Invalid credentials",
    icon: "!",
    tone: "danger",
  },
  "Rate limited": { label: "Rate limited", icon: "◷", tone: "attention" },
  "Provider unavailable": {
    label: "Provider unavailable",
    icon: "!",
    tone: "danger",
  },
  "Invalid result": {
    label: "Invalid result",
    icon: "!",
    tone: "danger",
  },
  Disabled: { label: "Disabled", icon: "●", tone: "muted" },
  Configured: { label: "Not tested", icon: "○", tone: "muted" },
};

const billingCopy = {
  FREE: "Free",
  FREE_TIER: "Free-tier",
  PAID: "Paid",
  UNKNOWN: "Unknown",
};
const providerGlyphs = {
  gemini: "✦",
  groq: "ϟ",
  openrouter: "◇",
  claude: "◈",
  deepseek: "◌",
  zai: "◉",
  openai: "○",
};

function formatChecked(date) {
  if (!date) return "Not tested yet";
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(date).getTime()) / 60000),
  );
  if (minutes < 1) return "Tested just now";
  if (minutes < 60) return `Tested ${minutes} min ago`;
  if (minutes < 1440) return `Tested ${Math.round(minutes / 60)}h ago`;
  return `Tested ${Math.round(minutes / 1440)}d ago`;
}

export default function AISettingsSection({
  initialProvider,
  initialHasKey,
  initialAgents = [],
  providers = [],
}) {
  const firstProvider = providers[0]?.id || initialProvider || "gemini";
  const getEmptyAgent = (providerId = firstProvider) => {
    const definition =
      providers.find((provider) => provider.id === providerId) || providers[0];
    return {
      name: "",
      provider: definition?.id || providerId,
      providerType: definition?.type || "preset",
      baseUrl: definition?.baseUrl || "",
      model: "",
      apiKey: "",
      billingType: definition?.billingType || "UNKNOWN",
      capabilities: definition?.capabilities || {
        imageInput: true,
        structuredOutput: true,
      },
      enabled: true,
      priority: 0,
      timeoutMs: 20000,
      maxRetries: 1,
      weight: 1,
    };
  };

  const [agents, setAgents] = useState(initialAgents);
  const [form, setForm] = useState(getEmptyAgent());
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [modelFilters, setModelFilters] = useState({
    image: true,
    structured: false,
    free: false,
  });
  const [models, setModels] = useState([]);
  const [testingId, setTestingId] = useState(null);
  const [testingForm, setTestingForm] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyToggle, setBusyToggle] = useState(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setModalOpen(false);
        setDeleteTarget(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeCount = agents.filter((agent) => agent.enabled !== false).length;
  const healthyCount = agents.filter(
    (agent) => agent.lastStatus === "Healthy",
  ).length;
  const attentionCount = agents.filter(
    (agent) => agent.lastStatus && agent.lastStatus !== "Healthy",
  ).length;
  const filteredProviders = providers.filter((provider) =>
    provider.name.toLowerCase().includes(providerSearch.toLowerCase()),
  );
  const recommendedProviders = providers
    .filter((provider) => provider.capabilities?.imageInput !== false)
    .slice(0, 3);
  const visibleModels = models.filter((model) => {
    if (
      modelSearch &&
      !`${model.name} ${model.id}`
        .toLowerCase()
        .includes(modelSearch.toLowerCase())
    )
      return false;
    if (modelFilters.image && model.imageInput === false) return false;
    if (modelFilters.structured && model.structuredOutput === false)
      return false;
    if (modelFilters.free && !["FREE", "FREE_TIER"].includes(model.billingType))
      return false;
    return true;
  });

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const billingFor = (value) => billingCopy[value] || "Unknown";
  const statusFor = (agent) =>
    statusCopy[
      agent.enabled === false ? "Disabled" : agent.lastStatus || "Configured"
    ] || statusCopy.Configured;

  const selectProvider = (providerId) => {
    const provider = providers.find((item) => item.id === providerId);
    if (!provider) return;
    setForm((current) => ({
      ...current,
      provider: provider.id,
      providerType: provider.type,
      baseUrl: provider.baseUrl || "",
      billingType: provider.billingType || "UNKNOWN",
      capabilities: provider.capabilities || current.capabilities,
      model: "",
    }));
    setModels([]);
    setModelSearch("");
  };
  const openAdd = () => {
    setForm(getEmptyAgent());
    setEditingId(null);
    setAdvancedOpen(false);
    setProviderSearch("");
    setShowKey(false);
    setModalOpen(true);
  };
  const edit = (agent) => {
    setEditingId(agent.id);
    setForm({ ...getEmptyAgent(agent.provider), ...agent, apiKey: "" });
    setAdvancedOpen(false);
    setProviderSearch("");
    setShowKey(false);
    setModalOpen(true);
  };

  const saveForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveAIAgent({ ...form, id: editingId });
      if (result?.error) throw new Error(result.error);
      const saved = {
        ...form,
        id: editingId || `pending-${Date.now()}`,
        lastStatus: editingId ? form.lastStatus : null,
        lastCheckedAt: editingId ? form.lastCheckedAt : null,
      };
      setAgents((current) =>
        editingId
          ? current.map((agent) =>
              agent.id === editingId ? { ...agent, ...saved } : agent,
            )
          : [...current, saved],
      );
      setModalOpen(false);
      toast.success(editingId ? "Agent updated" : "Agent added");
    } catch (error) {
      toast.error(error.message || "We could not save this agent");
    } finally {
      setSaving(false);
    }
  };

  const test = async (id) => {
    setTestingId(id);
    try {
      const result = await testAIAgent(id);
      if (result?.error)
        throw Object.assign(new Error(result.error), { status: result.status });
      setModels(result.models || []);
      setAgents((current) =>
        current.map((agent) =>
          agent.id === id
            ? {
                ...agent,
                lastStatus: result.status,
                lastCheckedAt: new Date().toISOString(),
              }
            : agent,
        ),
      );
      toast.success(
        result.status === "Healthy" ? "Connection successful" : result.status,
      );
    } catch (error) {
      setAgents((current) =>
        current.map((agent) =>
          agent.id === id
            ? {
                ...agent,
                lastStatus: error.status || "Provider unavailable",
                lastCheckedAt: new Date().toISOString(),
              }
            : agent,
        ),
      );
      toast.error(
        "We could not verify this agent. Check the API key and model.",
      );
    } finally {
      setTestingId(null);
    }
  };

  const testForm = async () => {
    if (!editingId) {
      toast.error("Save the agent first, then test the connection.");
      return;
    }
    setTestingForm(true);
    await test(editingId);
    setTestingForm(false);
  };

  const toggle = async (agent) => {
    setBusyToggle(agent.id);
    try {
      const result = await saveAIAgent({
        ...agent,
        apiKey: "",
        enabled: !agent.enabled,
      });
      if (result?.error) throw new Error(result.error);
      setAgents((current) =>
        current.map((item) =>
          item.id === agent.id ? { ...item, enabled: !item.enabled } : item,
        ),
      );
    } catch (error) {
      toast.error(error.message || "We could not update this agent");
    } finally {
      setBusyToggle(null);
    }
  };

  const remove = async () => {
    const result = await deleteAIAgent(deleteTarget.id);
    if (result?.error) toast.error(result.error);
    else {
      setAgents((current) =>
        current.filter((agent) => agent.id !== deleteTarget.id),
      );
      toast.success("Agent deleted");
    }
    setDeleteTarget(null);
  };

  const duplicate = (agent) => {
    setEditingId(null);
    setForm({
      ...getEmptyAgent(agent.provider),
      ...agent,
      id: undefined,
      name: `${agent.name} copy`,
      apiKey: "",
    });
    setModalOpen(true);
    toast("Enter the API key to create the copy.");
  };

  return (
    <div className="ai-manager">
      <div className="ai-manager-head">
        <div>
          <p className="ai-kicker">AI configuration</p>
          <h2>AI Scan Agents</h2>
          <p className="ai-description">
            Multiple AI agents can analyze the same label in parallel. Their
            results are combined for a more accurate identification.
          </p>
        </div>
        <button type="button" className="ai-primary" onClick={openAdd}>
          ＋ Add AI agent
        </button>
      </div>
      <div className="ai-summary" aria-label="Agent summary">
        <div>
          <strong>{agents.length}</strong>
          <span>agents</span>
        </div>
        <div>
          <strong>{activeCount}</strong>
          <span>active</span>
        </div>
        <div>
          <strong>{healthyCount}</strong>
          <span>healthy</span>
        </div>
        <div>
          <strong className={attentionCount ? "ai-number-warn" : ""}>
            {attentionCount}
          </strong>
          <span>need attention</span>
        </div>
      </div>
      <details className="ai-how">
        <summary>How does this work?</summary>
        <p>
          When you scan a label, active agents analyze the same image in
          parallel. Vinerys compares and combines their answers to produce the
          best estimate.
        </p>
      </details>

      {agents.length ? (
        <div className="ai-agent-grid">
          {agents.map((agent) => {
            const status = statusFor(agent);
            const provider = providers.find(
              (item) => item.id === agent.provider,
            );
            return (
              <article
                className={`ai-agent-card ${agent.enabled === false ? "is-disabled" : ""}`}
                key={agent.id}>
                <div className="ai-card-top">
                  <div className="ai-provider-mark">
                    {providerGlyphs[agent.provider] || "◇"}
                  </div>
                  <div className="ai-card-heading">
                    <h3>{agent.name}</h3>
                    <p>{provider?.name || agent.provider}</p>
                  </div>
                  <button
                    type="button"
                    className="ai-more"
                    aria-label={`More actions for ${agent.name}`}
                    onClick={() => edit(agent)}>
                    •••
                  </button>
                </div>
                <div className="ai-model-label">Model</div>
                <div className="ai-model-name">
                  {agent.model || "Default model"}
                </div>
                <div className="ai-card-tags">
                  <span>✓ Image analysis</span>
                  {agent.capabilities?.structuredOutput !== false && (
                    <span>✓ JSON output</span>
                  )}
                </div>
                <div className="ai-card-info">
                  <span
                    className={`ai-billing billing-${(agent.billingType || "UNKNOWN").toLowerCase()}`}>
                    {billingFor(agent.billingType)}
                  </span>
                  <span className={`ai-status ${status.tone}`}>
                    <b>{status.icon}</b> {status.label}
                  </span>
                </div>
                <div className="ai-card-checked">
                  {formatChecked(agent.lastCheckedAt)}
                </div>
                <div className="ai-card-footer">
                  <button
                    type="button"
                    className="ai-test"
                    onClick={() => test(agent.id)}
                    disabled={testingId === agent.id}>
                    {testingId === agent.id ? "Testing..." : "Test"}
                  </button>
                  <button
                    type="button"
                    className="ai-text-button"
                    onClick={() => edit(agent)}>
                    Edit
                  </button>
                  <label className="ai-switch-label">
                    <span>{agent.enabled === false ? "Off" : "On"}</span>
                    <input
                      type="checkbox"
                      checked={agent.enabled !== false}
                      onChange={() => toggle(agent)}
                      disabled={busyToggle === agent.id}
                    />
                    <span className="ai-switch" aria-hidden="true" />
                  </label>
                  <button
                    type="button"
                    className="ai-menu-button"
                    aria-label={`Actions for ${agent.name}`}
                    onClick={() => setDeleteTarget(agent)}>
                    ⋯
                  </button>
                </div>
                <div className="ai-card-actions">
                  <button type="button" onClick={() => duplicate(agent)}>
                    Duplicate
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(agent)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="ai-empty">
          <div className="ai-empty-icon">✦</div>
          <h3>No AI agents configured</h3>
          <p>
            Add one or more agents and we will run them in parallel for better
            results.
          </p>
          <button type="button" className="ai-primary" onClick={openAdd}>
            ＋ Add your first AI agent
          </button>
          <div className="ai-recommended-note">
            <strong>Recommended setup</strong>
            <span>Start with a provider that supports image analysis.</span>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="ai-overlay"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setModalOpen(false)
          }>
          <section
            className="ai-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-modal-title">
            <div className="ai-modal-head">
              <div>
                <p className="ai-kicker">
                  {editingId ? "Edit agent" : "New agent"}
                </p>
                <h2 id="ai-modal-title">
                  {editingId ? "Edit AI agent" : "Add AI agent"}
                </h2>
              </div>
              <button
                type="button"
                className="ai-close"
                aria-label="Close"
                onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={saveForm}>
              <fieldset className="ai-form-section">
                <legend>Basic configuration</legend>
                <label className="ai-field">
                  <span>Agent name</span>
                  <input
                    required
                    maxLength={80}
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="e.g. Gemini Vision"
                  />
                </label>
                <div className="ai-field">
                  <span>Provider</span>
                  <input
                    className="ai-search"
                    value={providerSearch}
                    onChange={(event) => setProviderSearch(event.target.value)}
                    placeholder="Search providers..."
                    aria-label="Search providers"
                  />
                  <div className="ai-provider-picker">
                    {(providerSearch
                      ? filteredProviders
                      : recommendedProviders
                    ).map((provider) => (
                      <button
                        type="button"
                        key={provider.id}
                        className={`ai-provider-option ${form.provider === provider.id ? "selected" : ""}`}
                        onClick={() => selectProvider(provider.id)}>
                        <b>{providerGlyphs[provider.id] || "◇"}</b>
                        <span>
                          <strong>{provider.name}</strong>
                          <small>
                            {billingFor(provider.billingType)} ·{" "}
                            {provider.capabilities?.imageInput === false
                              ? "Text only"
                              : "Image input ✓"}
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                  {!providerSearch && (
                    <button
                      type="button"
                      className="ai-show-all"
                      onClick={() => setProviderSearch(" ")}>
                      Show all providers
                    </button>
                  )}
                </div>
                {(form.provider === "openai-compatible" ||
                  form.providerType === "custom") && (
                  <label className="ai-field">
                    <span>Base URL</span>
                    <input
                      required
                      type="url"
                      value={form.baseUrl}
                      onChange={(event) =>
                        update("baseUrl", event.target.value)
                      }
                      placeholder="https://provider.example/v1"
                    />
                  </label>
                )}
              </fieldset>
              <fieldset className="ai-form-section">
                <legend>Model</legend>
                <label className="ai-field">
                  <span>Choose a model</span>
                  <input
                    className="ai-search"
                    value={modelSearch}
                    onChange={(event) => setModelSearch(event.target.value)}
                    placeholder="Search models..."
                    list="ai-model-options"
                  />
                  <select
                    required
                    value={form.model}
                    onChange={(event) => update("model", event.target.value)}
                    aria-label="Choose a model">
                    <option value="">Select a model</option>
                    {visibleModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name || model.id}
                        {model.imageInput === false
                          ? " · Text only"
                          : " · Image ✓"}
                      </option>
                    ))}
                  </select>
                  <datalist id="ai-model-options">
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </datalist>
                </label>
                <div className="ai-filter-row">
                  {Object.entries({
                    image: "Image",
                    structured: "Structured output",
                    free: "Free",
                  }).map(([key, label]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={modelFilters[key]}
                        onChange={(event) =>
                          setModelFilters((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                      />{" "}
                      {label}
                    </label>
                  ))}
                </div>
                {models.length === 0 && (
                  <p className="ai-help">
                    Save the agent, then use Test connection to discover models
                    from this provider.
                  </p>
                )}
                {form.model &&
                  models.find((model) => model.id === form.model)
                    ?.imageInput === false && (
                    <p className="ai-warning">
                      This model is text-only and is not suitable for wine label
                      scanning.
                    </p>
                  )}
              </fieldset>
              <fieldset className="ai-form-section">
                <legend>Credentials</legend>
                <label className="ai-field">
                  <span>API key</span>
                  <div className="ai-secret-wrap">
                    <input
                      type={showKey ? "text" : "password"}
                      required={!editingId}
                      value={form.apiKey}
                      onChange={(event) => update("apiKey", event.target.value)}
                      placeholder={
                        editingId
                          ? "Configured · enter a new key to change it"
                          : "Paste your API key"
                      }
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((current) => !current)}>
                      {showKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <small className="ai-help">
                    Your API key is encrypted and stored securely on the server.
                    It is never shown in full.
                  </small>
                </label>
              </fieldset>
              <fieldset className="ai-form-section">
                <legend>Capabilities</legend>
                <label className="ai-check">
                  <input
                    type="checkbox"
                    checked={form.capabilities?.imageInput !== false}
                    onChange={(event) =>
                      update("capabilities", {
                        ...form.capabilities,
                        imageInput: event.target.checked,
                      })
                    }
                  />{" "}
                  <span>
                    <strong>Image input</strong>
                    <small>Required for label scanning</small>
                  </span>
                </label>
                <label className="ai-check">
                  <input
                    type="checkbox"
                    checked={form.capabilities?.structuredOutput !== false}
                    onChange={(event) =>
                      update("capabilities", {
                        ...form.capabilities,
                        structuredOutput: event.target.checked,
                      })
                    }
                  />{" "}
                  <span>
                    <strong>Structured output</strong>
                    <small>Prefer JSON responses for reliable results</small>
                  </span>
                </label>
              </fieldset>
              <div className="ai-advanced">
                <button
                  type="button"
                  className="ai-advanced-toggle"
                  onClick={() => setAdvancedOpen((current) => !current)}
                  aria-expanded={advancedOpen}>
                  Advanced settings <span>{advancedOpen ? "⌃" : "⌄"}</span>
                </button>
                {advancedOpen && (
                  <div className="ai-advanced-grid">
                    <label>
                      Priority
                      <input
                        type="number"
                        min="0"
                        value={form.priority}
                        onChange={(event) =>
                          update("priority", event.target.value)
                        }
                      />
                      <small>
                        Order used when results have a similar score.
                      </small>
                    </label>
                    <label>
                      Weight
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={form.weight}
                        onChange={(event) =>
                          update("weight", event.target.value)
                        }
                      />
                      <small>Influence in the combined result.</small>
                    </label>
                    <label>
                      Timeout
                      <input
                        type="number"
                        min="3000"
                        max="60000"
                        value={form.timeoutMs}
                        onChange={(event) =>
                          update("timeoutMs", event.target.value)
                        }
                      />
                      <small>Maximum wait time in milliseconds.</small>
                    </label>
                    <label>
                      Retries
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={form.maxRetries}
                        onChange={(event) =>
                          update("maxRetries", event.target.value)
                        }
                      />
                      <small>Attempts after a failed request.</small>
                    </label>
                  </div>
                )}
              </div>
              <fieldset className="ai-participation">
                <label className="ai-check">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(event) =>
                      update("enabled", event.target.checked)
                    }
                  />{" "}
                  <span>
                    <strong>Use this agent for wine label scanning</strong>
                    <small>
                      It will analyze labels when active and available.
                    </small>
                  </span>
                </label>
              </fieldset>
              <div className="ai-modal-actions">
                <button
                  type="button"
                  className="ai-ghost"
                  onClick={
                    editingId
                      ? testForm
                      : () =>
                          toast("Save the agent first to test its connection.")
                  }
                  disabled={testingForm}>
                  {testingForm ? "Testing..." : "Test connection"}
                </button>
                <button
                  type="submit"
                  className="ai-primary"
                  disabled={
                    saving || !form.name || (!editingId && !form.apiKey)
                  }>
                  {saving ? "Saving..." : "Save agent"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {deleteTarget && (
        <div className="ai-overlay" role="presentation">
          <section
            className="ai-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-agent-title">
            <p className="ai-kicker">Remove agent</p>
            <h2 id="delete-agent-title">Delete “{deleteTarget.name}”?</h2>
            <p>This agent will no longer participate in scans.</p>
            <div>
              <button
                type="button"
                className="ai-ghost"
                onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="ai-danger" onClick={remove}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
      {!agents.length && initialHasKey && (
        <p className="ai-legacy">
          Your legacy {initialProvider} setup will continue to work until you
          add an agent here.
        </p>
      )}
      <style>{`
        .ai-manager{color:#f5e6e8;font-family:'Jost',sans-serif}.ai-manager-head{display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem;margin-bottom:1.5rem}.ai-kicker{margin:0 0 .35rem;color:#c44569;font-size:.62rem;letter-spacing:.16em;text-transform:uppercase}.ai-manager h2{margin:0;font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;line-height:1.05}.ai-description{max-width:500px;margin:.65rem 0 0;color:rgba(245,230,232,.52);font-size:.8rem;line-height:1.65}.ai-primary,.ai-test,.ai-ghost,.ai-danger{border:0;border-radius:7px;padding:.72rem 1rem;color:#fff;cursor:pointer;font-family:inherit;font-size:.73rem;letter-spacing:.04em;white-space:nowrap}.ai-primary{background:linear-gradient(135deg,#8b1a2e,#c44569);box-shadow:0 5px 16px rgba(196,69,105,.18)}.ai-primary:disabled,.ai-test:disabled{opacity:.5;cursor:not-allowed}.ai-summary{display:flex;gap:2rem;margin-bottom:1rem;padding:1rem 1.1rem;border:1px solid rgba(196,69,105,.14);border-radius:10px;background:rgba(196,69,105,.045)}.ai-summary div{display:flex;align-items:baseline;gap:.35rem}.ai-summary strong{font-size:1.1rem;font-weight:500}.ai-summary span{color:rgba(245,230,232,.42);font-size:.68rem}.ai-number-warn{color:#d4af37}.ai-how{margin-bottom:1.25rem;border-bottom:1px solid rgba(196,69,105,.1);color:rgba(245,230,232,.7);font-size:.75rem}.ai-how summary{padding:.4rem 0 1rem;cursor:pointer;list-style:none}.ai-how summary:before{content:'?';display:inline-grid;place-items:center;width:1.1rem;height:1.1rem;margin-right:.45rem;border:1px solid rgba(245,230,232,.3);border-radius:50%;font-size:.65rem}.ai-how p{max-width:600px;margin:0 0 1rem;color:rgba(245,230,232,.45);line-height:1.6}.ai-agent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.ai-agent-card{min-width:0;padding:1.1rem;border:1px solid rgba(196,69,105,.16);border-radius:12px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015));transition:border-color .2s,opacity .2s}.ai-agent-card:hover{border-color:rgba(196,69,105,.38)}.ai-agent-card.is-disabled{opacity:.58}.ai-card-top{display:flex;align-items:center;gap:.7rem}.ai-provider-mark{display:grid;place-items:center;width:2rem;height:2rem;border-radius:8px;background:rgba(196,69,105,.14);color:#df7893;font-size:1.1rem}.ai-card-heading{min-width:0;flex:1}.ai-card-heading h3{overflow:hidden;margin:0;color:#f5e6e8;font-size:.9rem;font-weight:500;text-overflow:ellipsis;white-space:nowrap}.ai-card-heading p{margin:.18rem 0 0;color:rgba(245,230,232,.43);font-size:.68rem}.ai-more,.ai-menu-button,.ai-close{border:0;background:transparent;color:rgba(245,230,232,.42);cursor:pointer}.ai-more{font-size:.9rem;letter-spacing:.11em}.ai-model-label{margin-top:1.25rem;color:rgba(245,230,232,.35);font-size:.61rem;text-transform:uppercase;letter-spacing:.12em}.ai-model-name{overflow:hidden;margin-top:.2rem;color:#f5e6e8;font-size:.86rem;text-overflow:ellipsis;white-space:nowrap}.ai-card-tags{display:flex;flex-wrap:wrap;gap:.35rem;margin:1rem 0}.ai-card-tags span{padding:.27rem .42rem;border-radius:4px;background:rgba(113,198,107,.09);color:#9bcf91;font-size:.62rem}.ai-card-info{display:flex;align-items:center;justify-content:space-between;gap:.5rem}.ai-billing{padding:.25rem .45rem;border-radius:4px;font-size:.6rem;text-transform:uppercase;letter-spacing:.08em}.billing-free,.billing-free_tier{background:rgba(113,198,107,.12);color:#9bcf91}.billing-paid{background:rgba(111,159,218,.13);color:#9cbde8}.billing-unknown{background:rgba(255,255,255,.08);color:rgba(245,230,232,.5)}.ai-status{font-size:.68rem}.ai-status b{font-size:.65rem}.ai-status.healthy{color:#9bcf91}.ai-status.attention{color:#d4af37}.ai-status.danger{color:#e78b8b}.ai-status.muted{color:rgba(245,230,232,.46)}.ai-card-checked{margin-top:.45rem;color:rgba(245,230,232,.3);font-size:.62rem}.ai-card-footer{display:flex;align-items:center;gap:.65rem;margin-top:1rem;padding-top:.85rem;border-top:1px solid rgba(196,69,105,.1)}.ai-test{padding:.45rem .7rem;background:#8b1a2e}.ai-text-button{padding:0;border:0;background:transparent;color:#d77b95;cursor:pointer;font:inherit;font-size:.68rem}.ai-switch-label{display:flex;align-items:center;gap:.35rem;margin-left:auto;color:rgba(245,230,232,.45);font-size:.62rem;cursor:pointer}.ai-switch-label input{position:absolute;opacity:0}.ai-switch{position:relative;width:1.9rem;height:1rem;border-radius:1rem;background:rgba(255,255,255,.16);transition:background .2s}.ai-switch:after{position:absolute;top:2px;left:2px;width:.7rem;height:.7rem;border-radius:50%;background:#fff;content:'';transition:transform .2s}.ai-switch-label input:checked+.ai-switch{background:#8b1a2e}.ai-switch-label input:checked+.ai-switch:after{transform:translateX(.9rem)}.ai-switch-label input:focus-visible+.ai-switch{outline:2px solid #d77b95;outline-offset:2px}.ai-menu-button{font-size:1.2rem}.ai-card-actions{display:none;gap:.6rem;margin-top:.7rem}.ai-card-actions button{border:0;background:transparent;color:rgba(245,230,232,.55);cursor:pointer;font:inherit;font-size:.65rem}.ai-card-actions button:last-child{color:#e78b8b}.ai-agent-card:focus-within .ai-card-actions{display:flex}.ai-empty{padding:2rem 1rem;text-align:center;border:1px dashed rgba(196,69,105,.25);border-radius:12px}.ai-empty-icon{margin-bottom:.75rem;color:#c44569;font-size:1.6rem}.ai-empty h3{margin:0;font-size:1rem;font-weight:500}.ai-empty p{max-width:340px;margin:.5rem auto 1.25rem;color:rgba(245,230,232,.45);font-size:.75rem;line-height:1.55}.ai-recommended-note{display:flex;justify-content:center;gap:.5rem;margin-top:1.5rem;color:rgba(245,230,232,.4);font-size:.66rem}.ai-recommended-note strong{color:#d4af37;font-weight:400}.ai-legacy{color:#d4af37;font-size:.7rem}.ai-overlay{position:fixed;z-index:20;inset:0;display:grid;place-items:center;padding:1rem;background:rgba(13,6,8,.78);backdrop-filter:blur(6px)}.ai-modal{width:min(650px,100%);max-height:92vh;overflow:auto;padding:1.5rem;border:1px solid rgba(196,69,105,.25);border-radius:14px;background:#190b10;box-shadow:0 20px 60px rgba(0,0,0,.4)}.ai-modal-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem}.ai-close{font-size:1.7rem;line-height:1}.ai-form-section{margin:0;padding:0 0 1.25rem;border:0;border-bottom:1px solid rgba(196,69,105,.12)}.ai-form-section+.ai-form-section{padding-top:1.25rem}.ai-form-section legend{margin-bottom:.85rem;color:#d77b95;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase}.ai-field{display:block;margin-bottom:.8rem}.ai-field>span{display:block;margin-bottom:.4rem;color:rgba(245,230,232,.65);font-size:.72rem}.ai-field input,.ai-field select,.ai-advanced-grid input{box-sizing:border-box;width:100%;padding:.7rem .75rem;border:1px solid rgba(196,69,105,.18);border-radius:7px;background:rgba(255,255,255,.055);color:#f5e6e8;font:inherit;font-size:.78rem}.ai-field select{margin-top:.5rem}.ai-field option{background:#190b10}.ai-field input:focus,.ai-field select:focus{border-color:#c44569;outline:2px solid rgba(196,69,105,.16)}.ai-search{margin-bottom:.55rem}.ai-provider-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem}.ai-provider-option{display:flex;align-items:center;gap:.45rem;min-width:0;padding:.55rem;border:1px solid rgba(196,69,105,.12);border-radius:7px;background:rgba(255,255,255,.025);color:#f5e6e8;text-align:left;cursor:pointer}.ai-provider-option.selected{border-color:#c44569;background:rgba(196,69,105,.12)}.ai-provider-option>b{color:#d77b95;font-size:1rem}.ai-provider-option span{min-width:0}.ai-provider-option strong,.ai-provider-option small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ai-provider-option strong{font-size:.68rem;font-weight:500}.ai-provider-option small{margin-top:.15rem;color:rgba(245,230,232,.4);font-size:.57rem}.ai-show-all{margin-top:.55rem;padding:0;border:0;background:transparent;color:#d77b95;cursor:pointer;font:inherit;font-size:.65rem}.ai-filter-row{display:flex;flex-wrap:wrap;gap:.7rem;color:rgba(245,230,232,.55);font-size:.65rem}.ai-filter-row input,.ai-check input{accent-color:#c44569}.ai-help{margin:.45rem 0 0;color:rgba(245,230,232,.38);font-size:.65rem;line-height:1.5}.ai-warning{margin:.65rem 0 0;padding:.55rem .7rem;border-left:2px solid #d4af37;background:rgba(212,175,55,.08);color:#dfc870;font-size:.67rem}.ai-secret-wrap{display:flex;align-items:center;gap:.4rem}.ai-secret-wrap input{flex:1}.ai-secret-wrap button{border:0;background:transparent;color:#d77b95;cursor:pointer;font:inherit;font-size:.65rem}.ai-check{display:flex;align-items:flex-start;gap:.55rem;margin:.65rem 0;color:#f5e6e8;font-size:.75rem}.ai-check span{display:grid;gap:.2rem}.ai-check small{color:rgba(245,230,232,.4);font-size:.63rem}.ai-advanced{margin:1.1rem 0;border:1px solid rgba(196,69,105,.12);border-radius:8px}.ai-advanced-toggle{display:flex;justify-content:space-between;width:100%;padding:.8rem;border:0;background:transparent;color:#f5e6e8;cursor:pointer;font:inherit;font-size:.75rem}.ai-advanced-toggle span{color:#d77b95}.ai-advanced-grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;padding:0 .8rem .8rem}.ai-advanced-grid label{color:rgba(245,230,232,.62);font-size:.68rem}.ai-advanced-grid input{display:block;margin:.3rem 0 .25rem}.ai-advanced-grid small{display:block;color:rgba(245,230,232,.35);font-size:.59rem;line-height:1.35}.ai-participation{margin:0;padding:.8rem;border:1px solid rgba(196,69,105,.12);border-radius:8px;background:rgba(196,69,105,.04)}.ai-modal-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1.25rem}.ai-ghost{border:1px solid rgba(196,69,105,.28);background:transparent;color:rgba(245,230,232,.72)}.ai-danger{background:#842c35}.ai-confirm{width:min(380px,100%);padding:1.5rem;border:1px solid rgba(196,69,105,.25);border-radius:12px;background:#190b10}.ai-confirm h2{margin:0;font-size:1.2rem}.ai-confirm p:not(.ai-kicker){color:rgba(245,230,232,.52);font-size:.78rem;line-height:1.5}.ai-confirm>div{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1.25rem}@media(max-width:620px){.ai-manager-head{display:block}.ai-manager-head .ai-primary{margin-top:1rem}.ai-summary{gap:1rem;justify-content:space-between}.ai-summary div{display:block}.ai-summary span{display:block;margin-top:.2rem}.ai-provider-picker{grid-template-columns:1fr 1fr}.ai-modal{padding:1.1rem}.ai-advanced-grid{grid-template-columns:1fr}.ai-recommended-note{display:block}.ai-recommended-note span{display:block;margin-top:.3rem}}
      `}</style>
    </div>
  );
}
