'use client';
import { useState, useRef, useEffect } from 'react';

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

  // GitHub Models
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'github', tag: 'Free' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'github', tag: 'Fast' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', provider: 'github', tag: 'Fast' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'github', tag: 'Free' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'github', tag: 'Free' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'github', tag: 'Fast' },
  { id: 'openai/o4-mini', name: 'o4 Mini', provider: 'github', tag: 'Free' },
  { id: 'deepseek/DeepSeek-V3-0324', name: 'DeepSeek V3', provider: 'github', tag: 'Free' },
  { id: 'deepseek/DeepSeek-R1', name: 'DeepSeek R1', provider: 'github', tag: 'Free' },
  { id: 'meta/Llama-4-Scout-17B-16E-Instruct', name: 'Llama 4 Scout', provider: 'github', tag: 'Free' },
  { id: 'meta/Llama-4-Maverick-17B-128E-Instruct-FP8', name: 'Llama 4 Maverick', provider: 'github', tag: 'Free' },
  { id: 'meta/Meta-Llama-3.1-405B-Instruct', name: 'Llama 3.1 405B', provider: 'github', tag: 'Free' },
  { id: 'microsoft/Phi-4', name: 'Phi 4', provider: 'github', tag: 'Free' },
  { id: 'mistral-ai/Mistral-Large-2411', name: 'Mistral Large', provider: 'github', tag: 'Free' },
  { id: 'mistral-ai/Codestral-2501', name: 'Codestral', provider: 'github', tag: 'Free' },
  { id: 'xai/grok-3', name: 'Grok 3', provider: 'github', tag: 'Free' },
  { id: 'xai/grok-3-mini', name: 'Grok 3 Mini', provider: 'github', tag: 'Fast' },
];

type Message = { role: 'user' | 'assistant'; content: string };
type Chat = { id: string; title: string; messages: Message[]; model: typeof MODELS[0] };

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  function newChat() {
    setActiveChatId(null);
    setInput('');
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    let chatId = activeChatId;
    let currentChats = chats;
    const userMsg: Message = { role: 'user', content: input };

    if (!chatId) {
      const newId = Date.now().toString();
      const newChatObj: Chat = {
        id: newId,
        title: input.slice(0, 40),
        messages: [],
        model,
      };
      currentChats = [newChatObj, ...chats];
      setChats(currentChats);
      setActiveChatId(newId);
      chatId = newId;
    }

    const newMessages = [
      ...(currentChats.find(c => c.id === chatId)?.messages || []),
      userMsg,
    ];

    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: newMessages } : c
    ));
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
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
      let aiMessage = '';

      setChats(prev => prev.map(c =>
        c.id === chatId
          ? { ...c, messages: [...newMessages, { role: 'assistant', content: '' }] }
          : c
      ));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiMessage += decoder.decode(value, { stream: true });
        setChats(prev => prev.map(c =>
          c.id === chatId
            ? { ...c, messages: [...newMessages, { role: 'assistant', content: aiMessage }] }
            : c
        ));
      }
    } catch (error: any) {
      setChats(prev => prev.map(c =>
        c.id === chatId
          ? { ...c, messages: [...newMessages, { role: 'assistant', content: `Error: ${error.message}` }] }
          : c
      ));
    } finally {
      setLoading(false);
    }
  }

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

  function providerColor(provider: string) {
    if (provider === 'cerebras') return 'bg-orange-400';
    if (provider === 'google') return 'bg-blue-400';
    if (provider === 'github') return 'bg-purple-400';
    return 'bg-green-400';
  }

  function tagColor(tag: string) {
    if (tag === 'Free') return 'bg-green-500/10 text-green-400';
    if (tag === 'Preview') return 'bg-purple-500/10 text-purple-400';
    return 'bg-orange-500/10 text-orange-400';
  }

  const providers = [
    { key: 'cerebras', label: 'Cerebras' },
    { key: 'openrouter', label: 'OpenRouter' },
    { key: 'google', label: 'Google Gemini' },
    { key: 'github', label: 'GitHub Models' },
  ];

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-[#141414] border-r border-white/5 flex flex-col overflow-hidden`}>
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <span className="font-semibold text-sm text-white/80">AI Chat</span>
          <button
            onClick={newChat}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 ? (
            <p className="text-xs text-white/30 text-center mt-8 px-4">No conversations yet</p>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                  activeChatId === chat.id ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{chat.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">{chat.model.name}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-red-500/20 text-red-400 flex items-center justify-center transition flex-shrink-0 ml-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-white/5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0" />
            <span className="text-xs text-white/50 truncate">My AI Workspace</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg hover:bg-white/5 transition flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Model Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition"
              >
                <div className={`w-2 h-2 rounded-full ${providerColor(model.provider)}`} />
                <span className="text-sm font-medium text-white/80">{model.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${tagColor(model.tag)}`}>
                  {model.tag}
                </span>
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModelMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowModelMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-30 overflow-hidden max-h-[70vh] overflow-y-auto">
                    <div className="p-2">
                      {providers.map((prov, pi) => (
                        <div key={prov.key}>
                          {pi > 0 && <div className="my-1.5 border-t border-white/5" />}
                          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-2 py-1.5">
                            {prov.label}
                          </p>
                          {MODELS.filter(m => m.provider === prov.key).map(m => (
                            <button
                              key={m.id}
                              onClick={() => { setModel(m); setShowModelMenu(false); }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition ${model.id === m.id ? 'bg-white/8' : ''}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${providerColor(m.provider)}`} />
                                <span className="text-sm text-white/80">{m.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${tagColor(m.tag)}`}>
                                  {m.tag}
                                </span>
                                {model.id === m.id && (
                                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            onClick={newChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white/60 hover:text-white/80"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[55vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-white/80 mb-2">What can I help with?</h1>
                <p className="text-sm text-white/30">Using {model.name}</p>

                <div className="grid grid-cols-2 gap-2 mt-8 w-full max-w-md">
                  {[
                    'Explain quantum computing',
                    'Write a Python script',
                    'Summarize a topic',
                    'Debug my code',
                  ].map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 text-sm text-white/50 hover:text-white/70 transition text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((m, i) => (
                  <div key={i}>
                    {m.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] px-4 py-3 bg-white/8 border border-white/8 rounded-2xl rounded-br-sm">
                          <p className="text-[15px] leading-relaxed text-white/85 whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5">
                          AI
                        </div>
                        <div className="flex-1 pt-0.5">
                          {m.content ? (
                            <p className="text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap">{m.content}</p>
                          ) : (
                            <div className="flex items-center gap-1 h-6">
                              <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {loading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-[11px] font-bold">
                      AI
                    </div>
                    <div className="flex items-center gap-1 h-8">
                      <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>

        {/* Input */}
        <footer className="px-4 pb-6 pt-2 bg-[#0f0f0f]">
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-end gap-3 bg-[#1a1a1a] border border-white/8 rounded-2xl p-3 focus-within:border-white/15 transition shadow-xl shadow-black/20">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={`Message ${model.name}...`}
                rows={1}
                className="flex-1 bg-transparent px-2 py-1.5 outline-none resize-none text-[15px] text-white/85 placeholder:text-white/25 disabled:opacity-50 max-h-[160px] leading-relaxed"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 disabled:from-white/5 disabled:to-white/5 disabled:cursor-not-allowed transition flex items-center justify-center shadow-lg"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-white/20 text-center mt-3">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
