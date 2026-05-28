import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Zap,
  MessageCircle,
  Mic,
  Send,
  Plus,
  Search,
  Twitter,
  Github,
  Linkedin,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { apiRequest, ensureDemoAuthentication } from "../lib/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuroChat AI — Smart AI Chat Assistant" },
      {
        name: "description",
        content:
          "Experience smooth and intelligent conversations in a clean modern interface. NeuroChat AI is a premium AI chat assistant.",
      },
      { property: "og:title", content: "NeuroChat AI — Smart AI Chat Assistant" },
      {
        property: "og:description",
        content:
          "Experience smooth and intelligent conversations in a clean modern interface.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <main>
        <Hero />
        <Features />
        <ChatPreview />
        <About />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-gradient-gold shadow-soft grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-lg font-medium tracking-tight">NeuroChat<span className="text-gold"> AI</span></span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#preview" className="hover:text-foreground transition">Preview</a>
          <a href="#about" className="hover:text-foreground transition">About</a>
        </nav>
        <a
          href="#chat"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition shadow-soft"
        >
          Start Chat <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-warm opacity-70"
      />
      <div
        aria-hidden
        className="absolute top-20 left-1/2 -translate-x-1/2 h-[420px] w-[820px] rounded-full blur-3xl -z-10"
        style={{ background: "radial-gradient(closest-side, oklch(0.85 0.09 82 / 0.5), transparent)" }}
      />
      <div className="mx-auto max-w-4xl px-6 pt-24 pb-28 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground shadow-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          Introducing NeuroChat AI
        </span>
        <h1 className="mt-8 text-5xl md:text-7xl font-normal leading-[1.05] tracking-tight">
          Smart AI Chat <span className="italic text-coffee" style={{ color: "var(--coffee)" }}>Assistant</span>
        </h1>
        <p className="mt-6 mx-auto max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
          Experience smooth and intelligent conversations in a clean modern interface.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <a
            href="#chat"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-elegant hover:translate-y-[-1px] transition"
          >
            Start Chat <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Sparkles, title: "Smart Replies", desc: "Context-aware answers crafted with care and precision." },
  { icon: Zap, title: "Fast Response", desc: "Real-time replies with effortlessly low latency." },
  { icon: MessageCircle, title: "AI Conversations", desc: "Natural dialogue that flows like talking to a friend." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Features</p>
        <h2 className="mt-3 text-3xl md:text-4xl font-normal tracking-tight">
          Designed for calm, intelligent conversation.
        </h2>
      </div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <article
            key={f.title}
            className="group rounded-2xl border border-border/70 bg-card p-6 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-all"
          >
            <div className="h-11 w-11 rounded-xl bg-gradient-warm grid place-items-center shadow-soft">
              <f.icon className="h-5 w-5" style={{ color: "var(--coffee)" }} />
            </div>
            <h3 className="mt-5 text-lg font-medium">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ChatPreview() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize and ensure silent guest authentication
  useEffect(() => {
    async function initAuth() {
      const token = await ensureDemoAuthentication();
      if (token) {
        setIsAuthenticated(true);
        loadConversations();
      }
    }
    initAuth();
  }, []);

  // Scroll message container to bottom when new messages appear
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  // Load active conversation messages
  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
    } else {
      setMessages([]);
    }
  }, [activeId]);

  const loadConversations = async () => {
    try {
      const data = await apiRequest("/api/conversations");
      setConversations(data);
    } catch (err: any) {
      console.error("Failed to load conversations", err);
    }
  };

  const loadMessages = async (id: string) => {
    try {
      const data = await apiRequest(`/api/messages/${id}`);
      setMessages(data);
    } catch (err: any) {
      console.error("Failed to load messages", err);
      toast.error("Could not load message history.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userText = inputVal;
    setInputVal("");
    setIsLoading(true);

    // Optimistically render the user message
    const tempUserMessage = {
      _id: "temp-user-id-" + Date.now(),
      sender: "user" as const,
      text: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: activeId,
          text: userText,
        }),
      });

      // Update message history with actual saved messages
      setMessages((prev) =>
        prev.filter((m) => m._id !== tempUserMessage._id).concat([
          response.userMessage,
          response.aiMessage,
        ])
      );

      // If a new conversation was created, set it as active
      if (!activeId && response.conversationId) {
        setActiveId(response.conversationId);
      }

      // Reload sidebar to reflect changes (timestamps, new items)
      loadConversations();
    } catch (err: any) {
      console.error("Failed to send message", err);
      toast.error("Failed to send message. Please verify server status.");
      // Remove optimistic message if send failed
      setMessages((prev) => prev.filter((m) => m._id !== tempUserMessage._id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the deleted item
    try {
      await apiRequest(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      toast.success("Chat deleted.");
      if (activeId === id) {
        setActiveId(null);
      }
      loadConversations();
    } catch (err: any) {
      console.error("Failed to delete conversation", err);
      toast.error("Could not delete conversation.");
    }
  };

  const activeConversationTitle = conversations.find((c) => c._id === activeId)?.title || "NeuroChat Assistant";

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="preview" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="max-w-2xl mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Preview</p>
        <h2 className="mt-3 text-3xl md:text-4xl font-normal tracking-tight">
          A workspace, beautifully composed.
        </h2>
      </div>

      <div
        id="chat"
        className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-elegant"
      >
        <div className="grid md:grid-cols-[280px_1fr] min-h-[560px]">
          {/* Sidebar */}
          <aside className="border-r border-border/70 bg-sand/40 p-5 hidden md:flex md:flex-col justify-between">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-gradient-gold grid place-items-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </span>
                <span className="text-sm font-medium">NeuroChat</span>
              </div>
              <button 
                onClick={() => setActiveId(null)}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-soft hover:bg-background transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> New chat
              </button>
              <div className="mt-4 relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <p className="mt-6 text-[10px] uppercase tracking-wider text-muted-foreground">Recent Chats</p>
              
              <div className="flex-1 overflow-y-auto mt-2 -mx-2 px-2 max-h-[300px] space-y-1">
                {filteredConversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    {isAuthenticated ? "No chats yet" : "Authenticating..."}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {filteredConversations.map((c) => (
                      <li key={c._id} className="group relative">
                        <button
                          onClick={() => setActiveId(c._id)}
                          className={`w-full text-left rounded-lg pl-3 pr-8 py-2 text-sm transition truncate cursor-pointer ${
                            c._id === activeId
                              ? "bg-card text-foreground shadow-soft"
                              : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                          }`}
                        >
                          {c.title}
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(c._id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition cursor-pointer"
                          title="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-destructive" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {isAuthenticated && (
              <div className="pt-4 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground mt-4">
                <span>Guest User</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" title="Connected" />
              </div>
            )}
          </aside>

          {/* Chat */}
          <div className="flex flex-col bg-background/60">
            <header className="flex items-center justify-between px-6 py-4 border-b border-border/70">
              <div>
                <h3 className="text-sm font-medium line-clamp-1">{activeConversationTitle}</h3>
                <p className="text-xs text-muted-foreground">NeuroChat · online</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {activeId ? "Active Session" : "New Session"}
              </span>
            </header>

            <div ref={chatContainerRef} className="flex-1 px-6 py-6 space-y-5 overflow-y-auto max-h-[400px]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-gold grid place-items-center animate-pulse">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h4 className="text-base font-medium">Start a calm conversation</h4>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Ask NeuroChat AI anything. Your session history is auto-saved securely to MongoDB.
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <Bubble key={m._id} side={m.sender}>
                    {m.text}
                  </Bubble>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft bg-card border border-border/70 text-foreground rounded-bl-md flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/70">
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft focus-within:ring-2 focus-within:ring-ring/40">
                <input
                  placeholder="Message NeuroChat…"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={!isAuthenticated}
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
                <button 
                  type="submit"
                  disabled={!isAuthenticated || !inputVal.trim() || isLoading}
                  className="h-9 w-9 grid place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition shadow-soft cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground text-center">
                NeuroChat may produce inaccurate information. Always verify.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bubble({ side, children }: { side: "ai" | "user"; children: React.ReactNode }) {
  const isUser = side === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border/70 text-foreground rounded-bl-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="relative">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">About</p>
        <h2 className="mt-4 text-3xl md:text-5xl font-normal tracking-tight leading-tight">
          A thoughtful conversation system,
          <br />
          <span className="italic" style={{ color: "var(--coffee)" }}>crafted with intention.</span>
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
          NeuroChat AI is built using Python and powered by an intelligent conversation system. The experience is responsive, warm, and quiet — designed to feel as natural as a good chat over coffee.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs">
          {["Built with Python", "Intelligent conversation", "Responsive experience"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-card px-4 py-2 shadow-soft text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-6 w-6 rounded-full bg-gradient-gold grid place-items-center">
            <Sparkles className="h-3 w-3 text-primary-foreground" />
          </span>
          © {new Date().getFullYear()} NeuroChat AI. All rights reserved.
        </div>
        <div className="flex items-center gap-2">
          {[Twitter, Github, Linkedin].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="h-9 w-9 grid place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:shadow-soft transition"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
