"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generates a lightweight client-side session id (UUID v4) */
function genSessionId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "bot",
      text: "Hello! I'm Alex, a technical assistant at Futura. Feel free to ask me about our facade panels, lead times, or request a sample kit - I'm here to help! 🏗️",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Stable session id — lives for the whole browser session
  const sessionIdRef = useRef<string>(genSessionId());
  const msgIdRef = useRef<number>(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: msgIdRef.current++, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, text }),
      });

      const data = await res.json();
      const replyText: string =
        res.ok && data.reply
          ? data.reply
          : "Sorry, something went wrong. Please try again.";

      setMessages((prev) => [
        ...prev,
        { id: msgIdRef.current++, role: "bot", text: replyText },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: msgIdRef.current++,
          role: "bot",
          text: "Connection error. Please check your internet and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Chat Window ────────────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-label="Chat with Futura AI"
        aria-hidden={!open}
        className={[
          "fixed bottom-24 right-5 z-50 flex flex-col",
          "w-[360px] max-w-[calc(100vw-2rem)]",
          "rounded-2xl overflow-hidden shadow-2xl shadow-black/50",
          "border border-white/10",
          "transition-all duration-300 ease-out origin-bottom-right",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none",
        ].join(" ")}
        style={{ height: "520px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40">
            <Bot className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-none">Alex</p>
            <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Bot avatar */}
              {msg.role === "bot" && (
                <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 mb-0.5">
                  <Bot className="w-3.5 h-3.5 text-orange-400" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={[
                  "max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-orange-500 text-white rounded-br-sm"
                    : "bg-slate-700/80 text-gray-100 rounded-bl-sm border border-white/5",
                ].join(" ")}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 mb-0.5">
                <Bot className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="bg-slate-700/80 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="bg-slate-800 border-t border-white/10 p-3 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…"
              rows={1}
              disabled={loading}
              aria-label="Message input"
              className={[
                "flex-1 resize-none bg-slate-700/60 border border-white/10 rounded-xl",
                "px-3.5 py-2.5 text-sm text-white placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-transparent",
                "transition-colors disabled:opacity-50 min-h-[40px] max-h-28",
                "scrollbar-thin",
              ].join(" ")}
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              id="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className={[
                "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                "bg-orange-500 hover:bg-orange-400 active:scale-95",
                "transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
                "shadow-lg shadow-orange-500/30",
              ].join(" ")}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-2">
            Press <kbd className="text-gray-500">Enter</kbd> to send · <kbd className="text-gray-500">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>

      {/* ── FAB (Floating Action Button) ─────────────────────────────────── */}
      <button
        id="chat-fab-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close chat" : "Open chat with Futura AI"}
        aria-expanded={open}
        className={[
          "fixed bottom-5 right-5 z-50",
          "w-14 h-14 rounded-full shadow-2xl shadow-orange-500/40",
          "flex items-center justify-center",
          "bg-gradient-to-br from-orange-500 to-orange-600",
          "hover:from-orange-400 hover:to-orange-500",
          "active:scale-95 transition-all duration-200",
          "border border-orange-400/50",
          // Subtle ring pulse when closed
          !open ? "ring-4 ring-orange-500/20 animate-pulse-slow" : "",
        ].join(" ")}
      >
        <div
          className={`transition-all duration-300 ${open ? "rotate-90 scale-110" : "rotate-0 scale-100"}`}
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white fill-white/20" />
          )}
        </div>

        {/* Unread dot — visible only when closed and after first bot greeting */}
        {!open && (
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900"
          />
        )}
      </button>
    </>
  );
}
