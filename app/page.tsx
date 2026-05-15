'use client';
import { useState, useRef, useEffect } from 'react';

const MODELS = [
  // Cerebras
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B', provider: 'cerebras' },
  { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B', provider: 'cerebras' },
  { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'cerebras' },
  { id: 'zai-glm-4.7', name: 'GLM 4.7', provider: 'cerebras' },

  // OpenRouter
  { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash', provider: 'openrouter' },
  { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5', provider: 'openrouter' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 Super', provider: 'openrouter' },
  { id: 'inclusionai/ring-2.6-1t:free', name: 'Ring 2.6 1T', provider: 'openrouter' },
];

type Message = { role: 'user' | 'assistant'; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

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
        { role: 'assistant', content: `Error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-neutral-100">
      
      {/* Top Bar */}
      <header className="border-b border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-900 transition text-sm font-medium"
            >
              <span>{model.name}</span>
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showModelMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowModelMenu(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-30 overflow-hidden">
                  
                  <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-800">
                    Cerebras
                  </div>
                  {MODELS.filter(m => m.provider === 'cerebras').map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m); setShowModelMenu(false); }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-neutral-800 transition flex items-center justify-between ${model.id === m.id ? 'bg-neutral-800' : ''}`}
                    >
                      <span className="text-sm">{m.name}</span>
                      {model.id === m.id && (
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}

                  <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-t border-neutral-800">
                    OpenRouter
                  </div>
                  {MODELS.filter(m => m.provider === 'openrouter').map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m); setShowModelMenu(false); }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-neutral-800 transition flex items-center justify-between ${model.id === m.id ? 'bg-neutral-800' : ''}`}
                    >
                      <span className="text-sm">{m.name}</span>
                      {model.id === m.id && (
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Clear Button */}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-sm text-neutral-400 hover:text-neutral-100 transition px-3 py-1.5 rounded-lg hover:bg-neutral-900"
            >
              New chat
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <h1 className="text-3xl font-semibold text-neutral-200 mb-2">
                What can I help with?
              </h1>
              <p className="text-neutral-500">
                Using {model.name}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={i} className="group">
                  {m.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-neutral-800 px-4 py-3 rounded-2xl rounded-br-md">
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-xs font-semibold">
                        AI
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-200">
                          {m.content || <span className="inline-block w-2 h-4 bg-neutral-400 animate-pulse" />}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-xs font-semibold">
                    AI
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-neutral-800 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative flex items-end gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 focus-within:border-neutral-700 transition">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Message AI..."
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 outline-none resize-none text-[15px] placeholder:text-neutral-500 disabled:opacity-50 max-h-[200px]"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-9 h-9 bg-white text-black rounded-lg hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-neutral-600 text-center mt-2">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </footer>
    </div>
  );
}
