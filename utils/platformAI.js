// AI-012: AI găzduit. Utilizatorii fără chei proprii folosesc agenții platformei, în limita unei cote lunare.
// Cheile proprii (BYO) au prioritate și nu consumă din cotă.
//
// PLATFORM_AI_AGENTS='[{"provider":"gemini","model":"gemini-2.5-flash","apiKey":"…"}]'
// AI_QUOTA_SCANS=20  AI_QUOTA_TEXT=50   (pe lună, per utilizator; ADMIN nelimitat)
export const DEFAULT_QUOTAS = { scan: 20, text: 50 };

export function platformAgents(env = process.env) {
  try {
    const list = JSON.parse(env.PLATFORM_AI_AGENTS || '[]');
    if (!Array.isArray(list)) return [];
    return list
      .filter((agent) => agent?.provider && agent?.apiKey)
      .map((agent, index) => ({
        id: null,
        name: `Platformă ${agent.provider}`,
        provider: agent.provider,
        providerType: agent.providerType || 'preset',
        baseUrl: agent.baseUrl || null,
        model: agent.model || null,
        apiKey: agent.apiKey,
        billingType: agent.billingType || 'PAID',
        metadata: agent.pricing ? { pricing: agent.pricing } : null,
        enabled: true,
        priority: index,
        timeoutMs: 20000,
        maxRetries: 1,
        weight: 1,
        source: 'platform',
      }));
  } catch {
    return [];
  }
}

export function quotaFor(user, kind, env = process.env) {
  if (user?.role === 'ADMIN') return Infinity;
  const configured = Number(kind === 'scan' ? env.AI_QUOTA_SCANS : env.AI_QUOTA_TEXT);
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_QUOTAS[kind];
}

export const monthStart = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), 1);

// Ce agenți folosește o cerere: proprii dacă există; altfel ai platformei, dacă mai e cotă.
export function chooseAgents({ ownAgents, platform, used, quota }) {
  if (ownAgents.length) return { agents: ownAgents, source: 'byo' };
  if (!platform.length) return { error: 'NO_AGENTS' };
  if (used >= quota) return { error: 'QUOTA_EXCEEDED' };
  return { agents: platform, source: 'platform' };
}

export function quotaMessage(error, quota) {
  if (error === 'QUOTA_EXCEEDED') return `Ai folosit toate cele ${quota} cereri AI incluse luna aceasta. Adaugă propria cheie în Setări → AI pentru acces nelimitat.`;
  return 'Configurează cel puțin un agent AI activ în Setări → AI.';
}
