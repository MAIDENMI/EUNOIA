"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import jsPDF from 'jspdf';

const INTRO_STYLE_ID = "history-animations";

interface SessionData {
  id: string;
  title: string;
  date: string;
  duration: string;
  messages: Array<{ role: string; content: string }>;
  summary: string;
}

interface EmotionExchange {
  emotion: 'happiness' | 'sadness' | 'anger' | 'fear' | 'neutral';
  userMessage: string;
  agentQuestion: string;
  agentResponse: string;
}

interface EmotionAnalysis {
  happiness: EmotionExchange[];
  sadness: EmotionExchange[];
  anger: EmotionExchange[];
  fear: EmotionExchange[];
  neutral: EmotionExchange[];
}

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
  const [introReady, setIntroReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [emotionAnalysis, setEmotionAnalysis] = useState<EmotionAnalysis | null>(null);
  const [isLoadingEmotions, setIsLoadingEmotions] = useState(false);
  const [showEmotions, setShowEmotions] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('therapy_sessions');
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);
        setSessions(parsedSessions);
        console.log('✅ Loaded sessions from localStorage:', parsedSessions.length);
      }
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
    }
  }, []);

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

  const palette = palettes.light;

  const toggleQuestion = (index: number) => {
    setActiveIndex((prev) => (prev === index ? -1 : index));
    setShowSummary(false); // Reset summary when switching sessions
    setAiSummary("");
    setShowEmotions(false);
    setEmotionAnalysis(null);
    setSelectedEmotion(null);
  };

  // Function to generate AI summary using Gemini
  const generateSummary = async () => {
    if (activeIndex < 0 || !sessions[activeIndex]) return;
    
    setIsLoadingSummary(true);
    setShowSummary(true);
    
    try {
      const session = sessions[activeIndex];
      const conversationText = session.messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'EMURA'}: ${msg.content}`)
        .join('\n\n');
      
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please provide a concise therapeutic summary of this therapy session. Include key topics discussed, emotional themes, progress made, and any action items or insights. Keep it professional and empathetic.\n\nSession Transcript:\n${conversationText}`,
          context: [],
          user_id: 'summary_generator'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setAiSummary(data.response);
    } catch (error) {
      console.error('Error generating summary:', error);
      setAiSummary('Failed to generate summary. Please ensure the AI service is running.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Function to analyze emotions using Gemini
  const analyzeEmotions = async () => {
    if (activeIndex < 0 || !sessions[activeIndex]) return;
    
    setIsLoadingEmotions(true);
    setShowEmotions(true);
    
    try {
      const session = sessions[activeIndex];
      const conversationText = session.messages
        .map((msg, idx) => `[${idx}] ${msg.role === 'user' ? 'User' : 'EMURA'}: ${msg.content}`)
        .join('\n\n');
      
      const prompt = `Analyze this therapy conversation and categorize the emotional tone of each user response into one of these five emotions:

1. Happiness/Joy 😊 - positive engagement, calmness, satisfaction
2. Sadness 😔 - withdrawal, loss, emotional heaviness
3. Anger/Frustration 😠 - agitation, injustice, unmet expectations
4. Fear/Anxiety 😨 - worry, stress, uncertainty about future
5. Neutral/Calm 😐 - baseline emotional state, stable or balanced mood

For each user message, identify:
- The emotion expressed
- The agent's question that prompted it
- The agent's follow-up response

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "happiness": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}],
  "sadness": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}],
  "anger": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}],
  "fear": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}],
  "neutral": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}]
}

Conversation:
${conversationText}`;
      
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          context: [],
          user_id: 'emotion_analyzer'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze emotions');
      }

      const data = await response.json();
      
      // Parse the JSON response
      try {
        // Remove markdown code blocks if present
        let jsonText = data.response.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        
        const analysis = JSON.parse(jsonText);
        setEmotionAnalysis(analysis);
      } catch (parseError) {
        console.error('Error parsing emotion analysis:', parseError);
        setEmotionAnalysis({
          happiness: [],
          sadness: [],
          anger: [],
          fear: [],
          neutral: []
        });
      }
    } catch (error) {
      console.error('Error analyzing emotions:', error);
      setEmotionAnalysis(null);
    } finally {
      setIsLoadingEmotions(false);
    }
  };

  // Function to generate PDF report with emotion-coded conversation
  const generatePDFReport = async () => {
    if (activeIndex < 0 || !sessions[activeIndex]) return;
    
    setIsGeneratingReport(true);
    
    try {
      const session = sessions[activeIndex];
      console.log('📄 Starting PDF generation for session:', session.title);
      
      // First, get the summary - ALWAYS generate it fresh
      let summary = '';
      const conversationText = session.messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'EMURA'}: ${msg.content}`)
        .join('\n\n');
      
      console.log('🤖 Generating summary...');
      const summaryResponse = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please provide a concise therapeutic summary of this therapy session. Include key topics discussed, emotional themes, progress made, and any action items or insights. Keep it professional and empathetic.\n\nSession Transcript:\n${conversationText}`,
          context: [],
          user_id: 'summary_generator'
        })
      });
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        summary = summaryData.response;
        console.log('✅ Summary generated:', summary.substring(0, 100) + '...');
      } else {
        console.error('❌ Failed to generate summary');
        summary = 'Unable to generate summary at this time.';
      }
      
      // Get emotion analysis - ALWAYS generate it fresh
      let emotions: EmotionAnalysis | null = null;
      console.log('🎭 Analyzing emotions...');
      const emotionConversationText = session.messages
        .map((msg, idx) => `[${idx}] ${msg.role === 'user' ? 'User' : 'EMURA'}: ${msg.content}`)
        .join('\n\n');
      
      const emotionResponse = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Analyze this therapy conversation and categorize the emotional tone of each user response into one of these five emotions:\n\n1. Happiness/Joy \ud83d\ude0a\n2. Sadness \ud83d\ude14\n3. Anger/Frustration \ud83d\ude20\n4. Fear/Anxiety \ud83d\ude28\n5. Neutral/Calm \ud83d\ude10\n\nReturn ONLY a valid JSON object with this exact structure (no markdown):\n{\n  "happiness": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}],\n  "sadness": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}],\n  "anger": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}],\n  "fear": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}],\n  "neutral": [{"userMessage": "...", "agentQuestion": "...", "agentResponse": "..."}]\n}\n\nConversation:\n${emotionConversationText}`,
          context: [],
          user_id: 'emotion_analyzer'
        })
      });
      
      if (emotionResponse.ok) {
        const emotionData = await emotionResponse.json();
        let jsonText = emotionData.response.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        try {
          emotions = JSON.parse(jsonText);
          console.log('✅ Emotions analyzed:', emotions);
        } catch (parseError) {
          console.error('❌ Failed to parse emotion JSON:', parseError);
          emotions = {
            happiness: [],
            sadness: [],
            anger: [],
            fear: [],
            neutral: []
          };
        }
      }
      
      // Create emotion map for quick lookup
      const emotionMap = new Map<string, string>();
      if (emotions) {
        Object.entries(emotions).forEach(([emotion, exchanges]) => {
          exchanges.forEach((exchange: EmotionExchange) => {
            // Normalize the message for better matching
            const normalizedMsg = exchange.userMessage.trim().toLowerCase();
            emotionMap.set(normalizedMsg, emotion);
            // Also store original for exact matching
            emotionMap.set(exchange.userMessage.trim(), emotion);
          });
        });
      }
      console.log('📊 Emotion map created with', emotionMap.size, 'entries');
      
      // Generate PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;
      
      // Helper function to add text with word wrap and optional light highlight
      const addText = (text: string, fontSize: number, color: [number, number, number], isBold: boolean = false, highlightColor?: [number, number, number]) => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(color[0], color[1], color[2]);
        if (isBold) pdf.setFont('helvetica', 'bold');
        else pdf.setFont('helvetica', 'normal');
        
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Add LIGHT highlight background if specified
          if (highlightColor) {
            const textWidth = pdf.getTextWidth(line);
            const lineHeight = fontSize * 0.5;
            // Use very light colors with high transparency
            pdf.setFillColor(highlightColor[0], highlightColor[1], highlightColor[2]);
            pdf.setGState(new pdf.GState({ opacity: 0.15 }));
            pdf.rect(margin - 1, yPosition - fontSize * 0.35, textWidth + 2, lineHeight, 'F');
            pdf.setGState(new pdf.GState({ opacity: 1.0 }));
          }
          
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        
        yPosition += 5;
      };
      addText(session.title, 18, [88, 28, 135], true);
      yPosition += 5;
      
      // Date and Duration
      const dateStr = new Date(session.date).toLocaleDateString('en-US', { 
        month: 'long', day: 'numeric', year: 'numeric' 
      });
      addText(`${dateStr} • Duration: ${session.duration}`, 10, [100, 100, 100]);
      yPosition += 10;
      
      // Summary Section
      addText('THERAPEUTIC SUMMARY', 14, [88, 28, 135], true);
      if (summary) {
        addText(summary, 10, [50, 50, 50]);
      } else {
        addText('Summary not available', 10, [150, 150, 150]);
      }
      yPosition += 10;
      
      // Emotion Legend
      addText('EMOTION COLOR LEGEND', 14, [88, 28, 135], true);
      const emotionColors = [
        { name: "Happiness/Joy 😊", color: [255, 235, 59] },
        { name: "Sadness 😔", color: [100, 181, 246] },
        { name: "Anger/Frustration ��", color: [239, 154, 154] },
        { name: "Fear/Anxiety 😨", color: [206, 147, 216] },
        { name: "Neutral/Calm 😐", color: [189, 189, 189] }
      ];
      
      emotionColors.forEach(({ name, color }) => {
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(margin, yPosition - 3, 5, 5, 'F');
        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(9);
        pdf.text(name, margin + 8, yPosition);
        yPosition += 7;
      });
      yPosition += 10;
      
      // Full Conversation
      addText('FULL CONVERSATION TRANSCRIPT', 14, [88, 28, 135], true);
      
      session.messages.forEach((message, idx) => {
        if (message.role === 'user') {
          // Try multiple matching strategies
          const normalizedContent = message.content.trim().toLowerCase();
          let emotion = emotionMap.get(message.content.trim()) || 
                       emotionMap.get(normalizedContent) || 
                       'neutral';
          
          console.log(`Message: "${message.content.substring(0, 50)}..." -> Emotion: ${emotion}`);
          
          const colorMap: Record<string, [number, number, number]> = {
            happiness: [255, 235, 59],    // Lighter Yellow
            sadness: [100, 181, 246],     // Lighter Blue
            anger: [239, 154, 154],       // Lighter Red
            fear: [206, 147, 216],        // Lighter Purple
            neutral: [189, 189, 189]      // Lighter Gray
          };
          
          const emotionLabels: Record<string, string> = {
            happiness: '😊 Happiness/Joy',
            sadness: '😔 Sadness',
            anger: '😠 Anger/Frustration',
            fear: '😨 Fear/Anxiety',
            neutral: '😐 Neutral/Calm'
          };
          
          const color = colorMap[emotion];
          const emotionLabel = emotionLabels[emotion];
          
          addText('YOU:', 10, [33, 150, 243], true);
          // Add highlighted text with emotion color
          addText(message.content, 9, [50, 50, 50], false, color);
          // Add emotion label after the message
          addText(`   [${emotionLabel}]`, 8, color, true);
        } else {
          addText('EMURA:', 10, [156, 39, 176], true);
          addText(message.content, 9, [50, 50, 50]);
        }
        yPosition += 3;
      });
      
      console.log('✅ PDF generated successfully');
      
      // Save PDF
      const fileName = `Therapy_Report_${new Date(session.date).toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
      {/* Violet Gradient Background */}
      <AnimatedGradientBackground
        gradientColors={[
          "#FFFFFF",
          "#9C27B0", // Purple
          "#7B1FA2", // Deep purple  
          "#8E24AA", // Purple
          "#AB47BC", // Light purple
          "#BA68C8", // Lighter purple
          "#CE93D8", // Soft purple
          "transparent"
        ]}
        gradientStops={[35, 50, 60, 70, 80, 90, 95, 100]}
        isListening={false}
        Breathing={true}
        startingGap={180}
        breathingRange={15}
        topOffset={0}
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
                    href="/call"
                    className={`md:hidden relative overflow-hidden inline-flex h-8 items-center gap-1.5 rounded-2xl border backdrop-blur-xl px-3 text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 border-purple-500/30 bg-purple-600/10 text-purple-600 hover:bg-purple-600/20 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 ${palette.shadow}`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
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
                href="/call"
                className={`hidden md:inline-flex relative overflow-hidden h-9 items-center gap-2 rounded-2xl border backdrop-blur-xl px-4 text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 border-purple-500/30 bg-purple-600/10 text-purple-600 hover:bg-purple-600/20 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 ${palette.shadow}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Start New Session
              </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 items-start flex-1 overflow-hidden">
              {/* Session List */}
              <div className="overflow-y-auto h-full pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.15) transparent' }}>
                {sessions.length === 0 ? (
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
                          No Sessions Yet
                        </p>
                        <p className={`text-sm ${palette.muted}`}>
                          Start your first therapy session to see your conversation history here
                        </p>
                        <Link
                          href="/call"
                          className={`inline-flex mt-4 h-9 items-center gap-2 rounded-2xl border backdrop-blur-xl px-4 text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 border-purple-500/30 bg-purple-600/10 text-purple-600 hover:bg-purple-600/20 hover:border-purple-500/50`}
                        >
                          Start First Session
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
              {sessions.map((item, index) => {
                const open = activeIndex === index;
                const panelId = `history-panel-${index}`;
                const buttonId = `history-trigger-${index}`;

                return (
                  <li
                    key={item.id}
                    className={`group relative overflow-hidden rounded-2xl border backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 focus-within:-translate-y-0.5 ${palette.border} ${palette.shadow}`}
                    style={{ background: "rgba(255, 255, 255, 0.4)" }}
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
                      style={{ "--history-outline": "rgba(17,17,17,0.25)" } as React.CSSProperties}
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
                            {item.title}
                          </h2>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider ${palette.border} ${palette.muted}`}
                          >
                            {item.duration}
                          </span>
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
                            {item.summary}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
                </ul>
                )}
              </div>

              {/* Conversation Viewer */}
              <div className={`relative overflow-hidden rounded-2xl border ${palette.border} h-full`}
                style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)" }}
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
                    <div className="flex items-center justify-between gap-3">
                      <h2 className={`text-lg font-semibold ${palette.heading} flex-1`}>
                        {activeIndex >= 0 && sessions[activeIndex] ? sessions[activeIndex].title : "Conversation"}
                      </h2>
                      {activeIndex >= 0 && sessions[activeIndex] && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={generatePDFReport}
                            disabled={isGeneratingReport}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border-green-500/30 bg-green-600/10 text-green-600 hover:bg-green-600/20 hover:border-green-500/50 hover:shadow-md`}
                          >
                            {isGeneratingReport ? (
                              <>
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>Report</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={analyzeEmotions}
                            disabled={isLoadingEmotions}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border-blue-500/30 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 hover:border-blue-500/50 hover:shadow-md`}
                          >
                            {isLoadingEmotions ? (
                              <>
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Analyzing...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Emotions</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={generateSummary}
                            disabled={isLoadingSummary}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border-purple-500/30 bg-purple-600/10 text-purple-600 hover:bg-purple-600/20 hover:border-purple-500/50 hover:shadow-md`}
                          >
                            {isLoadingSummary ? (
                              <>
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Summarize</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conversation Content */}
                  <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.15) transparent' }}>
                    {activeIndex >= 0 && sessions[activeIndex] ? (
                      <div className="space-y-4 max-w-3xl">
                        {/* AI Summary Section */}
                        {showSummary && (
                          <div className="p-4 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-blue-500/10 space-y-2">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              <h3 className={`text-sm font-semibold ${palette.heading}`}>AI-Generated Summary</h3>
                            </div>
                            <div className={`text-sm leading-relaxed ${palette.heading} whitespace-pre-wrap`}>
                              {aiSummary || 'Generating summary...'}
                            </div>
                          </div>
                        )}

                        {/* Emotion Analysis Section */}
                        {showEmotions && emotionAnalysis && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h3 className={`text-sm font-semibold ${palette.heading}`}>Emotion Analysis</h3>
                            </div>
                            
                            {/* Emotion Filter Buttons */}
                            <div className="flex flex-wrap gap-2">
                              {[
                                { key: 'happiness', label: 'Happiness 😊', color: 'yellow', count: emotionAnalysis.happiness?.length || 0 },
                                { key: 'sadness', label: 'Sadness 😔', color: 'blue', count: emotionAnalysis.sadness?.length || 0 },
                                { key: 'anger', label: 'Anger 😠', color: 'red', count: emotionAnalysis.anger?.length || 0 },
                                { key: 'fear', label: 'Fear 😨', color: 'purple', count: emotionAnalysis.fear?.length || 0 },
                                { key: 'neutral', label: 'Neutral 😐', color: 'gray', count: emotionAnalysis.neutral?.length || 0 }
                              ].map(({ key, label, color, count }) => (
                                <button
                                  key={key}
                                  onClick={() => setSelectedEmotion(selectedEmotion === key ? null : key)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                                    selectedEmotion === key
                                      ? `bg-${color}-500/30 border-${color}-500/50 text-${color}-700`
                                      : `bg-${color}-500/10 border-${color}-500/30 text-${color}-600 hover:bg-${color}-500/20`
                                  } border`}
                                >
                                  {label} ({count})
                                </button>
                              ))}
                            </div>

                            {/* Selected Emotion Exchanges */}
                            {selectedEmotion && emotionAnalysis[selectedEmotion as keyof EmotionAnalysis]?.length > 0 && (
                              <div className="space-y-3 mt-4">
                                {emotionAnalysis[selectedEmotion as keyof EmotionAnalysis].map((exchange, idx) => (
                                  <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-white/50 space-y-2">
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">Agent Question</p>
                                      <p className="text-sm text-gray-700">{exchange.agentQuestion}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Your Response</p>
                                      <p className="text-sm text-gray-700">{exchange.userMessage}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">Agent Follow-up</p>
                                      <p className="text-sm text-gray-700">{exchange.agentResponse}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Timestamp header */}
                        <div className={`text-[9px] uppercase tracking-wider ${palette.muted} pb-2 border-b ${palette.border}`}>
                          {(showSummary || showEmotions) && <span className="text-purple-600 font-semibold">FULL TRANSCRIPT • </span>}
                          {new Date(sessions[activeIndex].date).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }).toUpperCase()} • {new Date(sessions[activeIndex].date).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })} • Duration: {sessions[activeIndex].duration}
                        </div>

                        {/* Message exchange */}
                        <div className="space-y-4">
                          {sessions[activeIndex].messages.map((message, idx) => (
                            message.role === 'user' ? (
                              <div key={idx} className="space-y-1.5">
                                <div className={`text-[10px] font-medium uppercase tracking-wider text-blue-500`}>You</div>
                                <div className={`${palette.heading} text-sm leading-relaxed whitespace-pre-wrap`}>
                                  {message.content}
                                </div>
                              </div>
                            ) : (
                              <div key={idx} className={`border-l-2 border-purple-500/30 pl-4 space-y-1.5`}>
                                <div className={`text-[10px] font-medium uppercase tracking-wider text-purple-500`}>EMURA</div>
                                <div className={`${palette.heading} text-sm leading-relaxed whitespace-pre-wrap`}>
                                  {message.content}
                                </div>
                              </div>
                            )
                          ))}
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
                              {sessions.length === 0 ? 'No Sessions Yet' : 'No Session Selected'}
                            </p>
                            <p className={`text-sm ${palette.muted}`}>
                              {sessions.length === 0 
                                ? 'Start your first therapy session to see your conversation history'
                                : 'Select a session from the list to view the conversation transcript'}
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

