'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const ANIM_STYLE = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
@keyframes thinkPulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.9; }
}
.msg-anim    { animation: fadeSlideUp 0.3s cubic-bezier(.22,.68,0,1.15) both; }
.fade-in     { animation: fadeIn 0.18s ease both; }
.blink-cursor::after {
  content: '▌';
  display: inline;
  color: rgba(139,92,246,0.9);
  animation: blink 0.7s ease infinite;
  margin-left: 1px;
  font-size: 0.9em;
}
.think-pulse { animation: thinkPulse 1.8s ease infinite; }
@keyframes auroraMove {
  0%,100% { transform: translate3d(0,0,0) scale(1); opacity: .52; }
  33% { transform: translate3d(34px,-26px,0) scale(1.08); opacity: .75; }
  66% { transform: translate3d(-28px,28px,0) scale(.96); opacity: .62; }
}
@keyframes floatSoft {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes shimmerLine {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}
@keyframes orbitSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.aurora-blob { animation: auroraMove 10s ease-in-out infinite; }
.float-soft { animation: floatSoft 4.5s ease-in-out infinite; }
.orbit-spin { animation: orbitSpin 18s linear infinite; }
.premium-grid {
  background-image:
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(circle at 50% 25%, black, transparent 68%);
}
.premium-noise {
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.09) 1px, transparent 0);
  background-size: 18px 18px;
  opacity: .07;
}
.premium-card-hover:hover {
  transform: translateY(-3px);
  background: rgba(255,255,255,.06) !important;
  border-color: rgba(139,92,246,.32) !important;
  box-shadow: 0 18px 60px rgba(124,58,237,.16);
}
.shimmer-line { overflow: hidden; position: relative; }
.shimmer-line::after {
  content: '';
  position: absolute;
  inset: 0;
  width: 45%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
  animation: shimmerLine 2.6s ease-in-out infinite;
}

@keyframes cinematicBeam {
  0% { transform: translateX(-35%) rotate(-8deg); opacity: .15; }
  50% { opacity: .42; }
  100% { transform: translateX(35%) rotate(-8deg); opacity: .15; }
}
@keyframes starDrift {
  from { transform: translate3d(0,0,0); }
  to { transform: translate3d(-90px,70px,0); }
}
@keyframes orbGlow {
  0%,100% { transform: scale(1); filter: blur(0px); opacity: .8; }
  50% { transform: scale(1.08); filter: blur(.5px); opacity: 1; }
}
@keyframes borderFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.cinematic-stars {
  background-image:
    radial-gradient(circle at 12% 22%, rgba(255,255,255,.52) 0 1px, transparent 1.5px),
    radial-gradient(circle at 38% 18%, rgba(167,139,250,.65) 0 1px, transparent 1.7px),
    radial-gradient(circle at 68% 35%, rgba(96,165,250,.58) 0 1px, transparent 1.5px),
    radial-gradient(circle at 82% 72%, rgba(255,255,255,.42) 0 1px, transparent 1.5px),
    radial-gradient(circle at 24% 78%, rgba(34,211,238,.42) 0 1px, transparent 1.5px);
  background-size: 420px 320px;
  animation: starDrift 38s linear infinite;
}
.cinematic-beam {
  animation: cinematicBeam 9s ease-in-out infinite alternate;
  background: linear-gradient(90deg, transparent, rgba(124,58,237,.08), rgba(34,211,238,.20), rgba(168,85,247,.12), transparent);
}
.cinematic-orb { animation: orbGlow 4s ease-in-out infinite; }
.lux-border {
  position: relative;
}
.lux-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(115deg, rgba(124,58,237,.4), rgba(34,211,238,.24), rgba(168,85,247,.38), rgba(255,255,255,.08));
  background-size: 280% 280%;
  animation: borderFlow 8s ease infinite;
  opacity: .36;
}

`;

const MODELS = [
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B', provider: 'cerebras', tag: 'Fast' },
  { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B', provider: 'cerebras', tag: 'Preview' },
  { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'cerebras', tag: 'Fast' },
  { id: 'zai-glm-4.7', name: 'GLM 4.7', provider: 'cerebras', tag: 'Fast' },
  { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash', provider: 'openrouter', tag: 'Free' },
  { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5', provider: 'openrouter', tag: 'Free' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 Super', provider: 'openrouter', tag: 'Free' },
  { id: 'inclusionai/ring-2.6-1t:free', name: 'Ring 2.6 1T', provider: 'openrouter', tag: 'Free' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'google', tag: 'Preview' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', provider: 'google', tag: 'Preview' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'google', tag: 'Preview' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', tag: 'Free' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'github', tag: 'Free' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'github', tag: 'Fast' },
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'github', tag: 'Fast' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'github', tag: 'Free' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'github', tag: 'Fast' },
  { id: 'openai/o1', name: 'o1 Reasoning', provider: 'github', tag: 'Free' },
  { id: 'openai/o1-mini', name: 'o1 Mini', provider: 'github', tag: 'Fast' },
  { id: 'openai/o3', name: 'o3 Reasoning', provider: 'github', tag: 'Free' },
  { id: 'openai/o3-mini', name: 'o3 Mini', provider: 'github', tag: 'Fast' },
  { id: 'openai/o4-mini', name: 'o4 Mini', provider: 'github', tag: 'Free' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'github', tag: 'Free' },
  { id: 'deepseek/deepseek-r1-0528', name: 'DeepSeek R1 0528', provider: 'github', tag: 'Free' },
  { id: 'deepseek/deepseek-v3-0324', name: 'DeepSeek V3', provider: 'github', tag: 'Free' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'github', tag: 'Free' },
  { id: 'meta/llama-4-maverick-17b-128e-instruct-fp8', name: 'Llama 4 Maverick', provider: 'github', tag: 'Free' },
  { id: 'meta/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'github', tag: 'Free' },
  { id: 'meta/meta-llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'github', tag: 'Free' },
  { id: 'xai/grok-3', name: 'Grok 3', provider: 'github', tag: 'Free' },
  { id: 'xai/grok-3-mini', name: 'Grok 3 Mini', provider: 'github', tag: 'Fast' },
  { id: 'microsoft/mai-ds-r1', name: 'MAI-DS R1', provider: 'github', tag: 'Free' },
  { id: 'microsoft/phi-4', name: 'Phi 4', provider: 'github', tag: 'Free' },
  { id: 'microsoft/phi-4-mini-instruct', name: 'Phi 4 Mini', provider: 'github', tag: 'Fast' },
  { id: 'microsoft/phi-4-reasoning', name: 'Phi 4 Reasoning', provider: 'github', tag: 'Free' },
  { id: 'mistral-ai/codestral-2501', name: 'Codestral', provider: 'github', tag: 'Free' },
  { id: 'mistral-ai/mistral-medium-2505', name: 'Mistral Medium 3', provider: 'github', tag: 'Free' },
  { id: 'mistral-ai/mistral-small-2503', name: 'Mistral Small 3.1', provider: 'github', tag: 'Fast' },
  { id: 'mistral-ai/ministral-3b', name: 'Ministral 3B', provider: 'github', tag: 'Fast' },
  { id: 'cohere/cohere-command-a', name: 'Command A', provider: 'github', tag: 'Fast' },
  { id: 'cohere/cohere-command-r-plus-08-2024', name: 'Command R+', provider: 'github', tag: 'Free' },
  { id: 'ai21-labs/ai21-jamba-1.5-large', name: 'Jamba 1.5 Large', provider: 'github', tag: 'Free' },
  // NVIDIA NIM
  { id: 'mistralai/mistral-medium-3.5-128b', name: 'Mistral Medium 3.5', provider: 'nvidia', tag: 'Free' },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', name: 'Nemotron Nano Omni 30B', provider: 'nvidia', tag: 'Free' },
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'nvidia', tag: 'Free' },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'nvidia', tag: 'Free' },
  { id: 'z-ai/glm-5.1', name: 'GLM 5.1', provider: 'nvidia', tag: 'Free' },
  { id: 'nvidia/ising-calibration-1-35b-a3b', name: 'Ising Calibration 35B', provider: 'nvidia', tag: 'Free' },
  { id: 'minimaxai/minimax-m2.7', name: 'MiniMax M2.7', provider: 'nvidia', tag: 'Free' },
  { id: 'mistralai/mistral-small-4-119b-2603', name: 'Mistral Small 4 119B', provider: 'nvidia', tag: 'Free' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 3 Super 120B', provider: 'nvidia', tag: 'Free' },
  { id: 'qwen/qwen3.5-122b-a10b', name: 'Qwen 3.5 122B', provider: 'nvidia', tag: 'Free' },
  // Hugging Face Router
  { id: 'deepseek-ai/DeepSeek-V4-Pro:novita', name: 'DeepSeek V4 Pro', provider: 'huggingface', tag: 'HF' },
  { id: 'moonshotai/Kimi-K2.6', name: 'Kimi K2.6', provider: 'huggingface', tag: 'HF' },
  { id: 'Qwen/Qwen3.6-35B-A3B', name: 'Qwen3.6 35B', provider: 'huggingface', tag: 'HF' },
  { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', provider: 'huggingface', tag: 'HF' },
  { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B', provider: 'huggingface', tag: 'HF' },
  { id: 'magnific/flux-dev', name: 'Magnific Flux Dev', provider: 'image', tag: 'Image' },
  { id: 'magnific/kling-v2-6-pro', name: 'Kling 2.6 Pro Video', provider: 'video', tag: 'Video' },
];

const PROVIDER_META: Record<string, { label: string; color: string; dot: string; logo: string }> = {
  cerebras:   { label: 'Cerebras',      color: '#f97316', dot: 'bg-orange-500', logo: 'https://logo.clearbit.com/cerebras.net' },
  openrouter: { label: 'OpenRouter',    color: '#10b981', dot: 'bg-emerald-500', logo: 'https://logo.clearbit.com/openrouter.ai' },
  google:     { label: 'Google Gemini', color: '#3b82f6', dot: 'bg-blue-500',    logo: 'https://logo.clearbit.com/google.com' },
  github:     { label: 'GitHub Models', color: '#a855f7', dot: 'bg-purple-500',  logo: 'https://logo.clearbit.com/github.com' },
  nvidia:     { label: 'NVIDIA NIM',    color: '#76b900', dot: 'bg-lime-500',    logo: 'https://logo.clearbit.com/nvidia.com' },
  huggingface:{ label: 'Hugging Face',   color: '#f59e0b', dot: 'bg-yellow-500',  logo: 'https://logo.clearbit.com/huggingface.co' },
  image:      { label: 'Image AI',       color: '#ec4899', dot: 'bg-pink-500',    logo: 'https://logo.clearbit.com/huggingface.co' },
  video:      { label: 'Video AI',       color: '#22d3ee', dot: 'bg-cyan-500',    logo: 'https://logo.clearbit.com/klingai.com' },
};

const TAG_STYLE: Record<string, string> = {
  Free:    'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50',
  Preview: 'text-violet-400 bg-violet-950/60 border border-violet-800/50',
  Fast:    'text-amber-400 bg-amber-950/60 border border-amber-800/50',
  HF:      'text-yellow-300 bg-yellow-950/60 border border-yellow-800/50',
  Image:   'text-pink-300 bg-pink-950/60 border border-pink-800/50',
};

const SUGGESTIONS = [
  { icon: '✦', text: 'Write a compelling blog intro' },
  { icon: '⌘', text: 'Write a Python web scraper' },
  { icon: '◈', text: 'Explain quantum computing' },
  { icon: '◇', text: 'Debug my JavaScript code' },
];

const PREMIUM_PROMPTS = [
  { icon: '⚡', title: 'Build faster', text: 'Buatkan struktur SaaS Next.js yang clean' },
  { icon: '🧩', title: 'Fix code', text: 'Cari bug dan rapikan kode ini' },
  { icon: '🎨', title: 'Design UI', text: 'Buat UI landing page modern dan premium' },
  { icon: '🚀', title: 'Launch copy', text: 'Buat copywriting promosi yang catchy' },
];

const PROVIDER_STATS = [
  { label: 'Providers', value: '5+' },
  { label: 'Models', value: `${MODELS.length}` },
  { label: 'Streaming', value: 'Live' },
];

const LS_KEY_CHATS    = 'iniaja_chats';
const LS_KEY_MODEL_ID = 'iniaja_model_id';

type Attachment = { name: string; size: number; type: string; url?: string; dataUrl?: string };
type Message = { role: 'user' | 'assistant'; content: string; timestamp: number; attachments?: Attachment[]; generatedImage?: string; generatedVideo?: string };
type Chat    = { id: string; title: string; messages: Message[]; model: typeof MODELS[0] };

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadChats(): Chat[] {
  try { const r = localStorage.getItem(LS_KEY_CHATS); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveChats(chats: Chat[]) {
  try { localStorage.setItem(LS_KEY_CHATS, JSON.stringify(chats)); } catch {}
}
function loadSavedModelId(): string | null {
  try { return localStorage.getItem(LS_KEY_MODEL_ID); } catch { return null; }
}
function saveModelId(id: string) {
  try { localStorage.setItem(LS_KEY_MODEL_ID, id); } catch {}
}

// ── Parse <think> blocks ──────────────────────────────────────────────────────
function parseThinking(content: string): { thinking: string | null; answer: string; isThinking: boolean } {
  const openTag  = content.indexOf('<think>');
  const closeTag = content.indexOf('</think>');

  if (openTag === -1) return { thinking: null, answer: content, isThinking: false };

  if (closeTag === -1) {
    // Still thinking — streaming in progress
    const thinking = content.slice(openTag + 7);
    return { thinking, answer: '', isThinking: true };
  }

  const thinking = content.slice(openTag + 7, closeTag).trim();
  const answer   = content.slice(closeTag + 8).trim();
  return { thinking, answer, isThinking: false };
}

// ── Thinking block component ──────────────────────────────────────────────────
function ThinkingBlock({ thinking, isThinking }: { thinking: string; isThinking: boolean }) {
  const [expanded, setExpanded] = useState(isThinking);

  useEffect(() => { if (isThinking) setExpanded(true); }, [isThinking]);

  const wordCount = thinking.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2.5 px-4 py-3 transition-all hover:bg-white/5 text-left"
      >
        <div className="relative w-4 h-4 flex-shrink-0">
          {isThinking ? (
            <svg className="w-4 h-4 think-pulse" style={{ color: 'rgba(139,92,246,0.8)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" style={{ color: 'rgba(139,92,246,0.6)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          )}
        </div>
        <span className="text-[12px] font-medium flex-1" style={{ color: 'rgba(139,92,246,0.8)' }}>
          {isThinking ? 'Thinking…' : `Thought for ${wordCount} words`}
        </span>
        <svg
          className="w-3.5 h-3.5 transition-transform flex-shrink-0"
          style={{ color: 'rgba(255,255,255,0.2)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-3 fade-in">
          <div className="h-px mb-3" style={{ background: 'rgba(139,92,246,0.15)' }} />
          <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {thinking}
            {isThinking && <span className="blink-cursor" />}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Syntax token colorizer ────────────────────────────────────────────────────
function tokenize(code: string, lang: string): React.ReactNode {
  if (!['js','jsx','ts','tsx','javascript','typescript','python','py','bash','sh','css','json','html'].includes(lang))
    return <span className="text-[#abb2bf]">{code}</span>;

  const keywords = lang.startsWith('py')
    ? /\b(def|class|import|from|return|if|else|elif|for|while|in|not|and|or|True|False|None|try|except|with|as|pass|raise|lambda|yield|async|await)\b/g
    : /\b(const|let|var|function|return|if|else|for|while|import|export|default|from|class|extends|new|this|async|await|try|catch|throw|typeof|instanceof|null|undefined|true|false|void|in|of|type|interface|enum)\b/g;

  const strings   = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
  const comments  = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/g;
  const numbers   = /\b(\d+\.?\d*)\b/g;
  const functions = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g;

  type Seg = { start: number; end: number; type: string; text: string };
  const segs: Seg[] = [];

  const collect = (re: RegExp, type: string) => {
    re.lastIndex = 0; let m;
    while ((m = re.exec(code)) !== null)
      segs.push({ start: m.index, end: m.index + m[0].length, type, text: m[0] });
  };

  collect(comments, 'comment');
  collect(strings,  'string');

  const occupied = (i: number) => segs.some(s => !['kw','num','fn'].includes(s.type) && i >= s.start && i < s.end);

  const collectSafe = (re: RegExp, type: string) => {
    re.lastIndex = 0; let m;
    while ((m = re.exec(code)) !== null)
      if (!occupied(m.index))
        segs.push({ start: m.index, end: m.index + m[0].length, type, text: m[0] });
  };

  collectSafe(keywords,  'kw');
  collectSafe(numbers,   'num');
  collectSafe(functions, 'fn');
  segs.sort((a, b) => a.start - b.start);

  const colorMap: Record<string, string> = {
    kw: '#c678dd', string: '#98c379', comment: '#5c6370', num: '#d19a66', fn: '#61afef',
  };

  const result: React.ReactNode[] = [];
  let pos = 0;
  for (const seg of segs) {
    if (seg.start < pos) continue;
    if (seg.start > pos) result.push(<span key={pos} className="text-[#abb2bf]">{code.slice(pos, seg.start)}</span>);
    result.push(<span key={seg.start} style={{ color: colorMap[seg.type] }}>{seg.text}</span>);
    pos = seg.end;
  }
  if (pos < code.length) result.push(<span key={pos} className="text-[#abb2bf]">{code.slice(pos)}</span>);
  return <>{result}</>;
}

// ── Code block ────────────────────────────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="my-4 rounded-2xl overflow-hidden w-full" style={{ background: '#1a1b26', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#13141f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-xs font-mono text-white/25 select-none">{lang || 'plain'}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs transition-all px-2.5 py-1 rounded-lg"
          style={{ color: copied ? '#10b981' : 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' }}
        >
          {copied
            ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          }
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-5 py-4 text-[13px] leading-[1.8] font-mono w-full">
        <code>{tokenize(code, lang || 'plain')}</code>
      </pre>
    </div>
  );
}

// ── Inline format ─────────────────────────────────────────────────────────────
function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index}><em>{m[2]}</em></strong>);
    else if (m[3]) parts.push(<strong key={m.index} className="text-white/95 font-semibold">{m[3]}</strong>);
    else if (m[4]) parts.push(<em key={m.index} className="text-white/60 italic">{m[4]}</em>);
    else if (m[5]) parts.push(
      <code key={m.index} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '1px 6px', fontFamily: 'monospace', fontSize: '0.88em', color: '#7dd3fc' }}>
        {m[5]}
      </code>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text: string, isStreaming = false): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim().toLowerCase();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      nodes.push(<CodeBlock key={`code-${i}`} code={codeLines.join('\n')} lang={lang} />);
      i++; continue;
    }

    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h1) { nodes.push(<h1 key={i} className="text-xl font-bold text-white mt-5 mb-2">{inlineFormat(h1[1])}</h1>); i++; continue; }
    if (h2) { nodes.push(<h2 key={i} className="text-lg font-semibold text-white/90 mt-4 mb-2">{inlineFormat(h2[1])}</h2>); i++; continue; }
    if (h3) { nodes.push(<h3 key={i} className="text-base font-semibold text-white/80 mt-3 mb-1.5">{inlineFormat(h3[1])}</h3>); i++; continue; }

    if (line.match(/^---+$/)) { nodes.push(<hr key={i} className="border-white/8 my-4" />); i++; continue; }

    if (line.startsWith('> ')) {
      nodes.push(
        <div key={i} className="flex gap-3 my-2">
          <div className="w-0.5 rounded-full bg-white/15 flex-shrink-0" />
          <p className="text-sm text-white/45 italic leading-relaxed">{inlineFormat(line.slice(2))}</p>
        </div>
      );
      i++; continue;
    }

    if (line.match(/^[-*•] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*•] /)) { items.push(lines[i].replace(/^[-*•] /, '')); i++; }
      nodes.push(
        <ul key={`ul-${i}`} className="my-2.5 space-y-1.5 pl-0">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-[14.5px] text-white/70 leading-relaxed">
              <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.3)' }} />
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(lines[i].replace(/^\d+\. /, '')); i++; }
      nodes.push(
        <ol key={`ol-${i}`} className="my-2.5 space-y-1.5 pl-0">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-[14.5px] text-white/70 leading-relaxed">
              <span className="mt-0.5 text-xs font-mono text-white/25 flex-shrink-0 w-5 text-right">{j + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === '') { nodes.push(<div key={`sp-${i}`} className="h-1.5" />); i++; continue; }

    // Last line + streaming → add blinking cursor
    const isLastLine = i === lines.length - 1;
    nodes.push(
      <p key={i} className="text-[14.5px] leading-[1.8] text-white/75">
        {inlineFormat(line)}
        {isStreaming && isLastLine && <span className="blink-cursor" />}
      </p>
    );
    i++;
  }
  return nodes;
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 120, 240].map(d => (
        <span key={d} className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: `${d}ms` }} />
      ))}
    </div>
  );
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Model option ──────────────────────────────────────────────────────────────
function ModelOption({ m, selected, onSelect }: { m: typeof MODELS[0]; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left"
      style={{
        background: selected ? 'rgba(139,92,246,0.12)' : 'transparent',
        border:     selected ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {PROVIDER_META[m.provider]?.logo
          ? <img src={PROVIDER_META[m.provider].logo} alt={PROVIDER_META[m.provider].label} className="w-4 h-4 rounded-full flex-shrink-0 object-contain bg-white/10" onError={(e: any) => { e.target.style.display='none'; }} />
          : <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PROVIDER_META[m.provider]?.dot ?? 'bg-white/20'}`} />
        }
        <span className="text-[13px] truncate" style={{ color: selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)' }}>{m.name}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${TAG_STYLE[m.tag] ?? ''}`}>{m.tag}</span>
        {selected && (
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

// ── Keyboard shortcut toast ───────────────────────────────────────────────────
function ShortcutToast({ label }: { label: string }) {
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-xl text-sm font-medium fade-in"
      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}
    >
      {label}
    </div>
  );
}


// ── Premium ambient background ───────────────────────────────────────────────
function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,.18), transparent 34%), radial-gradient(circle at 78% 18%, rgba(14,165,233,.16), transparent 28%), radial-gradient(circle at 18% 75%, rgba(168,85,247,.12), transparent 32%), #070710' }} />
      <div className="premium-grid absolute inset-0" />
      <div className="premium-noise absolute inset-0" />
      <div className="cinematic-stars absolute -inset-24 opacity-70" />
      <div className="cinematic-beam absolute left-[-18%] top-[26%] h-28 w-[145%] blur-xl" />
      <div className="cinematic-beam absolute left-[-28%] top-[48%] h-20 w-[150%] blur-2xl" style={{ animationDelay: '-4s', opacity: .55 }} />
      <div className="aurora-blob absolute -top-28 left-[10%] h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(124,58,237,0.30)' }} />
      <div className="aurora-blob absolute top-12 right-[6%] h-96 w-96 rounded-full blur-3xl" style={{ background: 'rgba(14,165,233,0.20)', animationDelay: '-3s' }} />
      <div className="aurora-blob absolute bottom-[-150px] left-[30%] h-[30rem] w-[30rem] rounded-full blur-3xl" style={{ background: 'rgba(168,85,247,0.16)', animationDelay: '-6s' }} />
      <div className="cinematic-orb absolute right-[7%] top-[17%] h-28 w-28 rounded-full" style={{ background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,.72), rgba(96,165,250,.60) 18%, rgba(37,99,235,.30) 45%, rgba(15,23,42,.05) 72%)', boxShadow: '0 0 70px rgba(96,165,250,.32)' }} />
      <div className="cinematic-orb absolute left-[30%] top-[24%] h-12 w-12 rounded-full blur-[1px]" style={{ background: 'radial-gradient(circle, rgba(168,85,247,.75), rgba(76,29,149,.18) 70%)', boxShadow: '0 0 45px rgba(168,85,247,.45)', animationDelay: '-2s' }} />
      <div className="absolute inset-x-0 top-0 h-48" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.055), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-64" style={{ background: 'linear-gradient(0deg, rgba(7,7,16,.9), transparent)' }} />
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [chats, setChats]               = useState<Chat[]>(() => loadChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput]               = useState('');
  const [model, setModel]               = useState<typeof MODELS[0]>(() => {
    const savedId = loadSavedModelId();
    return MODELS.find(m => m.id === savedId) ?? MODELS[0];
  });
  const [loading, setLoading]           = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [modelSearch, setModelSearch]   = useState('');
  const [copiedIdx, setCopiedIdx]       = useState<number | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  // Track which message is currently streaming
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 24 });

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const sidebarSearchRef = useRef<HTMLInputElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const mainRef     = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages   = activeChat?.messages || [];

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setSpotlight({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  // ── Persist ──
  useEffect(() => { saveChats(chats); }, [chats]);
  useEffect(() => { saveModelId(model.id); }, [model]);

  // ── Auto-scroll ──
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom || loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Scroll button ──
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 180);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // ── Close sidebar on mobile when chat selected ──
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false);
  }, [activeChatId]);

  // ── Textarea auto-resize ──
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
  }, [input]);

  // ── Model search focus ──
  useEffect(() => {
    if (showModelMenu) setTimeout(() => searchRef.current?.focus(), 50);
    else setModelSearch('');
  }, [showModelMenu]);

  // ── Shortcut toast auto-hide ──
  useEffect(() => {
    if (!shortcutToast) return;
    const t = setTimeout(() => setShortcutToast(null), 1200);
    return () => clearTimeout(t);
  }, [shortcutToast]);

  // ── ⌨️ Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      // Ctrl+K → new chat
      if (e.key === 'k') {
        e.preventDefault();
        newChat();
        setShortcutToast('⌘K — New Chat');
        textareaRef.current?.focus();
      }
      // Ctrl+B → toggle sidebar
      if (e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(s => !s);
        setShortcutToast('⌘B — Toggle Sidebar');
      }
      // Ctrl+/ → focus input
      if (e.key === '/') {
        e.preventDefault();
        textareaRef.current?.focus();
        setShortcutToast('⌘/ — Focus Input');
      }
      // Ctrl+F → focus sidebar search
      if (e.key === 'f' && sidebarOpen) {
        e.preventDefault();
        sidebarSearchRef.current?.focus();
        setShortcutToast('⌘F — Search Chats');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOpen]);

  function newChat() { setActiveChatId(null); setInput(''); setAttachments([]); }

  function copyMsg(content: string, idx: number) {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function stopGeneration() { abortRef.current?.abort(); }

  function formatFileSize(size: number) {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fileToDataUrl(file: File): Promise<string | undefined> {
    if (!file.type.startsWith('image/')) return Promise.resolve(undefined);
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, 4);
    const mapped = await Promise.all(selected.map(async file => ({
      name: file.name,
      size: file.size,
      type: file.type || 'file',
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      dataUrl: await fileToDataUrl(file),
    })));
    setAttachments(prev => [...prev, ...mapped].slice(0, 4));
    setShortcutToast('Attachment added');
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  function getImageDataUrls(files: Attachment[]) {
    return files
      .filter(file => file.type.startsWith('image/') && file.dataUrl)
      .map(file => file.dataUrl as string);
  }

  function findLastImageForVideo(messages: Message[]) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.generatedImage) return msg.generatedImage;
      const attachedImage = msg.attachments?.find(file => file.type.startsWith('image/') && file.dataUrl);
      if (attachedImage?.dataUrl) return attachedImage.dataUrl;
    }
    return '';
  }

  async function generateImage(prompt: string, chatId: string, baseMessages: Message[]) {
    const res = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: model.id,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal generate gambar.');

    const aiMsg: Message = {
      role: 'assistant',
      content: `✅ Gambar berhasil dibuat dengan ${model.name}.`,
      timestamp: Date.now(),
      generatedImage: data.image,
    };

    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: [...baseMessages, aiMsg] } : c
    ));
  }

  async function generateVideo(prompt: string, chatId: string, baseMessages: Message[]) {
    const image = findLastImageForVideo(baseMessages);

    if (!image) {
      throw new Error('Untuk video Kling, upload gambar dulu atau generate image dulu, baru klik Video.');
    }

    const res = await fetch('/api/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image,
        duration: '5',
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data?.detail?.message || JSON.stringify(data?.detail || data) || 'Gagal generate video.');

    const aiMsg: Message = {
      role: 'assistant',
      content: `✅ Video berhasil dibuat dengan ${model.name}.`,
      timestamp: Date.now(),
      generatedVideo: data.video,
      generatedImage: image,
    };

    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: [...baseMessages, aiMsg] } : c
    ));
  }

  // ── 🔄 Regenerate last assistant message ──
  const regenerate = useCallback(async () => {
    if (loading || !activeChat) return;
    const msgs = activeChat.messages;

    // Find last user message
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1) return;

    const historyUpToUser = msgs.slice(0, lastUserIdx + 1);
    const chatId = activeChat.id;

    // Remove all messages after lastUserIdx (old assistant response)
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: historyUpToUser } : c
    ));
    setError(null);
    setLoading(true);

    if (model.provider === 'image' || model.provider === 'video') {
      try {
        const prompt = historyUpToUser[lastUserIdx]?.content || '';
        if (model.provider === 'video') await generateVideo(prompt, chatId, historyUpToUser);
        else await generateImage(prompt, chatId, historyUpToUser);
      } catch (err: any) {
        setError(err.message || 'Terjadi error.');
        setChats(prev => prev.map(c =>
          c.id === chatId ? { ...c, messages: [...historyUpToUser, { role: 'assistant', content: `⚠️ ${err.message}`, timestamp: Date.now() }] } : c
        ));
      } finally {
        setLoading(false);
        setStreamingIdx(null);
        abortRef.current = null;
      }
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: historyUpToUser.map(({ role, content }) => ({ role, content })),
          model:    model.id,
          provider: model.provider,
          images:   getImageDataUrls(historyUpToUser[lastUserIdx]?.attachments ?? []),
        }),
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      const aiTs = Date.now();
      const aiMsgIdx = historyUpToUser.length;

      setStreamingIdx(aiMsgIdx);
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, messages: [...historyUpToUser, { role: 'assistant', content: '', timestamp: aiTs }] } : c
      ));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        setChats(prev => prev.map(c =>
          c.id === chatId ? { ...c, messages: [...historyUpToUser, { role: 'assistant', content: aiText, timestamp: aiTs }] } : c
        ));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Terjadi error.');
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, messages: [...c.messages, { role: 'assistant', content: `⚠️ ${err.message}`, timestamp: Date.now() }] } : c
      ));
    } finally {
      setLoading(false);
      setStreamingIdx(null);
      abortRef.current = null;
    }
  }, [loading, activeChat, model]);

  const sendMessage = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if ((!text && attachments.length === 0) || loading) return;
    const sentAttachments = attachments;
    const imageNames = sentAttachments.filter(a => a.type.startsWith('image/')).map(a => a.name);
    const attachmentNote = sentAttachments.length
      ? `\n\n${imageNames.length ? `Gambar terlampir: ${imageNames.join(', ')}` : `File terlampir: ${sentAttachments.map(a => a.name).join(', ')}`}`
      : '';
    const finalText = text || (imageNames.length ? 'Tolong lihat gambar ini.' : 'Analyze the attached file.');

    let chatId = activeChatId;
    let currentChats = chats;
    const userMsg: Message = { role: 'user', content: finalText + attachmentNote, timestamp: Date.now(), attachments: sentAttachments };

    if (!chatId) {
      const id = Date.now().toString();
      const newC: Chat = { id, title: finalText.slice(0, 50), messages: [], model };
      currentChats = [newC, ...chats];
      setChats(currentChats);
      setActiveChatId(id);
      chatId = id;
    }

    const newMsgs = [...(currentChats.find(c => c.id === chatId)?.messages ?? []), userMsg];
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: newMsgs } : c));
    setInput('');
    setAttachments([]);
    setError(null);
    setLoading(true);

    if (model.provider === 'image' || model.provider === 'video') {
      try {
        if (model.provider === 'video') await generateVideo(finalText, chatId, newMsgs);
        else await generateImage(finalText, chatId, newMsgs);
      } catch (err: any) {
        setError(err.message || 'Terjadi error.');
        setChats(prev => prev.map(c =>
          c.id === chatId ? { ...c, messages: [...newMsgs, { role: 'assistant', content: `⚠️ ${err.message}`, timestamp: Date.now() }] } : c
        ));
      } finally {
        setLoading(false);
        setStreamingIdx(null);
        abortRef.current = null;
      }
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMsgs.map(({ role, content }) => ({ role, content })),
          model:    model.id,
          provider: model.provider,
          images:   getImageDataUrls(sentAttachments),
        }),
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Request failed'); }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      const aiTs = Date.now();
      const aiMsgIdx = newMsgs.length;

      setStreamingIdx(aiMsgIdx);
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, messages: [...newMsgs, { role: 'assistant', content: '', timestamp: aiTs }] } : c
      ));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        setChats(prev => prev.map(c =>
          c.id === chatId ? { ...c, messages: [...newMsgs, { role: 'assistant', content: aiText, timestamp: aiTs }] } : c
        ));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Terjadi error.');
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, messages: [...newMsgs, { role: 'assistant', content: `⚠️ ${err.message}`, timestamp: Date.now() }] } : c
      ));
    } finally {
      setLoading(false);
      setStreamingIdx(null);
      abortRef.current = null;
    }
  }, [input, loading, activeChatId, chats, model]);

  function deleteChat(id: string) {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // ── Filtered chats (sidebar search) ──
  const filteredChats = sidebarSearch
    ? chats.filter(c =>
        c.title.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(sidebarSearch.toLowerCase()))
      )
    : chats;

  const filteredModels = modelSearch
    ? MODELS.filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase()) || PROVIDER_META[m.provider]?.label.toLowerCase().includes(modelSearch.toLowerCase()))
    : MODELS;

  // ── Character count ──
  const charCount = input.length;

  return (
    <div className="relative flex h-dvh overflow-hidden" style={{ background: '#070710', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{ANIM_STYLE}</style>
      <AmbientBackground />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${spotlight.x}% ${spotlight.y}%, rgba(99,102,241,.18), rgba(34,211,238,.07) 26%, transparent 58%)`,
        }}
      />

      {/* ── Shortcut toast ── */}
      {shortcutToast && <ShortcutToast label={shortcutToast} />}

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 md:hidden fade-in"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Model picker modal ── */}
      {showModelMenu && (
        <>
          <div
            className="fixed inset-0 z-[100] fade-in"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowModelMenu(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[110] rounded-t-3xl fade-in"
            style={{ background: '#141420', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 -8px 64px rgba(0,0,0,0.9)' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
            </div>
            <div className="flex items-center justify-between px-4 pt-2 pb-3">
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Select Model</p>
              <button onClick={() => setShowModelMenu(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <svg className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  value={modelSearch}
                  onChange={e => setModelSearch(e.target.value)}
                  placeholder="Search models…"
                  className="bg-transparent outline-none w-full text-[14px]"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                />
                {modelSearch && (
                  <button onClick={() => setModelSearch('')} style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto px-2 pb-10" style={{ maxHeight: '52vh' }}>
              {filteredModels.length === 0
                ? <p className="text-sm text-center py-10" style={{ color: 'rgba(255,255,255,0.2)' }}>No results</p>
                : filteredModels.map(m => (
                    <ModelOption key={m.id} m={m} selected={model.id === m.id} onSelect={() => { setModel(m); setShowModelMenu(false); }} />
                  ))
              }
            </div>
          </div>
        </>
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="lux-border flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300 fixed md:relative z-20 h-full"
        style={{ width: sidebarOpen ? 320 : 0, background: 'rgba(8,8,18,.72)', borderRight: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(26px)', boxShadow: '24px 0 90px rgba(0,0,0,.28)' }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.02em' }}>NEXA AI</span>
          </div>
          <button
            onClick={newChat}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <svg className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 🔍 Sidebar search */}
        <div className="px-2 pt-2 pb-1 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={sidebarSearchRef}
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              placeholder="Search chats…"
              className="bg-transparent outline-none w-full text-[12px]"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            />
            {sidebarSearch && (
              <button onClick={() => setSidebarSearch('')} style={{ color: 'rgba(255,255,255,0.25)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
                {sidebarSearch ? 'No results' : 'No conversations yet'}
              </p>
            </div>
          ) : filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all"
              style={{
                background: activeChatId === chat.id ? 'rgba(124,58,237,0.12)' : 'transparent',
                border:     activeChatId === chat.id ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
              }}
            >
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-[13px] truncate leading-snug" style={{ color: activeChatId === chat.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)' }}>
                  {chat.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {PROVIDER_META[chat.model.provider]?.logo
                    ? <img src={PROVIDER_META[chat.model.provider].logo} alt={PROVIDER_META[chat.model.provider].label} className="w-3 h-3 rounded-full flex-shrink-0 object-contain bg-white/10" onError={(e: any) => { e.target.style.display='none'; }} />
                    : <div className={`w-1 h-1 rounded-full flex-shrink-0 ${PROVIDER_META[chat.model.provider]?.dot}`} />
                  }
                  <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.2)' }}>{chat.model.name}</p>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                style={{ color: 'rgba(248,113,113,0.6)' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar footer — shortcuts hint */}
        <div className="p-3 flex-shrink-0 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Shortcuts hint */}
          <div className="flex items-center gap-2 px-2 flex-wrap">
            {[['⌘K', 'New'], ['⌘B', 'Sidebar'], ['⌘/', 'Focus']].map(([key, label]) => (
              <div key={key} className="flex items-center gap-1">
                <kbd className="text-[10px] px-1.5 py-0.5 rounded-md font-mono" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>{key}</kbd>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }} />
            <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>My Workspace</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 w-full">

        {/* Header */}
        <header className="lux-border flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,15,0.62)', backdropFilter: 'blur(24px)', boxShadow: '0 18px 80px rgba(0,0,0,0.22)' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(s => !s)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5">
              <svg className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(s => !s)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {PROVIDER_META[model.provider]?.logo
                  ? <img src={PROVIDER_META[model.provider].logo} alt={PROVIDER_META[model.provider].label} className="w-4 h-4 rounded-full flex-shrink-0 object-contain bg-white/10" onError={(e: any) => { e.target.style.display='none'; }} />
                  : <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PROVIDER_META[model.provider]?.dot}`} />
                }
                <span className="text-[13px] font-medium max-w-[120px] truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>{model.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium hidden sm:inline ${TAG_STYLE[model.tag]}`}>{model.tag}</span>
                <svg className={`w-3 h-3 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} style={{ color: 'rgba(255,255,255,0.25)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          <button
            onClick={newChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-[13px]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </header>

        {/* Messages */}
        <main ref={mainRef} className="flex-1 overflow-y-auto relative">
          {showScrollBtn && (
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="fixed bottom-28 right-5 z-30 w-9 h-9 rounded-full flex items-center justify-center fade-in transition-all hover:scale-110"
              style={{ background: 'rgba(124,58,237,0.85)', boxShadow: '0 4px 20px rgba(124,58,237,0.45)', border: '1px solid rgba(139,92,246,0.4)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}

          <div className="max-w-[1080px] mx-auto px-4 md:px-6 pt-4">
            {error && (
              <div
                className="mb-4 flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm fade-in"
                style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(254,202,202,0.95)' }}
              >
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>

          <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-4">
            {messages.length === 0 ? (
              /* ── Cinematic dashboard empty state ── */
              <div className="min-h-[78vh] py-8 md:py-10">
                <div className="mx-auto w-full max-w-[1080px]">
                  <div className="relative text-center px-2">
                    <div className="absolute left-[10%] top-10 hidden h-16 w-16 rounded-full blur-[1px] md:block" style={{ background: 'radial-gradient(circle at 34% 30%, rgba(255,255,255,.45), rgba(168,85,247,.58) 24%, rgba(76,29,149,.12) 72%)', boxShadow: '0 0 58px rgba(168,85,247,.42)' }} />
                    <div className="absolute right-[2%] top-4 hidden h-28 w-28 rounded-full md:block" style={{ background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,.65), rgba(96,165,250,.62) 20%, rgba(37,99,235,.28) 50%, rgba(15,23,42,.04) 74%)', boxShadow: '0 0 80px rgba(59,130,246,.35)' }} />

                    <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 50px rgba(124,58,237,.10)' }}>
                      <span className="text-sm">✦</span>
                      <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.62)' }}>Your AI Assistant is Ready</span>
                    </div>

                    <h1 className="mx-auto max-w-3xl text-[34px] sm:text-5xl md:text-6xl font-semibold" style={{ letterSpacing: '-0.065em', lineHeight: 1.02 }}>
                      <span style={{ color: 'rgba(255,255,255,0.94)' }}>What can I help </span>
                      <span style={{ background: 'linear-gradient(90deg,#60a5fa,#8b5cf6,#d946ef)', WebkitBackgroundClip: 'text', color: 'transparent' }}>you with today?</span>
                    </h1>
                    <p className="mt-4 text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.54)' }}>
                      Powered by the best AI models. Fast, smart, and reliable.
                    </p>

                    <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {[
                        { icon: '💻', title: 'Code', text: 'Write, debug & explain code instantly' },
                        { icon: '🎨', title: 'Design', text: 'Create UI, logos & beautiful designs' },
                        { icon: '🧠', title: 'Explain', text: 'Explain anything in simple terms' },
                        { icon: '🚀', title: 'Write', text: 'Write posts, emails & marketing copy' },
                      ].map((item) => (
                        <button
                          key={item.title}
                          onClick={() => sendMessage(item.text)}
                          className="premium-card-hover group rounded-3xl p-4 text-left transition-all duration-300"
                          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.035))', border: '1px solid rgba(255,255,255,.10)', boxShadow: '0 16px 70px rgba(0,0,0,.22)' }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="mb-2 text-lg">{item.icon}</div>
                              <div className="text-[15px] font-semibold" style={{ color: 'rgba(255,255,255,.88)' }}>{item.title}</div>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-2xl transition-all group-hover:translate-x-1" style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.56)' }}>›</div>
                          </div>
                          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,.55)' }}>{item.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <div className="max-w-[560px] rounded-3xl px-5 py-4 text-left" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,.95), rgba(67,56,202,.92))', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 20px 70px rgba(124,58,237,.26)' }}>
                      <p className="text-[14px] leading-relaxed text-white">Buatkan landing page untuk AI SaaS tool</p>
                      <div className="mt-1 text-right text-[11px] text-white/45">10:45 AM ✓✓</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-4">
                    <div className="mt-5 hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl md:flex" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,.9), rgba(79,70,229,.8))', border: '1px solid rgba(255,255,255,.18)', boxShadow: '0 0 35px rgba(124,58,237,.45)' }}>
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="lux-border flex-1 rounded-[2rem] p-5 text-left" style={{ background: 'rgba(12,12,26,.72)', border: '1px solid rgba(255,255,255,.10)', backdropFilter: 'blur(24px)', boxShadow: '0 28px 120px rgba(0,0,0,.38)' }}>
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: 'rgba(255,255,255,.9)' }}>NEXA AI</span>
                          <span className="rounded-full px-2 py-1 text-[10px]" style={{ background: 'rgba(118,185,0,.10)', color: '#a3e635', border: '1px solid rgba(163,230,53,.18)' }}>NVIDIA · GLM 5.1</span>
                        </div>
                        <div className="hidden items-center gap-3 text-white/35 sm:flex">
                          <span>⧉</span><span>♡</span><span>☰</span>
                        </div>
                      </div>

                      <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,.72)' }}>
                        Berikut adalah contoh landing page untuk AI SaaS tool modern dan responsive.
                      </p>

                      <div className="mt-5 overflow-hidden rounded-3xl" style={{ background: '#060818', border: '1px solid rgba(255,255,255,.12)', boxShadow: 'inset 0 0 90px rgba(59,130,246,.08)' }}>
                        <div className="flex items-center justify-between px-5 py-4 text-xs">
                          <div className="flex items-center gap-2 font-semibold text-white"><span>✦</span> NEXA AI</div>
                          <div className="hidden items-center gap-7 text-white/50 sm:flex"><span>Features</span><span>Pricing</span><span>Docs</span><span>Changelog</span></div>
                          <button className="rounded-xl px-3 py-2 text-[11px] font-semibold text-white" style={{ background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)' }}>Get Started</button>
                        </div>
                        <div className="relative px-6 pb-7 pt-5 text-center sm:px-10 sm:pb-10 sm:pt-8">
                          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 72% 60%, rgba(59,130,246,.28), transparent 24%), radial-gradient(circle at 35% 70%, rgba(124,58,237,.18), transparent 32%)' }} />
                          <div className="relative mx-auto max-w-lg">
                            <h2 className="text-3xl font-bold sm:text-5xl" style={{ letterSpacing: '-0.055em', lineHeight: 1.02 }}>
                              <span className="text-white">Build Anything</span><br />
                              <span style={{ background: 'linear-gradient(90deg,#fff,#8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>with AI.</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-white/50">The next-generation AI platform for developers, designers, and innovators.</p>
                            <div className="mt-7 flex items-center justify-center gap-3">
                              <button className="rounded-xl px-4 py-2 text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#a855f7,#4f46e5)' }}>Get Started</button>
                              <button className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white/75">View Demo</button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-right text-[11px]" style={{ color: 'rgba(255,255,255,.28)' }}>10:46 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Messages ── */
              <div className="space-y-7">
                {messages.map((m, i) => {
                  const isStreamingThis = streamingIdx === i && loading;
                  const { thinking, answer, isThinking } = m.role === 'assistant'
                    ? parseThinking(m.content)
                    : { thinking: null, answer: m.content, isThinking: false };

                  return (
                    <div key={i} className="group msg-anim" style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}>
                      {m.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className="max-w-[78%]">
                            <div className="px-3 py-3 rounded-2xl rounded-br-sm" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
                              {m.attachments?.length ? (
                                <div className="mb-3 grid gap-2">
                                  {m.attachments.map((file, idx) => (
                                    file.dataUrl || file.url ? (
                                      <div key={idx} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                                        <img src={file.dataUrl || file.url} alt={file.name} className="max-h-72 w-full object-cover" />
                                        <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-white/55">
                                          <span className="truncate">{file.name}</span>
                                          <span>{formatFileSize(file.size)}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div key={idx} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
                                        <span>📎</span>
                                        <span className="truncate">{file.name}</span>
                                      </div>
                                    )
                                  ))}
                                </div>
                              ) : null}
                              <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.82)' }}>{m.content}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{fmtTime(m.timestamp)}</span>
                              <button onClick={() => copyMsg(m.content, i)} className="flex items-center gap-1 text-[11px] transition-all" style={{ color: copiedIdx === i ? '#10b981' : 'rgba(255,255,255,0.2)' }}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {copiedIdx === i ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                            <svg className={`w-3.5 h-3.5 text-white ${isStreamingThis ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            {/* 💭 Thinking block */}
                            {thinking !== null && (
                              <ThinkingBlock thinking={thinking} isThinking={isThinking} />
                            )}

                            {/* Answer */}
                            {m.content && !isThinking
                              ? answer
                                ? renderMarkdown(answer, isStreamingThis)
                                : null
                              : !m.content
                                ? <TypingDots />
                                : null
                            }

                            {m.generatedImage && (
                              <div className="mt-3 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                                <img src={m.generatedImage} alt="Generated image" className="w-full max-w-xl object-contain" />
                                <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-white/45">
                                  <span>Generated image</span>
                                  <a href={m.generatedImage} download="magnific-flux-dev.png" className="text-pink-300 hover:text-pink-200">Download</a>
                                </div>
                              </div>
                            )}

                            {m.generatedVideo && (
                              <div className="mt-3 overflow-hidden rounded-3xl border border-cyan-400/20 bg-black/30">
                                <video src={m.generatedVideo} controls playsInline className="w-full max-w-xl bg-black" />
                                <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-white/45">
                                  <span>Generated video</span>
                                  <a href={m.generatedVideo} download="kling-video.mp4" className="text-cyan-300 hover:text-cyan-200">Download</a>
                                </div>
                              </div>
                            )}

                            {/* Still thinking — no answer yet */}
                            {isThinking && !answer && <TypingDots />}

                            {/* Actions */}
                            {m.content && !isStreamingThis && (
                              <div className="flex items-center gap-3 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{fmtTime(m.timestamp)}</span>
                                <button onClick={() => copyMsg(answer || m.content, i)} className="flex items-center gap-1 text-[11px] transition-all" style={{ color: copiedIdx === i ? '#10b981' : 'rgba(255,255,255,0.2)' }}>
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  {copiedIdx === i ? 'Copied!' : 'Copy'}
                                </button>
                                {/* 🔄 Regenerate — only on last assistant message */}
                                {i === messages.length - 1 && (
                                  <button
                                    onClick={regenerate}
                                    className="flex items-center gap-1 text-[11px] transition-all"
                                    style={{ color: 'rgba(255,255,255,0.2)' }}
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Regenerate
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3 msg-anim">
                    <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                      <svg className="w-3.5 h-3.5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="flex items-center"><TypingDots /></div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>

        {/* Input footer — NEXA style */}
        <footer className="relative z-10 px-3 pb-4 pt-2 flex-shrink-0 sm:px-4 sm:pb-6" style={{ background: 'linear-gradient(180deg, transparent, rgba(3,5,18,0.94) 24%)' }}>
          <div className="mx-auto max-w-[1120px]">
            <div
              className="lux-border relative overflow-hidden rounded-[28px] transition-all sm:rounded-[30px]"
              style={{
                background: 'linear-gradient(180deg, rgba(20,22,45,.88), rgba(12,13,31,.92))',
                border: input.trim() ? '1px solid rgba(139,92,246,0.38)' : '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(26px)',
                boxShadow: input.trim()
                  ? '0 24px 90px rgba(124,58,237,0.20), inset 0 1px 0 rgba(255,255,255,.08)'
                  : '0 24px 90px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,.06)',
              }}
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/35 to-transparent" />
              {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto px-4 pt-4">
                  {attachments.map((file, index) => (
                    <div key={index} className="group relative flex min-w-[150px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] p-2.5">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-violet-500/15 text-lg">
                        {file.url ? <img src={file.url} alt={file.name} className="h-full w-full object-cover" /> : '📎'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white/80">{file.name}</p>
                        <p className="text-[10px] text-white/35">{formatFileSize(file.size)}</p>
                      </div>
                      <button onClick={() => removeAttachment(index)} className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/70 text-xs text-white/70 opacity-100 transition hover:bg-red-500/80 hover:text-white">×</button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder={model.provider === 'image' ? 'Describe image yang mau dibuat...' : model.provider === 'video' ? 'Describe gerakan video Kling dari gambar...' : 'Ask anything...'}
                rows={1}
                className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none disabled:opacity-40 sm:text-[15.5px]"
                style={{
                  padding: attachments.length ? '14px 18px 64px 18px' : '18px 18px 64px 18px',
                  color: 'rgba(255,255,255,0.88)',
                  maxHeight: 180,
                }}
              />

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 px-3 pb-3 sm:px-4 sm:pb-4">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.md,.doc,.docx,.js,.ts,.tsx,.json"
                    className="hidden"
                    onChange={e => handleFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.78)' }}
                    title="Add file"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="hidden h-10 items-center gap-2 rounded-2xl px-3 text-[13px] transition-all hover:scale-[1.02] sm:flex"
                    style={{ background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.72)' }}
                    title="Search"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                    </svg>
                    Search
                  </button>

                  <button
                    type="button"
                    className="hidden h-10 items-center gap-2 rounded-2xl px-3 text-[13px] transition-all hover:scale-[1.02] sm:flex"
                    style={{ background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.72)' }}
                    title="Code"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const imgModel = MODELS.find(m => m.provider === 'image');
                      if (imgModel) { setModel(imgModel); saveModelId(imgModel.id); }
                      setInput(prev => prev || 'A cinematic futuristic robot in neon city, ultra detailed');
                      textareaRef.current?.focus();
                    }}
                    className="hidden h-10 items-center gap-2 rounded-2xl px-3 text-[13px] transition-all hover:scale-[1.02] sm:flex"
                    style={{ background: model.provider === 'image' ? 'rgba(236,72,153,.16)' : 'rgba(255,255,255,.045)', border: model.provider === 'image' ? '1px solid rgba(236,72,153,.28)' : '1px solid rgba(255,255,255,.08)', color: model.provider === 'image' ? 'rgba(249,168,212,.95)' : 'rgba(255,255,255,.72)' }}
                    title="Image"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14m-16 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const vidModel = MODELS.find(m => m.provider === 'video');
                      if (vidModel) { setModel(vidModel); saveModelId(vidModel.id); }
                      setInput(prev => prev || 'cinematic slow zoom, natural motion, smooth camera movement');
                      textareaRef.current?.focus();
                    }}
                    className="hidden h-10 items-center gap-2 rounded-2xl px-3 text-[13px] transition-all hover:scale-[1.02] sm:flex"
                    style={{ background: model.provider === 'video' ? 'rgba(34,211,238,.16)' : 'rgba(255,255,255,.045)', border: model.provider === 'video' ? '1px solid rgba(34,211,238,.28)' : '1px solid rgba(255,255,255,.08)', color: model.provider === 'video' ? 'rgba(165,243,252,.95)' : 'rgba(255,255,255,.72)' }}
                    title="Video"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                    Video
                  </button>
                </div>

                <div className="pointer-events-none hidden flex-1 items-center justify-center text-center text-[12px] text-white/28 md:flex">
                  Press Enter to send, Shift + Enter for new line
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden text-[12px] text-white/32 sm:inline">{Math.min(charCount, 4000)} / 4000</span>
                  <button
                    type="button"
                    className="hidden h-10 w-10 items-center justify-center rounded-2xl transition-all hover:scale-105 sm:flex"
                    style={{ background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.72)' }}
                    title="Enhance"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18 8l.45 1.58L20 10l-1.55.42L18 12l-.45-1.58L16 10l1.55-.42L18 8z" />
                    </svg>
                  </button>

                  {loading ? (
                    <button
                      onClick={stopGeneration}
                      className="flex h-10 items-center gap-2 rounded-2xl px-4 text-[13px] font-semibold transition-all"
                      style={{ background: 'rgba(239,68,68,0.13)', border: '1px solid rgba(239,68,68,0.26)', color: 'rgba(248,113,113,0.95)' }}
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() && attachments.length === 0}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all hover:scale-105 disabled:hover:scale-100 sm:h-11 sm:w-11"
                      style={{
                        background: (input.trim() || attachments.length) ? 'linear-gradient(135deg,#8b5cf6,#4f46e5)' : 'rgba(255,255,255,0.055)',
                        boxShadow: (input.trim() || attachments.length) ? '0 8px 28px rgba(124,58,237,0.46)' : 'none',
                      }}
                    >
                      <svg className="h-4 w-4" style={{ color: (input.trim() || attachments.length) ? '#fff' : 'rgba(255,255,255,0.26)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-7 14-2-6-5-1z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-white/25">AI can make mistakes. Please verify important information.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
