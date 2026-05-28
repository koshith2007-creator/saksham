"use client";

import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    timestamp: new Date().toISOString(),
    content: "Welcome to **SAKSHAM AI Assistant**!\n\nI can help you with:\n- Understanding repository architecture\n- Explaining vulnerabilities in detail\n- Generating security fixes\n- Security best practices guidance\n- Setup and configuration help\n\nTry asking me something like:\n- *\"Where is authentication implemented?\"*\n- *\"Explain the SQL injection in queries.py\"*\n- *\"How do I fix the SSRF vulnerability?\"*",
  },
];

const demoResponses: Record<string, string> = {
  default: "I've analyzed your query against the repository context. Based on the codebase architecture and security scan results, here's my analysis:\n\n**Key Findings:**\n- The application uses a layered architecture with clear separation between controllers, services, and data access layers\n- Authentication is handled via JWT tokens in the middleware layer\n- Several endpoints lack proper input validation\n\n**Recommendations:**\n1. Implement input validation middleware for all user-facing endpoints\n2. Add rate limiting to authentication endpoints\n3. Review the data access layer for parameterized queries\n\nWould you like me to dive deeper into any of these areas?",
  sql: "## SQL Injection Analysis\n\nThe SQL injection vulnerability in `src/db/queries.py:45` is **critically exploitable**.\n\n**Vulnerable Code:**\n```python\nquery = f\"SELECT * FROM users WHERE id = {user_id}\"\n```\n\n**Why it's dangerous:**\nThe `user_id` parameter comes directly from the HTTP request without any sanitization. An attacker can inject: `1 OR 1=1; DROP TABLE users;--`\n\n**Secure Fix:**\n```python\nquery = \"SELECT * FROM users WHERE id = %s\"\ncursor.execute(query, (user_id,))\n```\n\nThis uses parameterized queries which prevent SQL injection by treating user input as data, not executable SQL.",
  auth: "## Authentication Architecture\n\n**Location:** `src/auth/` directory\n\n**Components:**\n1. `token.py` - JWT token generation and validation\n2. `middleware.py` - Request authentication middleware\n3. `password.py` - Password hashing (currently uses weak MD5)\n\n**Flow:**\n1. User submits credentials to `/api/auth/login`\n2. Server validates against database\n3. JWT token generated with 24h expiry\n4. Token sent in `Authorization: Bearer` header\n\n**Issues Found:**\n- JWT verification disabled (`verify_signature: False`)\n- Weak password hashing (MD5 instead of bcrypt)\n- No refresh token mechanism",
};

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
    .replace(/^- (.*$)/gm, '<div class="flex gap-2 ml-1"><span>•</span><span>$1</span></div>')
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
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMsg]);

    const query = input.toLowerCase();
    setInput("");
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    let response = demoResponses.default;
    if (query.includes("sql") || query.includes("injection")) {
      response = demoResponses.sql;
    } else if (query.includes("auth") || query.includes("login") || query.includes("jwt")) {
      response = demoResponses.auth;
    }

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, botMsg]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-500" /> AI Assistant</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Ask anything about your repositories and security</p>
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
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
