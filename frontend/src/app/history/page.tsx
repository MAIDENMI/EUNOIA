"use client"

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const INTRO_STYLE_ID = "history-animations";

// Sample session history data - replace with actual data from your backend
const sessionHistory = [
  {
    question: "Morning Reflection",
    answer:
      "Discussed feelings about work-life balance and strategies for managing stress. We explored mindfulness techniques and identified key triggers for anxiety.",
    meta: "Completed",
  },
  {
    question: "Evening Check-in",
    answer:
      "Focused on gratitude practice and reviewed progress on personal goals. Explored relationships and communication patterns with family members.",
    meta: "Completed",
  },
  {
    question: "Midday Session",
    answer:
      "Deep dive into past experiences and how they shape current behavior. We worked on cognitive reframing and identified negative thought patterns to address.",
    meta: "Completed",
  },
  {
    question: "Weekend Reflection",
    answer:
      "Explored creative expression as a form of emotional release. Discussed the importance of self-care routines and setting healthy boundaries.",
    meta: "Completed",
  },
];

const palettes = {
  dark: {
    surface: "bg-neutral-950 text-neutral-100",
    panel: "bg-neutral-900/50",
    border: "border-white/10",
    heading: "text-white",
    muted: "text-neutral-400",
    iconRing: "border-white/20",
    iconSurface: "bg-white/5",
    icon: "text-white",
    toggle: "border-white/20 text-white",
    toggleSurface: "bg-white/10",
    glow: "rgba(255, 255, 255, 0.08)",
    aurora: "radial-gradient(ellipse 50% 100% at 10% 0%, rgba(226, 232, 240, 0.15), transparent 65%), #000000",
    shadow: "shadow-[0_36px_140px_-60px_rgba(10,10,10,0.95)]",
    overlay: "linear-gradient(130deg, rgba(255,255,255,0.04) 0%, transparent 65%)",
  },
  light: {
    surface: "bg-slate-100 text-neutral-900",
    panel: "bg-white/70",
    border: "border-neutral-200",
    heading: "text-neutral-900",
    muted: "text-neutral-600",
    iconRing: "border-neutral-300",
    iconSurface: "bg-neutral-900/5",
    icon: "text-neutral-900",
    toggle: "border-neutral-200 text-neutral-900",
    toggleSurface: "bg-white",
    glow: "rgba(15, 15, 15, 0.08)",
    aurora: "radial-gradient(ellipse 50% 100% at 10% 0%, rgba(15, 23, 42, 0.08), rgba(255, 255, 255, 0.95) 70%)",
    shadow: "shadow-[0_36px_120px_-70px_rgba(15,15,15,0.18)]",
    overlay: "linear-gradient(130deg, rgba(15,23,42,0.08) 0%, transparent 70%)",
  },
};

export default function HistoryPage() {
  const getRootTheme = () => {
    if (typeof document === "undefined") return "dark";
    if (document.documentElement.classList.contains("dark")) return "dark";
    if (document.documentElement.classList.contains("light")) return "light";
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  };

  const [theme, setTheme] = useState<"dark" | "light">(getRootTheme);
  const [introReady, setIntroReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(INTRO_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = INTRO_STYLE_ID;
    style.innerHTML = `
      @keyframes history-fade-up {
        0% { transform: translate3d(0, 20px, 0); opacity: 0; filter: blur(6px); }
        60% { filter: blur(0); }
        100% { transform: translate3d(0, 0, 0); opacity: 1; filter: blur(0); }
      }
      @keyframes history-beam-spin {
        0% { transform: rotate(0deg) scale(1); }
        100% { transform: rotate(360deg) scale(1); }
      }
      @keyframes history-pulse {
        0% { transform: scale(0.7); opacity: 0.55; }
        60% { opacity: 0.1; }
        100% { transform: scale(1.25); opacity: 0; }
      }
      @keyframes history-meter {
        0%, 20% { transform: scaleX(0); transform-origin: left; }
        45%, 60% { transform: scaleX(1); transform-origin: left; }
        80%, 100% { transform: scaleX(0); transform-origin: right; }
      }
      @keyframes history-tick {
        0%, 30% { transform: translateX(-6px); opacity: 0.4; }
        50% { transform: translateX(2px); opacity: 1; }
        100% { transform: translateX(20px); opacity: 0; }
      }
      .history-intro {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.85rem 1.4rem;
        border-radius: 9999px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(12, 12, 12, 0.42);
        color: rgba(248, 250, 252, 0.92);
        text-transform: uppercase;
        letter-spacing: 0.35em;
        font-size: 0.65rem;
        width: 100%;
        max-width: 24rem;
        margin: 0 auto;
        mix-blend-mode: screen;
        opacity: 0;
        transform: translate3d(0, 12px, 0);
        filter: blur(8px);
        transition: opacity 720ms ease, transform 720ms ease, filter 720ms ease;
        isolation: isolate;
      }
      .history-intro--light {
        border-color: rgba(17, 17, 17, 0.12);
        background: rgba(248, 250, 252, 0.88);
        color: rgba(15, 23, 42, 0.78);
        mix-blend-mode: multiply;
      }
      .history-intro--active {
        opacity: 1;
        transform: translate3d(0, 0, 0);
        filter: blur(0);
      }
      .history-intro__beam,
      .history-intro__pulse {
        position: absolute;
        inset: -110%;
        pointer-events: none;
        border-radius: 50%;
      }
      .history-intro__beam {
        background: conic-gradient(from 160deg, rgba(226, 232, 240, 0.25), transparent 32%, rgba(148, 163, 184, 0.22) 58%, transparent 78%, rgba(148, 163, 184, 0.18));
        animation: history-beam-spin 18s linear infinite;
        opacity: 0.55;
      }
      .history-intro--light .history-intro__beam {
        background: conic-gradient(from 180deg, rgba(15, 23, 42, 0.18), transparent 30%, rgba(71, 85, 105, 0.18) 58%, transparent 80%, rgba(15, 23, 42, 0.14));
      }
      .history-intro__pulse {
        border: 1px solid currentColor;
        opacity: 0.25;
        animation: history-pulse 3.4s ease-out infinite;
      }
      .history-intro__label {
        position: relative;
        z-index: 1;
        font-weight: 600;
        letter-spacing: 0.4em;
      }
      .history-intro__meter {
        position: relative;
        z-index: 1;
        flex: 1 1 auto;
        height: 1px;
        background: linear-gradient(90deg, transparent, currentColor 35%, transparent 85%);
        transform: scaleX(0);
        transform-origin: left;
        animation: history-meter 5.8s ease-in-out infinite;
        opacity: 0.7;
      }
      .history-intro__tick {
        position: relative;
        z-index: 1;
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 9999px;
        background: currentColor;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
        animation: history-tick 3.2s ease-in-out infinite;
      }
      .history-intro--light .history-intro__tick {
        box-shadow: 0 0 0 4px rgba(15, 15, 15, 0.08);
      }
      .history-fade {
        opacity: 0;
        transform: translate3d(0, 24px, 0);
        filter: blur(12px);
        transition: opacity 700ms ease, transform 700ms ease, filter 700ms ease;
      }
      .history-fade--ready {
        animation: history-fade-up 860ms cubic-bezier(0.22, 0.68, 0, 1) forwards;
      }
    `;

    document.head.appendChild(style);

    return () => {
      if (style.parentNode) style.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIntroReady(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => setIntroReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const applyThemeFromRoot = () => setTheme(getRootTheme());

    applyThemeFromRoot();

    const observer = new MutationObserver(applyThemeFromRoot);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "bento-theme") applyThemeFromRoot();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const palette = useMemo(() => palettes[theme], [theme]);

  const toggleTheme = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    setTheme(next);
    try {
      window.localStorage?.setItem("bento-theme", next);
    } catch (_err) {
      /* ignore */
    }
  };
  const toggleQuestion = (index: number) => setActiveIndex((prev) => (prev === index ? -1 : index));

  useEffect(() => {
    if (typeof window === "undefined") {
      setHasEntered(true);
      return;
    }

    let timeout: NodeJS.Timeout;
    const onLoad = () => {
      timeout = setTimeout(() => setHasEntered(true), 120);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(timeout);
    };
  }, []);

  const setCardGlow = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--history-x", `${event.clientX - rect.left}px`);
    target.style.setProperty("--history-y", `${event.clientY - rect.top}px`);
  };

  const clearCardGlow = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.currentTarget;
    target.style.removeProperty("--history-x");
    target.style.removeProperty("--history-y");
  };

  return (
    <div className={`relative h-screen w-full overflow-hidden transition-colors duration-700 ${palette.surface}`}>
      <div className="absolute inset-0 z-0" style={{ background: palette.aurora }} />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
        style={{ background: palette.overlay, mixBlendMode: theme === "dark" ? "screen" : "multiply" }}
      />

          <section
            className={`relative z-10 mx-auto flex max-w-7xl flex-col h-full px-6 py-6 lg:px-12 lg:py-8 ${
              hasEntered ? "history-fade--ready" : "history-fade"
            }`}
          >
            <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between flex-shrink-0 mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <p className={`text-[10px] uppercase tracking-[0.35em] ${palette.muted}`}>Your Journey</p>
                  <Link
                    href="/session"
                    className={`md:hidden relative inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[10px] font-medium transition-colors duration-500 hover:opacity-80 ${palette.toggleSurface} ${palette.toggle}`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Session
                  </Link>
                </div>
                <h1 className={`text-2xl font-semibold leading-tight md:text-3xl ${palette.heading}`}>
                  Reflection & Growth
                </h1>
                <p className={`max-w-xl text-xs ${palette.muted}`}>
                  Review your past therapy sessions and track your progress over time.
                </p>
              </div>

              <Link
                href="/session"
                className={`hidden md:inline-flex relative h-8 items-center gap-2 rounded-full border px-4 text-[10px] font-medium transition-colors duration-500 hover:opacity-80 ${palette.toggleSurface} ${palette.toggle}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Start New Session
              </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 items-start flex-1 overflow-hidden">
              {/* Session List */}
              <div className="overflow-y-auto h-full pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: theme === 'dark' ? 'rgba(255,255,255,0.15) transparent' : 'rgba(0,0,0,0.15) transparent' }}>
                <ul className="space-y-2.5">
              {sessionHistory.map((item, index) => {
                const open = activeIndex === index;
                const panelId = `history-panel-${index}`;
                const buttonId = `history-trigger-${index}`;

                return (
                  <li
                    key={item.question}
                    className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 focus-within:-translate-y-0.5 ${palette.border} ${palette.panel} ${palette.shadow}`}
                    onMouseMove={setCardGlow}
                    onMouseLeave={clearCardGlow}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                        open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      style={{
                        background: `radial-gradient(200px circle at var(--history-x, 50%) var(--history-y, 50%), ${palette.glow}, transparent 70%)`,
                      }}
                    />

                    <button
                      type="button"
                      id={buttonId}
                      aria-controls={panelId}
                      aria-expanded={open}
                      onClick={() => toggleQuestion(index)}
                      style={{ "--history-outline": theme === "dark" ? "rgba(255,255,255,0.35)" : "rgba(17,17,17,0.25)" } as React.CSSProperties}
                      className="relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--history-outline)]"
                    >
                      <span
                        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 group-hover:scale-105 ${palette.iconRing} ${palette.iconSurface}`}
                      >
                        <svg
                          className={`relative h-3.5 w-3.5 transition-transform duration-300 ${palette.icon} ${open ? "rotate-45" : ""}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </span>

                      <div className="flex flex-1 flex-col gap-2">
                        <div className="flex items-center gap-2 justify-between">
                          <h2 className={`text-sm font-medium leading-tight ${palette.heading} flex-1`}>
                            {item.question}
                          </h2>
                          {item.meta && (
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider ${palette.border} ${palette.muted}`}
                            >
                              {item.meta}
                            </span>
                          )}
                        </div>

                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className={`overflow-hidden text-[11px] leading-relaxed transition-[max-height] duration-300 ease-out ${
                            open ? "max-h-32" : "max-h-0"
                          } ${palette.muted}`}
                        >
                          <p className="pr-1">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
                </ul>
              </div>

              {/* Conversation Viewer */}
              <div className={`relative overflow-hidden rounded-2xl border ${palette.border} h-full`}
                style={{ background: theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)" }}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className={`px-5 py-3 border-b ${palette.border} flex-shrink-0`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className={`flex items-center gap-1.5 text-[9px] ${palette.muted}`}>
                        <span>History</span>
                        <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className={palette.heading}>Session Transcript</span>
                      </div>
                    </div>
                    <h2 className={`text-lg font-semibold ${palette.heading}`}>
                      {activeIndex >= 0 ? sessionHistory[activeIndex].question : "Conversation"}
                    </h2>
                  </div>

                  {/* Conversation Content */}
                  <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: theme === 'dark' ? 'rgba(255,255,255,0.15) transparent' : 'rgba(0,0,0,0.15) transparent' }}>
                    {activeIndex >= 0 ? (
                      <div className="space-y-4 max-w-3xl">
                        {/* Timestamp header */}
                        <div className={`text-[9px] uppercase tracking-wider ${palette.muted} pb-2 border-b ${palette.border}`}>
                          March 15, 2025 • 3:24 PM - 3:45 PM
                        </div>

                        {/* Message exchange */}
                        <div className="space-y-4">
                          {/* User message */}
                          <div className="space-y-1.5">
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>You</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              I've been feeling overwhelmed with work lately...
                            </div>
                          </div>

                          {/* Divider */}
                          <div className={`border-l-2 ${palette.border} pl-4 space-y-1.5`}>
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>Therapist</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              I understand that feeling. Let's explore what specifically about work is making you feel this way. Can you tell me more about what's been happening?
                            </div>
                          </div>

                          {/* User message */}
                          <div className="space-y-1.5">
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>You</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              It's the constant deadlines and expectations. I feel like no matter how much I do, it's never enough.
                            </div>
                          </div>

                          {/* Therapist response */}
                          <div className={`border-l-2 ${palette.border} pl-4 space-y-1.5`}>
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>Therapist</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              Those are valid concerns. Have you had a chance to set boundaries around your work hours? It sounds like you might be experiencing burnout.
                            </div>
                          </div>

                          {/* User message */}
                          <div className="space-y-1.5">
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>You</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              Not really. I feel like I need to always be available or I'll fall behind. Everyone else seems to manage just fine.
                            </div>
                          </div>

                          {/* Therapist response */}
                          <div className={`border-l-2 ${palette.border} pl-4 space-y-1.5`}>
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>Therapist</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              That's a common feeling, especially in today's work culture. But remember, what you see from others is often just the surface. Let's talk about what healthy boundaries might look like for you, and how to communicate them effectively to your team.
                            </div>
                          </div>

                          {/* User message */}
                          <div className="space-y-1.5">
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>You</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              I'd like that. Where should I start?
                            </div>
                          </div>

                          {/* Therapist response */}
                          <div className={`border-l-2 ${palette.border} pl-4 space-y-1.5`}>
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>Therapist</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              Let's start by identifying one small boundary you could implement this week. What's one thing that would make a meaningful difference in your daily routine? It could be as simple as not checking emails after a certain time, or taking a proper lunch break.
                            </div>
                          </div>

                          {/* User message */}
                          <div className="space-y-1.5">
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>You</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              I think stopping work emails after 7 PM would help. I always find myself checking them before bed and it keeps me up.
                            </div>
                          </div>

                          {/* Therapist response */}
                          <div className={`border-l-2 ${palette.border} pl-4 space-y-1.5`}>
                            <div className={`text-[10px] font-medium uppercase tracking-wider ${palette.muted}`}>Therapist</div>
                            <div className={`${palette.heading} text-sm leading-relaxed`}>
                              That's an excellent starting point. Setting a specific time boundary like that can really improve your sleep quality and help you mentally disconnect from work. How do you feel about communicating this boundary to your colleagues?
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4 max-w-sm">
                          <svg
                            className={`w-16 h-16 mx-auto ${palette.muted}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <div className="space-y-2">
                            <p className={`text-lg font-medium ${palette.heading}`}>
                              No Session Selected
                            </p>
                            <p className={`text-sm ${palette.muted}`}>
                              Select a session from the list to view the conversation transcript
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
  );
}

