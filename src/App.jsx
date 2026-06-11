// ═══════════════════════════════════════════════════════════════
//  VOID ZUDZ — Monochrome Edition
//  Palette: void-black / matte surfaces / white LED glow
//  Type: Space Grotesk (display) · Inter (body) · JetBrains Mono (data)
//  Signature: scanner-line on load + mechanical type reveal
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";

// ───────────────────────────────────────────────────────────────
//  DESIGN TOKENS  (single source of truth — touch here only)
// ───────────────────────────────────────────────────────────────
const T = {
  bg:        "#070707",
  surface:   "#0f0f0f",
  elevated:  "#181818",
  border:    "rgba(255,255,255,0.07)",
  borderHi:  "rgba(255,255,255,0.14)",
  textPri:   "#f0f0f0",
  textSec:   "#7a7a7a",
  textMute:  "#3a3a3a",
  white:     "#ffffff",
  glow:      "rgba(255,255,255,0.06)",
};

// ───────────────────────────────────────────────────────────────
//  HOOK: Intersection-based reveal
// ───────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("vx-revealed"); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

// ───────────────────────────────────────────────────────────────
//  HOOK: Subtle physics tilt (reduced strength for premium feel)
// ───────────────────────────────────────────────────────────────
function useTilt(strength = 6) {
  const ref = useRef(null);
  const frame = useRef(null);

  const onMove = useCallback((e) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      el.style.transform = `perspective(900px) rotateY(${x*strength}deg) rotateX(${-y*strength}deg) translateZ(6px)`;
      el.style.boxShadow = `0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)`;
    });
  }, [strength]);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
    el.style.boxShadow = "";
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [onMove, onLeave]);

  return ref;
}

// ───────────────────────────────────────────────────────────────
//  HOOK: Mechanical typewriter — types chars one by one
// ───────────────────────────────────────────────────────────────
function useTypewriter(text, delay = 40, start = true) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!start) return;
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(id);
    }, delay);
    return () => clearInterval(id);
  }, [text, delay, start]);
  return displayed;
}

// ───────────────────────────────────────────────────────────────
//  COMPONENT: Soft particle field — white dust, very subtle
// ───────────────────────────────────────────────────────────────
function DustField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const DOTS = 80;
    const dots = Array.from({ length: DOTS }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      r:  Math.random() * 0.8 + 0.2,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      a:  Math.random() * 0.25 + 0.05,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width)  d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.5,
    }} />
  );
}

// ───────────────────────────────────────────────────────────────
//  COMPONENT: Custom monochrome cursor + soft white glow
// ───────────────────────────────────────────────────────────────
function MonoCursor() {
  const dotRef  = useRef(null);
  const glowRef = useRef(null);
  const pos     = useRef({ x: -200, y: -200 });
  const cur     = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    let raf;
    const lerp = (a, b, t) => a + (b - a) * t;
    const tick = () => {
      cur.current.x = lerp(cur.current.x, pos.current.x, 0.18);
      cur.current.y = lerp(cur.current.y, pos.current.y, 0.18);
      if (dotRef.current) {
        dotRef.current.style.left = pos.current.x + "px";
        dotRef.current.style.top  = pos.current.y + "px";
      }
      if (glowRef.current) {
        glowRef.current.style.left = cur.current.x + "px";
        glowRef.current.style.top  = cur.current.y + "px";
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); };
  }, []);

  return (
    <>
      {/* Ambient glow — lagged */}
      <div ref={glowRef} style={{
        position: "fixed", pointerEvents: "none", zIndex: 1,
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
        transform: "translate(-50%,-50%)",
      }} />
      {/* Sharp dot */}
      <div ref={dotRef} style={{
        position: "fixed", pointerEvents: "none", zIndex: 9999,
        width: 7, height: 7, borderRadius: "50%",
        background: T.white,
        transform: "translate(-50%,-50%)",
        boxShadow: "0 0 8px rgba(255,255,255,0.8)",
      }} />
      {/* Ring — same as dot position */}
      <div ref={dotRef} style={{
        position: "fixed", pointerEvents: "none", zIndex: 9998,
        width: 24, height: 24, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.35)",
        transform: "translate(-50%,-50%)",
        transition: "width 0.2s, height 0.2s",
      }} />
    </>
  );
}

// ───────────────────────────────────────────────────────────────
//  COMPONENT: Loading screen — scanner line aesthetic
// ───────────────────────────────────────────────────────────────
function Loader({ onDone }) {
  const [pct, setPct]     = useState(0);
  const [exit, setExit]   = useState(false);

  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v += Math.random() * 6 + 2;
      setPct(Math.min(v, 100));
      if (v >= 100) {
        clearInterval(id);
        setTimeout(() => { setExit(true); setTimeout(onDone, 500); }, 300);
      }
    }, 55);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: T.bg, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28,
      opacity: exit ? 0 : 1, transition: "opacity 0.5s ease",
    }}>
      {/* Wordmark */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
        fontSize: 22, letterSpacing: "0.35em", color: T.white, textTransform: "uppercase",
      }}>
        VOID ZUDZ
      </div>

      {/* Scanner bar */}
      <div style={{ width: 220, position: "relative" }}>
        <div style={{
          height: 1, background: T.elevated, width: "100%",
        }} />
        <div style={{
          position: "absolute", top: 0, left: 0, height: 1,
          width: `${Math.min(pct, 100)}%`,
          background: T.white,
          boxShadow: "0 0 6px rgba(255,255,255,0.6)",
          transition: "width 0.08s linear",
        }} />
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        color: T.textSec, letterSpacing: "0.2em",
      }}>
        {Math.min(Math.round(pct), 100).toString().padStart(3, "0")} / 100
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  COMPONENT: Navbar — hairline underline, minimal
// ───────────────────────────────────────────────────────────────
function Navbar({ active }) {
  const [docked, setDocked] = useState(false);
  useEffect(() => {
    const fn = () => setDocked(window.scrollY > 80);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const items = [
    ["hero","Home"], ["about","About"], ["skills","Skills"],
    ["setup","Setup"], ["journey","Journey"], ["projects","Work"], ["socials","Contact"],
  ];

  const scroll = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      padding: docked ? "14px 40px" : "22px 40px",
      background: docked ? "rgba(7,7,7,0.88)" : "transparent",
      backdropFilter: docked ? "blur(20px)" : "none",
      borderBottom: docked ? `1px solid ${T.border}` : "1px solid transparent",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "padding 0.4s, background 0.4s, border-color 0.4s",
    }}>
      {/* Logo */}
      <button onClick={() => scroll("hero")} style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
        fontSize: 14, letterSpacing: "0.25em", color: T.white,
        background: "none", border: "none", cursor: "pointer", textTransform: "uppercase",
      }}>
        VZ
      </button>

      {/* Links */}
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {items.map(([id, label]) => (
          <button key={id} onClick={() => scroll(id)} style={{
            fontFamily: "'Inter', sans-serif", fontSize: 12,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: active === id ? T.white : T.textSec,
            background: "none", border: "none", cursor: "pointer",
            paddingBottom: 2,
            borderBottom: active === id ? `1px solid ${T.white}` : "1px solid transparent",
            transition: "color 0.25s, border-color 0.25s",
          }}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ───────────────────────────────────────────────────────────────
//  COMPONENT: Glass card — tempered glass aesthetic
// ───────────────────────────────────────────────────────────────
function Glass({ children, style = {}, tilt = false, padding = "28px 32px" }) {
  const tiltRef = useTilt(5);
  const base = {
    background: "rgba(255,255,255,0.024)",
    backdropFilter: "blur(18px) saturate(1.2)",
    WebkitBackdropFilter: "blur(18px) saturate(1.2)",
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.25s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s",
    padding,
    ...style,
  };
  return (
    <div ref={tilt ? tiltRef : null} style={base}>
      {/* Top-edge micro-highlight */}
      <div style={{
        position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
        pointerEvents: "none",
      }} />
      {children}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  COMPONENT: Section shell
// ───────────────────────────────────────────────────────────────
function Section({ id, children, style = {} }) {
  const ref = useReveal(0.08);
  return (
    <section id={id} ref={ref} className="vx-section" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "100px 24px", position: "relative", zIndex: 2, ...style,
    }}>
      {children}
    </section>
  );
}

// ───────────────────────────────────────────────────────────────
//  COMPONENT: Section heading
// ───────────────────────────────────────────────────────────────
function Heading({ eyebrow, title, align = "center" }) {
  return (
    <div style={{ textAlign: align, marginBottom: 56 }}>
      {eyebrow && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: T.textSec, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 16,
        }}>
          {eyebrow}
        </div>
      )}
      <h2 style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
        fontSize: "clamp(28px, 4.5vw, 52px)", letterSpacing: "-0.03em",
        color: T.white, margin: 0, lineHeight: 1.08,
      }}>
        {title}
      </h2>
      {/* Hairline rule */}
      <div style={{
        width: 40, height: 1, margin: align === "center" ? "20px auto 0" : "20px 0 0",
        background: "rgba(255,255,255,0.25)",
      }} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  SECTION 1: Hero
// ───────────────────────────────────────────────────────────────
function HeroSection() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 200); return () => clearTimeout(t); }, []);

  const line1 = useTypewriter("VOID ZUDZ", 70, ready);
  const line2 = useTypewriter(".EXE", 80, line1.length >= 9);

  return (
    <Section id="hero" style={{ justifyContent: "center", minHeight: "100vh" }}>
      {/* Subtle vignette grid */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "72px 72px",
        maskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, black 40%, transparent 100%)",
      }} />

      {/* Scanner line — plays once on load */}
      <div className="vx-scanner" style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "rgba(255,255,255,0.5)",
        boxShadow: "0 0 8px rgba(255,255,255,0.4)",
        zIndex: 3, pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 760, width: "100%" }}>

        {/* Status badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          border: `1px solid ${T.border}`, borderRadius: 40,
          padding: "5px 16px", marginBottom: 40,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: T.textSec, letterSpacing: "0.18em",
          background: "rgba(255,255,255,0.02)",
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%", background: T.white,
            display: "inline-block", animation: "vx-pulse 2s ease-in-out infinite",
          }} />
          SYSTEM ONLINE
        </div>

        {/* Main wordmark — mechanical type */}
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
          fontSize: "clamp(52px, 12vw, 128px)",
          letterSpacing: "-0.04em", lineHeight: 1,
          color: T.white, margin: "0 0 6px",
          minHeight: "1.1em",
        }}>
          {line1}
          <span style={{ opacity: line1.length < 9 ? 1 : 0, transition: "opacity 0.15s", color: T.textSec }}>|</span>
        </h1>

        {/* Sub-label */}
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400,
          fontSize: "clamp(16px, 3vw, 26px)", color: T.textSec,
          letterSpacing: "0.3em", minHeight: "1.4em", marginBottom: 40,
          textTransform: "uppercase",
        }}>
          {line2}
        </div>

        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: "clamp(14px, 1.6vw, 17px)",
          color: T.textSec, lineHeight: 1.8, maxWidth: 480, margin: "0 auto 48px",
          fontWeight: 400,
        }}>
          Beginner creator. PC obsessive. Coder-in-progress. Editing frames, training models, and building a presence — one project at a time.
        </p>

        {/* CTA row */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {/* Primary — filled white */}
          <button onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })} style={{
            background: T.white, color: T.bg,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
            fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
            padding: "13px 30px", borderRadius: 6, border: "none", cursor: "pointer",
            transition: "opacity 0.2s, transform 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            View Work
          </button>
          {/* Secondary — ghost */}
          <button onClick={() => document.getElementById("socials")?.scrollIntoView({ behavior: "smooth" })} style={{
            background: "transparent", color: T.white,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500,
            fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
            padding: "12px 30px", borderRadius: 6,
            border: `1px solid ${T.borderHi}`, cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderHi; }}
          >
            Connect
          </button>
        </div>

        {/* Scroll nudge */}
        <div style={{
          marginTop: 72, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 10, opacity: 0.35,
        }}>
          <div style={{
            width: 1, height: 48,
            background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.5))",
            animation: "vx-drip 2.2s ease-in-out infinite",
          }} />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: T.textSec, letterSpacing: "0.22em",
          }}>
            SCROLL
          </div>
        </div>
      </div>
    </Section>
  );
}

// ───────────────────────────────────────────────────────────────
//  SECTION 2: About
// ───────────────────────────────────────────────────────────────
function AboutSection() {
  const ref = useReveal();
  const pillars = [
    { label: "PC Building",        note: "Rigs as art objects." },
    { label: "Video Editing",      note: "Cuts that hit different." },
    { label: "Gaming",             note: "Competitive and obsessive." },
    { label: "AI Tooling",         note: "Pushing output, fast." },
    { label: "Coding",             note: "Learning by breaking." },
    { label: "Content Creation",   note: "Building in public." },
  ];
  return (
    <Section id="about">
      <Heading eyebrow="01 — Profile" title="Who I Am" />
      <div ref={ref} className="vx-section" style={{ maxWidth: 880, width: "100%" }}>
        <Glass tilt style={{ marginBottom: 24 }}>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "clamp(15px, 1.7vw, 18px)",
            color: T.textPri, lineHeight: 1.85, margin: 0, fontWeight: 400,
          }}>
            I'm <strong style={{ color: T.white, fontWeight: 600 }}>Void Zudz</strong> — self-taught, somewhere between beginner and dangerous. I build PCs, cut videos, learn to code, and use every AI tool I can find to compress the learning curve. I'm at the start of my journey, but I move with intent.
          </p>
          <div style={{
            marginTop: 24, paddingTop: 20,
            borderTop: `1px solid ${T.border}`,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            color: T.textSec, letterSpacing: "0.1em",
          }}>
            STATUS &nbsp; / &nbsp; Early-game. Grinding hard.
          </div>
        </Glass>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12,
        }}>
          {pillars.map((p, i) => (
            <Glass key={i} tilt padding="20px 22px">
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                fontSize: 14, color: T.white, marginBottom: 6, letterSpacing: "-0.01em",
              }}>
                {p.label}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13,
                color: T.textSec, lineHeight: 1.55,
              }}>
                {p.note}
              </div>
            </Glass>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ───────────────────────────────────────────────────────────────
//  SECTION 3: Skills — bar chart, mono
// ───────────────────────────────────────────────────────────────
function SkillsSection() {
  const [animate, setAnimate] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setAnimate(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const skills = [
    { name: "PC Building & Hardware",  pct: 80 },
    { name: "Gaming",                  pct: 75 },
    { name: "AI Tools",                pct: 64 },
    { name: "Video Editing",           pct: 55 },
    { name: "Design",                  pct: 42 },
    { name: "Coding",                  pct: 35 },
  ];

  return (
    <Section id="skills">
      <Heading eyebrow="02 — Proficiency" title="Skill Stack" />
      <div ref={ref} style={{ maxWidth: 720, width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
        {skills.map((s, i) => (
          <div key={i}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              marginBottom: 8,
            }}>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13,
                color: T.textPri, letterSpacing: "0.02em",
              }}>{s.name}</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                color: T.textSec,
              }}>{s.pct}</span>
            </div>
            {/* Track */}
            <div style={{ height: 2, background: T.elevated, borderRadius: 1, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 1,
                width: animate ? `${s.pct}%` : "0%",
                background: `linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.85))`,
                transition: `width 1.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
                boxShadow: "0 0 6px rgba(255,255,255,0.3)",
              }} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ───────────────────────────────────────────────────────────────
//  SECTION 4: PC Setup — monochrome tempered-glass showcase
// ───────────────────────────────────────────────────────────────
function SetupSection() {
  const specs = [
    { cat: "CPU",      name: "Ryzen 5 9600X",                  sub: "6C / 12T · Zen 5" },
    { cat: "GPU",      name: "RTX 5070 Inspire 3X 12GB",       sub: "Blackwell · DLSS 4" },
    { cat: "RAM",      name: "XPG Lancer Blade 32GB 6000MHz",  sub: "CL36 · DDR5" },
    { cat: "STORAGE",  name: "Crucial E100 1TB",               sub: "NVMe Gen 4" },
    { cat: "MOBO",     name: "B650M Gaming X AX",              sub: "AM5 · WiFi 6E" },
    { cat: "CASE",     name: "AntEsports X11",                 sub: "Mid-Tower · Tempered Glass" },
    { cat: "PSU",      name: "Cooler Master MWE 850 V2 Gold",  sub: "850W · 80+ Gold" },
    { cat: "COOLER",   name: "Deepcool LE360 V2 ARGB",         sub: "360mm · White LED" },
    { cat: "MOUSE",    name: "Dawg Slay 50",                   sub: "Lightweight · Optical" },
    { cat: "KB",       name: "Redragon K630 Dragonborn",       sub: "TKL · Mechanical" },
  ];

  return (
    <Section id="setup">
      <Heading eyebrow="03 — Hardware" title="Battle Station" />

      {/* PC orb — white LED shimmer, no color */}
      <div style={{ position: "relative", marginBottom: 52 }}>
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 0 40px rgba(255,255,255,0.04)",
          animation: "vx-breathe 4s ease-in-out infinite",
        }}>
          {/* Inner ring */}
          <div style={{
            width: 90, height: 90, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 13, letterSpacing: "0.2em", color: T.white, textAlign: "center",
              lineHeight: 1.4,
            }}>
              RIG<br />
              <span style={{ fontSize: 10, color: T.textSec, letterSpacing: "0.18em", fontWeight: 400 }}>SPEC</span>
            </div>
          </div>
          {/* Orbital ring */}
          <div style={{
            position: "absolute", inset: -18,
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "50%",
            animation: "vx-spin 12s linear infinite",
          }}>
            <div style={{
              position: "absolute", top: "50%", right: 0,
              width: 4, height: 4, borderRadius: "50%",
              background: T.white, transform: "translate(50%,-50%)",
              boxShadow: "0 0 6px rgba(255,255,255,0.8)",
            }} />
          </div>
        </div>
      </div>

      {/* Spec grid */}
      <div style={{
        maxWidth: 900, width: "100%",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
        gap: 10,
      }}>
        {specs.map((s, i) => (
          <Glass key={i} tilt padding="16px 20px">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Category label */}
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: T.textMute, letterSpacing: "0.2em", textTransform: "uppercase",
                minWidth: 56,
              }}>
                {s.cat}
              </div>
              {/* Vertical rule */}
              <div style={{ width: 1, height: 32, background: T.border, flexShrink: 0 }} />
              {/* Name + sub */}
              <div>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 500,
                  fontSize: 13, color: T.textPri, lineHeight: 1.3,
                }}>
                  {s.name}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  color: T.textSec, marginTop: 3,
                }}>
                  {s.sub}
                </div>
              </div>
            </div>
          </Glass>
        ))}
      </div>
    </Section>
  );
}

// ───────────────────────────────────────────────────────────────
//  SECTION 5: Journey — vertical timeline, alternating
// ───────────────────────────────────────────────────────────────
function JourneySection() {
  const events = [
    { year: "2022", title: "The Spark",       body: "First time opening a PC case. Fell in love with the hardware. No turning back.", done: true },
    { year: "2023", title: "Gaming Arc",       body: "Dove deep into competitive gaming. First peripherals. First losses worth celebrating.", done: true },
    { year: "2024", title: "Editing Era",      body: "Picked up a video editor. Discovered the power of a well-timed cut.", done: true },
    { year: "2025", title: "Creator Mode",     body: "Launched social channels. Started posting. Found the audience in the void.", done: true },
    { year: "2026", title: "Code Initiated",   body: "Learning to code. Building small tools. Bending software to my will.", done: false, current: true },
    { year: "2027+", title: "The Long Game",   body: "Full-time creator. Custom studio. Systems running on my own software.", done: false },
  ];

  return (
    <Section id="journey">
      <Heading eyebrow="04 — Timeline" title="The Journey" />
      <div style={{ maxWidth: 680, width: "100%", position: "relative" }}>
        {/* Spine */}
        <div style={{
          position: "absolute", left: "50%", top: 0, bottom: 0,
          width: 1, background: `linear-gradient(to bottom, transparent, ${T.border}, ${T.border}, transparent)`,
          transform: "translateX(-50%)",
        }} />

        {events.map((ev, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: i % 2 === 0 ? "flex-end" : "flex-start",
            paddingRight: i % 2 === 0 ? "calc(50% + 32px)" : 0,
            paddingLeft:  i % 2 === 1 ? "calc(50% + 32px)" : 0,
            marginBottom: 28, position: "relative",
          }}>
            {/* Node */}
            <div style={{
              position: "absolute", left: "50%", top: 22,
              transform: "translateX(-50%)",
              width: ev.current ? 10 : 7, height: ev.current ? 10 : 7,
              borderRadius: "50%",
              background: ev.done || ev.current ? T.white : T.elevated,
              border: `1px solid ${ev.done || ev.current ? T.white : T.border}`,
              boxShadow: ev.current ? "0 0 10px rgba(255,255,255,0.6)" : "none",
              zIndex: 2,
            }} />

            <Glass tilt style={{ maxWidth: 260 }} padding="18px 20px">
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: T.textSec, letterSpacing: "0.18em", marginBottom: 6,
              }}>
                {ev.year}{ev.current && " ← NOW"}
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                fontSize: 15, color: T.white, marginBottom: 8, letterSpacing: "-0.01em",
              }}>
                {ev.title}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13,
                color: T.textSec, lineHeight: 1.65,
              }}>
                {ev.body}
              </div>
            </Glass>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ───────────────────────────────────────────────────────────────
//  SECTION 6: Projects
// ───────────────────────────────────────────────────────────────
function ProjectsSection() {
  const items = [
    { title: "Void Clips",       tag: "Editing",        note: "Short-form experiments — transitions, pacing, colour grading.", status: "WIP" },
    { title: "RGB Dashboard",    tag: "Coding",         note: "Local web UI for my RGB setup. Learning React by shipping.", status: "Concept" },
    { title: "PC Build Log",     tag: "Hardware",       note: "Full build documented — from unboxing to POST.", status: "Live" },
    { title: "AI Pipeline",      tag: "AI Tools",       note: "Runway + ElevenLabs workflow to speed up editing by 3×.", status: "Active" },
    { title: "Gaming Montage",   tag: "Edit + Gaming",  note: "First full highlight reel. Ranked grind. Proud of this one.", status: "Done" },
    { title: "This Site",        tag: "Web Dev",        note: "My own portfolio. Built to learn React.", status: "Live" },
  ];

  const statusColor = { Live: T.white, Done: T.white, Active: T.textPri, WIP: T.textSec, Concept: T.textSec };

  return (
    <Section id="projects">
      <Heading eyebrow="05 — Work" title="Projects" />
      <div style={{
        maxWidth: 980, width: "100%",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {items.map((p, i) => (
          <Glass key={i} tilt>
            {/* Status */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: statusColor[p.status] || T.textSec,
              letterSpacing: "0.18em", textTransform: "uppercase",
              marginBottom: 18,
            }}>
              <span style={{
                width: 4, height: 4, borderRadius: "50%",
                background: statusColor[p.status] || T.textSec,
                display: "inline-block",
                boxShadow: (p.status === "Live" || p.status === "Active") ? "0 0 6px rgba(255,255,255,0.5)" : "none",
              }} />
              {p.status}
            </div>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
              fontSize: 18, color: T.white, margin: "0 0 4px",
              letterSpacing: "-0.02em",
            }}>{p.title}</h3>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: T.textSec, marginBottom: 14, letterSpacing: "0.1em",
            }}>{p.tag}</div>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              color: T.textSec, lineHeight: 1.7, margin: 0,
            }}>{p.note}</p>
          </Glass>
        ))}
      </div>
    </Section>
  );
}

// ───────────────────────────────────────────────────────────────
//  SVG ICONS — pixel-precise, stroke-only, monochrome
// ───────────────────────────────────────────────────────────────

// Instagram: rounded square frame + lens circle + top-right dot
function IconInstagram({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.4" cy="6.6" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}

// Telegram: clean paper-plane / send arrow
function IconTelegram({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// Discord: controller/headset silhouette — recognizable outline
function IconDiscord({ size = 24, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Body arch */}
      <path d="M9 11.5C9 12.33 8.33 13 7.5 13S6 12.33 6 11.5 6.67 10 7.5 10 9 10.67 9 11.5z" fill={color} stroke="none" />
      <path d="M18 11.5C18 12.33 17.33 13 16.5 13S15 12.33 15 11.5 15.67 10 16.5 10 18 10.67 18 11.5z" fill={color} stroke="none" />
      {/* Main silhouette */}
      <path d="M8.5 3.5C8.5 3.5 6 4 4 6C2.5 9.5 2 13.5 2 13.5C3.5 15.5 6 16.5 6 16.5L7 14.5" />
      <path d="M15.5 3.5C15.5 3.5 18 4 20 6C21.5 9.5 22 13.5 22 13.5C20.5 15.5 18 16.5 18 16.5L17 14.5" />
      <path d="M7 14.5C7 14.5 9 15.5 12 15.5C15 15.5 17 14.5 17 14.5" />
      <path d="M8.5 3.5C9.5 3.2 10.7 3 12 3C13.3 3 14.5 3.2 15.5 3.5" />
      <path d="M7 14.5L8 20L12 21L16 20L17 14.5" />
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────
//  SECTION 7: Socials
// ───────────────────────────────────────────────────────────────
function SocialsSection() {
  const links = [
    {
      name: "Instagram",
      handle: "@voidzxtr.exe",
      url: "https://www.instagram.com/voidzxtr.exe",
      Icon: IconInstagram,
      breatheDuration: "2.6s",
    },
    {
      name: "Telegram",
      handle: "@voidXatrix_zudz",
      url: "https://t.me/voidXatrix_zudz",
      Icon: IconTelegram,
      breatheDuration: "3.0s",
    },
    {
      name: "Discord",
      handle: "make me friend",
      url: "https://discord.gg/wDRGGFte",
      Icon: IconDiscord,
      breatheDuration: "3.4s",
    },
  ];

  return (
    <Section id="socials" style={{ minHeight: "80vh" }}>
      <Heading eyebrow="06 — Contact" title="Find Me" />

      <div style={{
        display: "flex", gap: 20, flexWrap: "wrap",
        justifyContent: "center", maxWidth: 860, width: "100%",
      }}>
        {links.map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", flex: "1 1 200px", maxWidth: 264 }}
          >
            <Glass tilt padding="34px 28px" style={{ textAlign: "center", cursor: "pointer" }}>

              {/* Icon badge */}
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                border: `1px solid ${T.border}`,
                background: "rgba(255,255,255,0.03)",
                margin: "0 auto 22px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.white,
                animation: `vx-breathe ${l.breatheDuration} ease-in-out infinite`,
              }}>
                <l.Icon size={22} color={T.white} />
              </div>

              {/* Platform */}
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                fontSize: 15, color: T.white, marginBottom: 7, letterSpacing: "-0.01em",
              }}>
                {l.name}
              </div>

              {/* Handle */}
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                color: T.textSec, letterSpacing: "0.08em",
              }}>
                {l.handle}
              </div>

              {/* Open link row */}
              <div style={{
                marginTop: 20, paddingTop: 16,
                borderTop: `1px solid ${T.border}`,
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: T.textMute, letterSpacing: "0.2em",
              }}>
                OPEN
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
                  stroke={T.textMute} strokeWidth="1.2" strokeLinecap="round">
                  <line x1="1" y1="8" x2="8" y2="1" />
                  <polyline points="3.5,1 8,1 8,5.5" />
                </svg>
              </div>
            </Glass>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 88, textAlign: "center", width: "100%", maxWidth: 860 }}>
        <div style={{ height: 1, background: T.border, marginBottom: 28 }} />
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
          fontSize: 13, letterSpacing: "0.28em", color: T.textMute,
          textTransform: "uppercase", marginBottom: 8,
        }}>
          VOID ZUDZ
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: T.textMute, letterSpacing: "0.12em",
        }}>
          © 2026 — Built in the void
        </div>
      </div>
    </Section>
  );
}

// ───────────────────────────────────────────────────────────────
//  ROOT
// ───────────────────────────────────────────────────────────────
export default function App() {
  const [loaded,  setLoaded]  = useState(false);
  const [active,  setActive]  = useState("hero");

  // Section tracking
  useEffect(() => {
    if (!loaded) return;
    const ids = ["hero","about","skills","setup","journey","projects","socials"];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { threshold: 0.35 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [loaded]);

  return (
    <>
      {/* ── Global CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0; padding: 0;
          background: ${T.bg};
          color: ${T.textPri};
          cursor: none;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

        /* Reveal */
        .vx-section {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
        }
        .vx-section.vx-revealed { opacity: 1; transform: translateY(0); }

        /* Scanner — plays once */
        @keyframes vx-scan {
          0%   { top: 0; opacity: 1; }
          85%  { opacity: 0.6; }
          100% { top: 100vh; opacity: 0; }
        }
        .vx-scanner { animation: vx-scan 1.8s cubic-bezier(0.16,1,0.3,1) 0.3s forwards; }

        /* Pulse dot */
        @keyframes vx-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        /* Floating drip */
        @keyframes vx-drip {
          0%   { transform: scaleY(0); transform-origin: top; opacity: 0; }
          30%  { transform: scaleY(1); opacity: 1; }
          70%  { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
        }

        /* Breathe */
        @keyframes vx-breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.03); }
          50%       { box-shadow: 0 0 20px 4px rgba(255,255,255,0.06); }
        }

        /* Spin */
        @keyframes vx-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* Remove default button outline */
        button:focus-visible { outline: 1px solid rgba(255,255,255,0.4); outline-offset: 3px; }

        /* Responsive nav collapse */
        @media (max-width: 640px) {
          nav > div:last-child { display: none; }
        }
      `}</style>

      {/* Background depth gradient */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 90% 50% at 15% 20%, rgba(255,255,255,0.025) 0%, transparent 55%),
          radial-gradient(ellipse 70% 40% at 85% 75%, rgba(255,255,255,0.018) 0%, transparent 55%),
          ${T.bg}
        `,
      }} />

      {/* Dust particles */}
      <DustField />

      {/* Custom cursor */}
      <MonoCursor />

      {/* Loading screen */}
      {!loaded && <Loader onDone={() => setLoaded(true)} />}

      {/* Site */}
      {loaded && (
        <>
          <Navbar active={active} />
          <main>
            <HeroSection />
            <AboutSection />
            <SkillsSection />
            <SetupSection />
            <JourneySection />
            <ProjectsSection />
            <SocialsSection />
          </main>
        </>
      )}
    </>
  );
}
