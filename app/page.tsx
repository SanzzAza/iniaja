'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const MODELS = [
  // Cerebras
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B', provider: 'cerebras', tag: 'Fast' },
  { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B', provider: 'cerebras', tag: 'Preview' },
  { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'cerebras', tag: 'Fast' },
  { id: 'zai-glm-4.7', name: 'GLM 4.7', provider: 'cerebras', tag: 'Fast' },

  // OpenRouter
  { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash', provider: 'openrouter', tag: 'Free' },
  { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5', provider: 'openrouter', tag: 'Free' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 Super', provider: 'openrouter', tag: 'Free' },
  { id: 'inclusionai/ring-2.6-1t:free', name: 'Ring 2.6 1T', provider: 'openrouter', tag: 'Free' },

  // Google Gemini
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'google', tag: 'Preview' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', provider: 'google', tag: 'Preview' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'google', tag: 'Preview' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', tag: 'Free' },

  // GitHub Models - OpenAI
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

  // GitHub Models - DeepSeek
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'github', tag: 'Free' },
  { id: 'deepseek/deepseek-r1-0528', name: 'DeepSeek R1 0528', provider: 'github', tag: 'Free' },
  { id: 'deepseek/deepseek-v3-0324', name: 'DeepSeek V3', provider: 'github', tag: 'Free' },

  // GitHub Models - Meta Llama
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'github', tag: 'Free' },
  { id: 'meta/llama-4-maverick-17b-128e-instruct-fp8', name: 'Llama 4 Maverick', provider: 'github', tag: 'Free' },
  { id: 'meta/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'github', tag: 'Free' },
  { id: 'meta/meta-llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'github', tag: 'Free' },
  { id: 'meta/meta-llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'github', tag: 'Fast' },

  // GitHub Models - xAI Grok
  { id: 'xai/grok-3', name: 'Grok 3', provider: 'github', tag: 'Free' },
  { id: 'xai/grok-3-mini', name: 'Grok 3 Mini', provider: 'github', tag: 'Fast' },

  // GitHub Models - Microsoft
  { id: 'microsoft/mai-ds-r1', name: 'MAI-DS R1', provider: 'github', tag: 'Free' },
  { id: 'microsoft/phi-4', name: 'Phi 4', provider: 'github', tag: 'Free' },
  { id: 'microsoft/phi-4-mini-instruct', name: 'Phi 4 Mini', provider: 'github', tag: 'Fast' },
  { id: 'microsoft/phi-4-reasoning', name: 'Phi 4 Reasoning', provider: 'github', tag: 'Free' },

  // GitHub Models - Mistral
  { id: 'mistral-ai/codestral-2501', name: 'Codestral', provider: 'github', tag: 'Free' },
  { id: 'mistral-ai/mistral-medium-2505', name: 'Mistral Medium 3', provider: 'github', tag: 'Free' },
  { id: 'mistral-ai/mistral-small-2503', name: 'Mistral Small 3.1', provider: 'github', tag: 'Fast' },
  { id: 'mistral-ai/ministral-3b', name: 'Ministral 3B', provider: 'github', tag: 'Fast' },

  // GitHub Models - Cohere
  { id: 'cohere/cohere-command-a', name: 'Command A', provider: 'github', tag: 'Fast' },
  { id: 'cohere/cohere-command-r-plus-08-2024', name: 'Command R+', provider: 'github', tag: 'Free' },

  // GitHub Models - AI21
  { id: 'ai21-labs/ai21-jamba-1.5-large', name: 'Jamba 1.5 Large', provider: 'github', tag: 'Free' },
];

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};
type Chat = { id: string; title: string; messages: Message[]; model: typeof MODELS[0] };

// ─── Minimal Markdown Renderer ───────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <CodeBlock key={i} code={codeLines.join('\n')} lang={lang} />
      );
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1) { result.push(<h1 key={i} className="text-xl font-bold text-white/90 mt-4 mb-2">{inlineFormat(h1[1])}</h1>); i++; continue; }
    if (h2) { result.push(<h2 key={i} className="text-lg font-semibold text-white/85 mt-3 mb-1.5">{inlineFormat(h2[1])}</h2>); i++; continue; }
    if (h3) { result.push(<h3 key={i} className="text-base font-semibold text-white/80 mt-2 mb-1">{inlineFormat(h3[1])}</h3>); i++; continue; }

    // Unordered list
    if (line.match(/^[-*•] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*•] /)) {
        items.push(lines[i].replace(/^[-*•] /, ''));
        i++;
      }
      result.push(
        <ul key={i} className="my-2 space-y-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-white/75 text-[14.5px] leading-relaxed">
              <span className="mt-[7px] w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
        num++;
      }
      result.push(
        <ol key={i} className="my-2 space-y-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-white/75 text-[14.5px] leading-relaxed">
              <span className="text-white/30 text-xs font-mono mt-0.5 w-4 flex-shrink-0">{j + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      result.push(
        <blockquote key={i} className="border-l-2 border-white/20 pl-3 my-2 text-white/50 italic text-sm">
          {inlineFormat(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      result.push(<hr key={i} className="border-white/10 my-3" />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      result.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Regular paragraph
    result.push(
      <p key={i} className="text-[14.5px] leading-[1.75] text-white/80">
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return result;
}

function inlineFormat(text: string): React.ReactNode {
  // Bold+italic, bold, italic, inline code
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index}><em>{match[2]}</em></strong>);
    else if (match[3]) parts.push(<strong key={match.index} className="text-white/95 font-semibold">{match[3]}</strong>);
    else if (match[4]) parts.push(<em key={match.index} className="text-white/70">{match[4]}</em>);
    else if (match[5]) parts.push(
      <code key={match.index} className="px-1.5 py-0.5 rounded-md bg-white/8 border border-white/8 font-mono text-[12.5px] text-emerald-300/90">
        {match[5]}
      </code>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/8 bg-[#111]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/8 bg-white/3">
        <span className="text-xs font-mono text-white/30">{lang || 'text'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] font-mono text-white/75 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Typing dots ─────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 h-5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Time formatter ───────────────────────────────────────────────────────────
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Provider metadata ────────────────────────────────────────────────────────
const PROVIDER_META: Record<string, { label: string; dot: string; accent: string }> = {
  cerebras:   { label: 'Cerebras',       dot: 'bg-orange-400',  accent: 'text-orange-400' },
  openrouter: { label: 'OpenRouter',     dot: 'bg-green-400',   accent: 'text-green-400' },
  google:     { label: 'Google Gemini',  dot: 'bg-blue-400',    accent: 'text-blue-400' },
  github:     { label: 'GitHub Models', dot: 'bg-purple-400',  accent: 'text-purple-400' },
};

const TAG_STYLES: Record<string, string> = {
  Free:    'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  Preview: 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20',
  Fast:    'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
};

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTED = [
  { icon: '⚡', text: 'Explain quantum computing simply' },
  { icon: '🐍', text: 'Write a Python web scraper' },
  { icon: '🔍', text: 'Debug this JavaScript error' },
  { icon: '✍️', text: 'Write a compelling blog intro' },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelSearch, setModelSearch] = useState('');
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSearchRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  // Focus model search when menu opens
  useEffect(() => {
    if (showModelMenu) setTimeout(() => modelSearchRef.current?.focus(), 50);
    else setModelSearch('');
  }, [showModelMenu]);

  function newChat() {
    setActiveChatId(null);
    setInput('');
  }

  function copyMessage(content: string, idx: number) {
    navigator.clipboard.writeText(content);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  }

  const sendMessage = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || loading) return;

    let chatId = activeChatId;
    let currentChats = chats;
    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };

    if (!chatId) {
      const newId = Date.now().toString();
      const newChatObj: Chat = { id: newId, title: text.slice(0, 42), messages: [], model };
      currentChats = [newChatObj, ...chats];
      setChats(currentChats);
      setActiveChatId(newId);
      chatId = newId;
    }

    const newMessages = [
      ...(currentChats.find(c => c.id === chatId)?.messages || []),
      userMsg,
    ];

    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: newMessages } : c));
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          model: model.id,
          provider: model.provider,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      const aiTs = Date.now();

      setChats(prev => prev.map(c =>
        c.id === chatId
          ? { ...c, messages: [...newMessages, { role: 'assistant', content: '', timestamp: aiTs }] }
          : c
      ));

      let lastChunk = '';
      let repeatCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        if (chunk === lastChunk && chunk.length > 10) {
          repeatCount++;
          if (repeatCount > 5) break;
        } else { repeatCount = 0; }
        lastChunk = chunk;

        aiText += chunk;
        setChats(prev => prev.map(c =>
          c.id === chatId
            ? { ...c, messages: [...newMessages, { role: 'assistant', content: aiText, timestamp: aiTs }] }
            : c
        ));
      }
    } catch (error: any) {
      const errMsg = `⚠️ ${error.message}`;
      setChats(prev => prev.map(c =>
        c.id === chatId
          ? { ...c, messages: [...newMessages, { role: 'assistant', content: errMsg, timestamp: Date.now() }] }
          : c
      ));
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeChatId, chats, model]);

  function deleteChat(id: string) {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const filteredModels = modelSearch
    ? MODELS.filter(m =>
        m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        (PROVIDER_META[m.provider]?.label ?? m.provider).toLowerCase().includes(modelSearch.toLowerCase())
      )
    : MODELS;

  const providers = Object.keys(PROVIDER_META);

  return (
    <div className="flex h-screen bg-[#0c0c0c] text-white overflow-hidden font-sans">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out flex-shrink-0 bg-[#111] border-r border-white/[0.06] flex flex-col overflow-hidden`}
      >
        {/* Sidebar header */}
        <div className="p-3 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white/70 tracking-tight">Iniaja AI</span>
          </div>
          <button
            onClick={newChat}
            title="New chat"
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition flex items-center justify-center text-white/40 hover:text-white/70"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <div className="w-8 h-8 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xs text-white/20 text-center">No conversations yet</p>
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  activeChatId === chat.id
                    ? 'bg-white/8 border border-white/8'
                    : 'hover:bg-white/4 border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-[13px] text-white/70 truncate leading-snug">{chat.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PROVIDER_META[chat.model.provider]?.dot ?? 'bg-white/20'}`} />
                    <p className="text-[11px] text-white/25 truncate">{chat.model.name}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md hover:bg-red-500/15 text-red-400/60 hover:text-red-400 flex items-center justify-center transition flex-shrink-0"
                  title="Delete chat"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-white/4">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex-shrink-0" />
            <span className="text-xs text-white/30 truncate">My Workspace</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
          </div>
        </div>
      </aside>

      {/* ── Main panel ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06] bg-[#0c0c0c]/80 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg hover:bg-white/5 transition flex items-center justify-center text-white/30 hover:text-white/60"
              title="Toggle sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 transition"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PROVIDER_META[model.provider]?.dot ?? 'bg-white/30'}`} />
                <span className="text-[13px] font-medium text-white/75">{model.name}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${TAG_STYLES[model.tag] ?? ''}`}>
                  {model.tag}
                </span>
                <svg className={`w-3 h-3 text-white/30 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModelMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowModelMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 w-80 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-30 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-white/8">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                        <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          ref={modelSearchRef}
                          value={modelSearch}
                          onChange={e => setModelSearch(e.target.value)}
                          placeholder="Search models..."
                          className="bg-transparent outline-none text-sm text-white/70 placeholder:text-white/25 w-full"
                        />
                        {modelSearch && (
                          <button onClick={() => setModelSearch('')} className="text-white/25 hover:text-white/50 transition">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Model list */}
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                      {modelSearch ? (
                        filteredModels.length === 0 ? (
                          <p className="text-xs text-white/25 text-center py-6">No models found</p>
                        ) : (
                          filteredModels.map(m => (
                            <ModelOption key={m.id} m={m} selected={model.id === m.id} onSelect={() => { setModel(m); setShowModelMenu(false); }} />
                          ))
                        )
                      ) : (
                        providers.map((prov, pi) => {
                          const group = MODELS.filter(m => m.provider === prov);
                          if (!group.length) return null;
                          return (
                            <div key={prov}>
                              {pi > 0 && <div className="my-1.5 border-t border-white/5" />}
                              <p className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 ${PROVIDER_META[prov]?.accent ?? 'text-white/30'}`}>
                                {PROVIDER_META[prov]?.label ?? prov}
                              </p>
                              {group.map(m => (
                                <ModelOption key={m.id} m={m} selected={model.id === m.id} onSelect={() => { setModel(m); setShowModelMenu(false); }} />
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* New chat button */}
          <button
            onClick={newChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 transition text-[13px] text-white/40 hover:text-white/70"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </header>

        {/* ── Messages ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/15 flex items-center justify-center">
                    <svg className="w-8 h-8 text-violet-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/80 border-2 border-[#0c0c0c] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>

                <h1 className="text-2xl font-semibold text-white/75 mb-1 tracking-tight">What can I help with?</h1>
                <p className="text-sm text-white/30 mb-8">
                  Chatting with <span className={`font-medium ${PROVIDER_META[model.provider]?.accent ?? 'text-white/50'}`}>{model.name}</span>
                </p>

                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {SUGGESTED.map(({ icon, text }) => (
                    <button
                      key={text}
                      onClick={() => { setInput(text); textareaRef.current?.focus(); }}
                      className="px-3 py-3 rounded-xl bg-white/4 hover:bg-white/7 border border-white/5 hover:border-white/10 text-left transition-all group"
                    >
                      <span className="text-lg leading-none block mb-1">{icon}</span>
                      <span className="text-[13px] text-white/40 group-hover:text-white/60 transition leading-snug">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message thread */
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <div key={i} className="group">
                    {m.role === 'user' ? (
                      <div className="flex justify-end gap-2">
                        <div className="flex flex-col items-end gap-1 max-w-[82%]">
                          <div className="px-4 py-3 bg-white/7 border border-white/8 rounded-2xl rounded-br-sm">
                            <p className="text-[14.5px] leading-relaxed text-white/80 whitespace-pre-wrap">{m.content}</p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            <span className="text-[11px] text-white/20">{formatTime(m.timestamp)}</span>
                            <button
                              onClick={() => copyMessage(m.content, i)}
                              className="text-[11px] text-white/20 hover:text-white/50 transition flex items-center gap-1"
                            >
                              {copiedMsgIdx === i ? (
                                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        {/* AI avatar */}
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex-shrink-0 flex items-center justify-center mt-0.5">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          {m.content ? (
                            <div className="prose-content">
                              {renderMarkdown(m.content)}
                            </div>
                          ) : (
                            <TypingDots />
                          )}

                          {/* AI message footer */}
                          {m.content && (
                            <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition">
                              <span className="text-[11px] text-white/20">{formatTime(m.timestamp)}</span>
                              <button
                                onClick={() => copyMessage(m.content, i)}
                                className="flex items-center gap-1 text-[11px] text-white/20 hover:text-white/50 transition"
                              >
                                {copiedMsgIdx === i ? (
                                  <>
                                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Standalone loading indicator (when last msg is user) */}
                {loading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="flex items-center">
                      <TypingDots />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>

        {/* ── Input area ────────────────────────────────────────────────── */}
        <footer className="px-4 pb-5 pt-2 bg-[#0c0c0c] flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="relative bg-[#161616] border border-white/8 rounded-2xl transition-all focus-within:border-white/15 focus-within:shadow-lg focus-within:shadow-violet-500/5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={`Message ${model.name}…`}
                rows={1}
                className="w-full bg-transparent px-4 pt-3.5 pb-12 outline-none resize-none text-[14.5px] text-white/80 placeholder:text-white/20 disabled:opacity-40 max-h-[160px] leading-relaxed"
              />

              {/* Bottom bar inside input */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
                <span className="text-[11px] text-white/15">
                  ↵ send · ⇧↵ newline
                </span>
                <div className="flex items-center gap-2">
                  {loading && (
                    <span className="text-[11px] text-white/25 animate-pulse">Generating…</span>
                  )}
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      input.trim() && !loading
                        ? 'bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 shadow-lg shadow-violet-500/20'
                        : 'bg-white/5 cursor-not-allowed'
                    }`}
                  >
                    <svg
                      className={`w-3.5 h-3.5 ${input.trim() && !loading ? 'text-white' : 'text-white/20'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Model option component ───────────────────────────────────────────────────
function ModelOption({
  m,
  selected,
  onSelect,
}: {
  m: typeof MODELS[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left ${
        selected ? 'bg-violet-500/10 border border-violet-500/20' : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PROVIDER_META[m.provider]?.dot ?? 'bg-white/20'}`} />
        <span className={`text-[13px] truncate ${selected ? 'text-white/90' : 'text-white/65'}`}>{m.name}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${TAG_STYLES[m.tag] ?? ''}`}>
          {m.tag}
        </span>
        {selected && (
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}
