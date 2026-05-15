'use client';
import { useState, useRef, useEffect } from 'react';

const MODELS = [
  // ⚡ Cerebras (Verified)
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B', provider: 'cerebras', icon: '⚡' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'cerebras', icon: '⚡' },
  { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'cerebras', icon: '⚡' },
  { id: 'llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick', provider: 'cerebras', icon: '⚡' },
  { id: 'qwen-3-32b', name: 'Qwen 3 32B', provider: 'cerebras', icon: '⚡' },
  { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B', provider: 'cerebras', icon: '⚡' },
  { id: 'qwen-3-coder-480b', name: 'Qwen 3 Coder 480B', provider: 'cerebras', icon: '⚡' },
  { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'cerebras', icon: '⚡' },
  { id: 'zai-glm-4.6', name: 'GLM 4.6', provider: 'cerebras', icon: '⚡' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill', provider: 'cerebras', icon: '⚡' },

  // 🌐 OpenRouter (Free)
  { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek V3.1', provider: 'openrouter', icon: '🐋' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', provider: 'openrouter', icon: '🦙' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', provider: 'openrouter', icon: '✨' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', provider: 'openrouter', icon: '🤖' },
];

type Message = { role: 'user' | 'assistant'; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
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

      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiMessage += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: 'assistant', content: aiMessage }]);
      }
    } catch (error: any) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `❌ Error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-3xl mx-auto p-4 flex flex-col h-screen">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">🤖 My AI Chat</h1>
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Model Selector */}
        <select
          value={model.id}
          onChange={(e) => {
            const found = MODELS.find((m) => m.id === e.target.value);
            if (found) setModel(found);
          }}
          className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <optgroup label="⚡ Cerebras (Fast)">
            {MODELS.filter((m) => m.provider === 'cerebras').map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="🌐 OpenRouter (Free)">
            {MODELS.filter((m) => m.provider === 'openrouter').map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-4xl mb-3">💬</p>
              <p>Mulai chat dengan {model.name}</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-600 rounded-br-sm'
                    : 'bg-gray-700 rounded-bl-sm'
                }`}
              >
                {m.content || <span className="opacity-50">...</span>}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-gray-700 p-3 rounded-2xl rounded-bl-sm">
                <span className="animate-pulse">⏳ Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
            placeholder="Tanya apa aja..."
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition"
          >
            {loading ? '...' : 'Kirim'}
          </button>
        </div>
      </div>
    </div>
  );
}
