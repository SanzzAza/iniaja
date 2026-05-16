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
  { id: 'meta/meta-llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'github', tag: 'Fast' },
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
];

const PROVIDER_META: Record<string, { label: string; color: string; dot: string }> = {
  cerebras:   { label: 'Cerebras',      color: '#f97316', dot: 'bg-orange-500' },
  openrouter: { label: 'OpenRouter',    color: '#10b981', dot: 'bg-emerald-500' },
  google:     { label: 'Google Gemini', color: '#3b82f6', dot: 'bg-blue-500' },
  github:     { label: 'GitHub Models', color: '#a855f7', dot: 'bg-purple-500' },
};

const TAG_STYLE: Record<string, string> = {
  Free:    'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50',
  Preview: 'text-violet-400 bg-violet-950/60 border border-violet-800/50',
  Fast:    'text-amber-400 bg-amber-950/60 border border-amber-800/50',
};

const SUGGESTIONS = [
  { icon: '✦', text: 'Write a compelling blog intro' },
  { icon: '⌘', text: 'Write a Python web scraper' },
  { icon: '◈', text: 'Explain quantum computing' },
  { icon: '◇', text: 'Debug my JavaScript code' },
];

const LS_KEY_CHATS    = 'iniaja_chats';
const LS_KEY_MODEL_ID = 'iniaja_model_id';

type Message = { role: 'user' | 'assistant'; content: string; timestamp: number };
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
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PROVIDER_META[m.provider]?.dot ?? 'bg-white/20'}`} />
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

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const sidebarSearchRef = useRef<HTMLInputElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const mainRef     = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages   = activeChat?.messages || [];

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

  function newChat() { setActiveChatId(null); setInput(''); }

  function copyMsg(content: string, idx: number) {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function stopGeneration() { abortRef.current?.abort(); }

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
    setLoading(true);

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
    if (!text || loading) return;

    let chatId = activeChatId;
    let currentChats = chats;
    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };

    if (!chatId) {
      const id = Date.now().toString();
      const newC: Chat = { id, title: text.slice(0, 50), messages: [], model };
      currentChats = [newC, ...chats];
      setChats(currentChats);
      setActiveChatId(id);
      chatId = id;
    }

    const newMsgs = [...(currentChats.find(c => c.id === chatId)?.messages ?? []), userMsg];
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: newMsgs } : c));
    setInput('');
    setLoading(true);

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
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0f', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{ANIM_STYLE}</style>

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
        className="flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300 fixed md:relative z-20 h-full"
        style={{ width: sidebarOpen ? 260 : 0, background: '#0f0f17', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.02em' }}>Iniaja AI</span>
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
                  <div className={`w-1 h-1 rounded-full flex-shrink-0 ${PROVIDER_META[chat.model.provider]?.dot}`} />
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
      <div className="flex-1 flex flex-col min-w-0 w-full">

        {/* Header */}
        <header className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)' }}>
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
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PROVIDER_META[model.provider]?.dot}`} />
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

          <div className="max-w-[700px] mx-auto px-5 py-8">
            {messages.length === 0 ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="relative mb-7">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.15))', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <svg className="w-8 h-8" style={{ color: 'rgba(139,92,246,0.9)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ background: '#10b981', borderColor: '#0a0a0f' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.03em' }}>What can I help with?</h1>
                <p className="text-sm mb-9" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Using <span style={{ color: PROVIDER_META[model.provider]?.color ?? 'rgba(255,255,255,0.4)' }}>{model.name}</span>
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {SUGGESTIONS.map(({ icon, text }) => (
                    <button
                      key={text}
                      onClick={() => sendMessage(text)}
                      className="px-4 py-3.5 rounded-2xl text-left transition-all hover:border-white/15"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <span className="block text-sm mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{icon}</span>
                      <span className="block text-[13px] leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>{text}</span>
                    </button>
                  ))}
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
                            <div className="px-4 py-3 rounded-2xl rounded-br-sm" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
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

        {/* Input footer */}
        <footer className="px-4 pb-5 pt-2 flex-shrink-0" style={{ background: '#0a0a0f' }}>
          <div className="max-w-[700px] mx-auto">
            <div className="relative transition-all" style={{ background: '#13131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder={`Message ${model.name}…`}
                rows={1}
                className="w-full bg-transparent outline-none resize-none text-[14.5px] leading-relaxed disabled:opacity-40"
                style={{ padding: '14px 52px 44px 18px', color: 'rgba(255,255,255,0.82)', maxHeight: 180 }}
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
                {/* ── Char counter ── */}
                <span className="text-[11px]" style={{ color: charCount > 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)' }}>
                  {charCount > 0 ? `${charCount} chars` : '↵ send · ⇧↵ newline'}
                </span>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <button
                      onClick={stopGeneration}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(248,113,113,0.9)' }}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim()}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        background:  input.trim() ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.05)',
                        boxShadow:   input.trim() ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
                      }}
                    >
                      <svg className="w-3.5 h-3.5" style={{ color: input.trim() ? '#fff' : 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
