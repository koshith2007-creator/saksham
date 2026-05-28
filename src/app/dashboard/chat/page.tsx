"use client";

import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    timestamp: new Date().toISOString(),
    content:
      "Ask a security question and I will answer using the configured AI providers. Gemini is tried first; Hugging Face is used as backup if Gemini fails.",
  },
];

function formatMessage(content: string): string {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-[hsl(var(--secondary))] text-xs font-mono">$1</code>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="p-3 mt-2 mb-2 rounded-lg bg-[hsl(var(--secondary))] overflow-x-auto"><code class="text-xs font-mono">$2</code></pre>')
    .replace(/^## (.*$)/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
    .replace(/^- (.*$)/gm, '<div class="flex gap-2 ml-1"><span>-</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.*$)/gm, '<div class="flex gap-2 ml-1"><span class="font-semibold">$1.</span><span>$2</span></div>');
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage(trimmed);
      setMessages((current) => [
        ...current,
        {
          id: response.id,
          role: "assistant",
          content: response.content,
          timestamp: response.timestamp,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: error instanceof Error ? `AI service error: ${error.message}` : "AI service error",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" /> AI Assistant
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Gemini primary, Hugging Face backup</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-emerald-500/10 border border-emerald-500/20 rounded-tr-sm"
                  : "bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-tl-sm"
              }`}
            >
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: formatMessage(msg.content),
                }}
              />
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--secondary))] flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-tl-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about vulnerabilities, architecture, or security..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="p-2 rounded-xl gradient-bg text-white hover:opacity-90 transition-all disabled:opacity-30"
          type="button"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
