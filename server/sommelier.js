// AI-001: Sommelier conversațional. Bucla agent: modelul cere tool-uri (AI-002) până are destule date,
// apoi răspunde. Recomandă doar vinuri pe care le-a văzut efectiv în rezultatele tool-urilor (fără vinuri inventate).
import { describeTools } from './sommelierTools';

export const MAX_TOOL_STEPS = 4;

export function sommelierPrompt({ messages, steps, language = 'ro' }) {
  const transcript = messages.slice(-8).map((m) => `${m.role === 'user' ? 'USER' : 'SOMMELIER'}: ${m.content}`).join('\n');
  const toolLog = steps.map((s) => `TOOL ${s.tool}(${JSON.stringify(s.args)}) → ${JSON.stringify(s.output).slice(0, 4000)}`).join('\n');
  return `You are Vinerys, a warm and precise personal sommelier for the user's OWN wine cellar.
Answer in ${language === 'ro' ? 'Romanian' : 'English'}, concise (max ~120 words), explain WHY a wine fits (food, style, drinking window, taste).
When the user asks about their cellar ("din pivnița mea", "ce am", "ce deschid") recommend ONLY wines returned by tools. Never invent wines, prices or bottles.
Prefer wines that should be drunk soon when quality is similar. Respect price limits and wine types the user mentions.
General wine questions (no cellar needed) can be answered directly.

Tools:
${describeTools()}

Reply with ONLY one JSON object, either:
{"tool":"<name>","args":{...}}   to call a tool (max ${MAX_TOOL_STEPS} calls), or
{"answer":"<text for the user>","wineIds":["<ids of recommended wines from tool results>"]}

Conversation:
${transcript}
${toolLog ? `\nTool results so far:\n${toolLog}` : ''}`;
}

// Răspunsul modelului: fie un apel de tool, fie răspunsul final
export function parseSommelierReply(raw) {
  if (raw && typeof raw.tool === 'string') return { tool: raw.tool, args: raw.args && typeof raw.args === 'object' ? raw.args : {} };
  if (raw && typeof raw.answer === 'string' && raw.answer.trim()) {
    return { answer: raw.answer.trim().slice(0, 2000), wineIds: Array.isArray(raw.wineIds) ? raw.wineIds.filter((id) => typeof id === 'string') : [] };
  }
  throw Object.assign(new Error('Răspuns Sommelier invalid'), { providerStatus: 'INVALID_RESULT' });
}

// Id-urile de vin apărute în rezultatele tool-urilor (singurele care pot fi recomandate)
export function seenWines(steps) {
  const wines = new Map();
  const collect = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(collect);
    if (typeof value.id === 'string' && typeof value.name === 'string') wines.set(value.id, value);
    Object.values(value).forEach(collect);
  };
  steps.forEach((s) => collect(s.output));
  return wines;
}

// generate(prompt) → { result: reply parsat, usage }; runTool(name, args) → { result } | { error }
export async function runSommelier({ messages, generate, runTool, language }) {
  const steps = [];
  const usage = [];
  for (let i = 0; i <= MAX_TOOL_STEPS; i += 1) {
    const forceAnswer = i === MAX_TOOL_STEPS;
    const prompt = sommelierPrompt({ messages, steps, language }) + (forceAnswer ? '\nYou must answer now with {"answer": ...}.' : '');
    const { result, usage: stepUsage = [] } = await generate(prompt);
    usage.push(...stepUsage);
    if (result.tool && !forceAnswer) {
      const output = await runTool(result.tool, result.args);
      steps.push({ tool: result.tool, args: result.args, output: output.error ? { error: output.error } : output.result });
      continue;
    }
    const known = seenWines(steps);
    const wines = [...new Set(result.wineIds ?? [])].filter((id) => known.has(id)).map((id) => known.get(id));
    return { answer: result.answer ?? 'Nu am reușit să formulez un răspuns. Încearcă din nou.', wines, tools: steps.map((s) => s.tool), usage };
  }
  return { answer: 'Nu am reușit să formulez un răspuns. Încearcă din nou.', wines: [], tools: steps.map((s) => s.tool), usage };
}
