/*
  Audience Project Dashboard — Reusable UI Components
  Built on QuestionPro Design System (window.QPUI + window.QuestionProDesignSystem_8f51d4)
*/

/* ── Inject keyframes once ── */
(() => {
  if (document.getElementById("dc-global-styles")) return;
  const s = document.createElement("style");
  s.id = "dc-global-styles";
  s.textContent = `
    @keyframes dcPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.45; transform: scale(1.5); }
    }
    @keyframes dcFadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .dc-fade-in { animation: dcFadeIn .22s ease both; }
    .dc-card-hover:hover {
      border-color: var(--qp-electric-blue) !important;
      box-shadow: var(--shadow-md) !important;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--qp-gray-40); border-radius: 9999px; }
  `;
  document.head.appendChild(s);
})();

const { Button: _QBtn, Avatar: _QAvatar } = window.QPUI;

/* ══════════════════════════════════════════
   STATUS CHIP
══════════════════════════════════════════ */
const StatusChip = ({ status }) => {
  const conf = {
    Live:      { bg: "var(--qp-success-soft)", fg: "var(--qp-success-deep)", dot: true  },
    Paused:    { bg: "var(--qp-warning-soft)", fg: "var(--qp-warning-deep)", dot: false },
    Closed:    { bg: "var(--qp-error-soft)",   fg: "var(--qp-error-deep)",   dot: false },
    Draft:     { bg: "var(--qp-gray-20)",      fg: "var(--qp-gray-lead)",    dot: false },
    Completed: { bg: "var(--qp-info-soft)",    fg: "var(--qp-info-deep)",    dot: false },
  }[status] || { bg: "var(--qp-gray-10)", fg: "var(--qp-gray-lead)", dot: false };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 11px", borderRadius: "9999px",
      background: conf.bg, color: conf.fg,
      fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)",
      letterSpacing: "0.2px"
    }}>
      {conf.dot && (
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: conf.fg, display: "inline-block",
          animation: "dcPulse 2s ease-in-out infinite"
        }} />
      )}
      {status}
    </span>
  );
};

/* ══════════════════════════════════════════
   TREND BADGE
══════════════════════════════════════════ */
const TrendBadge = ({ delta, unit = "%", label = "vs assumed" }) => {
  const pos = delta > 0, neu = delta === 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 8px", borderRadius: "var(--radius-sm)",
      background: neu ? "var(--qp-gray-10)" : pos ? "var(--qp-success-soft)" : "var(--qp-error-soft)",
      color: neu ? "var(--text-muted)" : pos ? "var(--qp-success-deep)" : "var(--qp-error-deep)",
      fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)"
    }}>
      {!neu && <span style={{ fontSize: 12, lineHeight: 1 }}>{pos ? "↑" : "↓"}</span>}
      {Math.abs(delta)}{unit} {label}
    </span>
  );
};

/* ══════════════════════════════════════════
   SPARKLINE
══════════════════════════════════════════ */
const Sparkline = ({ data, width = 100, height = 32, color = "var(--qp-electric-blue)" }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 6) + 3;
    const y = height - 4 - ((v - min) / range) * (height - 10);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ flexShrink: 0, display: "block" }}>
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r="2.5" fill={color} />
    </svg>
  );
};

/* ══════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════ */
const ProgressBar = ({ pct, color = "var(--qp-electric-blue)", height = 8, animated = false }) => (
  <div style={{ height, borderRadius: "9999px", background: "var(--qp-gray-20)", overflow: "hidden", position: "relative" }}>
    <div style={{
      height: "100%", borderRadius: "9999px",
      width: `${Math.min(100, Math.max(0, pct))}%`,
      background: color,
      transition: animated ? "width 1s cubic-bezier(.4,0,.2,1)" : undefined,
    }} />
  </div>
);

/* ══════════════════════════════════════════
   KPI CARD
══════════════════════════════════════════ */
const KPICard = ({ label, value, sub, iconClass, iconBg, iconFg, trend, sparkData, compact = false, accentPct }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        border: `1px solid ${hov ? "var(--qp-electric-blue)" : "var(--border-default)"}`,
        borderRadius: "var(--radius-md)",
        padding: compact ? "12px 14px" : "16px 18px",
        display: "flex", flexDirection: "column", gap: compact ? 6 : 10,
        boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-xs)",
        transition: "border-color .15s, box-shadow .15s",
        cursor: "default", minWidth: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
        <span style={{
          fontSize: 12, fontWeight: 500, color: "var(--text-muted)",
          fontFamily: "var(--font-sans)", lineHeight: 1.4,
        }}>
          {label}
        </span>
        {iconClass && (
          <span style={{
            width: 30, height: 30, borderRadius: "var(--radius-sm)", flexShrink: 0,
            background: iconBg || "var(--qp-info-soft)",
            color: iconFg || "var(--qp-info-deep)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>
            <span className={iconClass} style={{ fontSize: 16 }} />
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: compact ? 20 : 26,
            lineHeight: 1.1, color: "var(--text-strong)", whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {value}
          </div>
          {sub && (
            <div style={{
              fontSize: 12, color: "var(--text-muted)", marginTop: 3,
              fontFamily: "var(--font-sans)", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {sub}
            </div>
          )}
        </div>
        {sparkData && <Sparkline data={sparkData} width={72} height={compact ? 24 : 30} />}
      </div>

      {accentPct !== undefined && (
        <ProgressBar pct={accentPct} height={3} color={iconFg || "var(--qp-electric-blue)"} animated />
      )}

      {trend && <div style={{ marginTop: -4 }}>{trend}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════
   PROGRESS SECTION
══════════════════════════════════════════ */
const ProgressSection = ({ collected, required, velocity, etcDate, daysElapsed, sparkData }) => {
  const pct = (collected / required) * 100;
  const remaining = required - collected;
  const budgetUsed = (collected * 1.57 / 4710 * 100);

  return (
    <div style={{
      background: "#fff", border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)", padding: "20px 24px",
      boxShadow: "var(--shadow-xs)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 500, color: "var(--text-strong)" }}>
            Collection progress
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            {collected.toLocaleString()} of {required.toLocaleString()} target responses collected
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {sparkData && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                14-day trend
              </span>
              <Sparkline data={sparkData} width={130} height={36} color="var(--qp-electric-blue)" />
            </div>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 32, fontWeight: 400, color: "var(--qp-electric-blue)", lineHeight: 1 }}>
              {pct.toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 2 }}>
              complete
            </div>
          </div>
        </div>
      </div>

      <ProgressBar pct={pct} height={10} animated />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
        {[
          { label: "Remaining",      value: remaining.toLocaleString(),      icon: "wm-hourglass-empty", color: "var(--qp-electric-blue)" },
          { label: "Responses / hr",  value: `${velocity}/hr`,              icon: "wm-speed",            color: "var(--qp-success-deep)" },
          { label: "Est. completion", value: etcDate,                       icon: "wm-event",            color: "var(--qp-warning-deep)" },
          { label: "Days elapsed",    value: `${daysElapsed} days`,         icon: "wm-calendar-today",   color: "var(--text-muted)" },
        ].map(s => (
          <div key={s.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", background: "var(--qp-gray-10)", borderRadius: "var(--radius-sm)",
          }}>
            <span className={s.icon} style={{ fontSize: 22, color: s.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, color: "var(--text-strong)" }}>
                {s.value}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)" }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   QUOTA BAR
══════════════════════════════════════════ */
const QuotaBar = ({ label, flag, collected, target }) => {
  const pct = (collected / target) * 100;
  const color = pct >= 90 ? "var(--qp-success-deep)" : pct >= 50 ? "var(--qp-electric-blue)" : "var(--qp-warning-deep)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--text-body)", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 6 }}>
          {flag} {label}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
          <strong style={{ color: "var(--text-strong)", fontWeight: 500 }}>{collected.toLocaleString()}</strong>
          /{target.toLocaleString()}
          <span style={{ color, fontWeight: 500, marginLeft: 4 }}>({Math.round(pct)}%)</span>
        </span>
      </div>
      <ProgressBar pct={pct} color={color} height={5} />
    </div>
  );
};

/* ══════════════════════════════════════════
   TAG / CHIP
══════════════════════════════════════════ */
const Tag = ({ children, color = "default" }) => {
  const p = {
    blue:    ["var(--qp-info-soft)",    "var(--qp-info-deep)"],
    green:   ["var(--qp-success-soft)", "var(--qp-success-deep)"],
    warning: ["var(--qp-warning-soft)", "var(--qp-warning-deep)"],
    default: ["var(--qp-gray-10)",      "var(--qp-gray-lead)"],
  }[color] || ["var(--qp-gray-10)", "var(--qp-gray-lead)"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: "var(--radius-sm)",
      background: p[0], color: p[1],
      fontSize: 12, fontFamily: "var(--font-sans)", lineHeight: "18px",
    }}>
      {children}
    </span>
  );
};

/* ══════════════════════════════════════════
   CRITERIA CARD (collapsible)
══════════════════════════════════════════ */
const CriteriaCard = ({ title, iconClass, iconBg, iconFg, children, initialOpen = true }) => {
  const [open, setOpen] = React.useState(initialOpen);
  const [hov, setHov] = React.useState(false);
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-xs)",
    }}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 16px", background: hov ? "var(--qp-gray-10)" : "#fff",
          border: "none", borderBottom: open ? "1px solid var(--border-subtle)" : "none",
          cursor: "pointer", transition: "background .12s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 28, height: 28, borderRadius: "var(--radius-sm)", flexShrink: 0,
            background: iconBg, color: iconFg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className={iconClass} style={{ fontSize: 15 }} />
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, color: "var(--text-strong)" }}>
            {title}
          </span>
        </div>
        <span className={open ? "wm-expand-less" : "wm-expand-more"} style={{ fontSize: 20, color: "var(--text-muted)" }} />
      </button>
      {open && (
        <div style={{ padding: "14px 16px" }} className="dc-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   APP HEADER
══════════════════════════════════════════ */
const AppHeader = ({ projectName, onTweaks, tweaksOpen }) => (
  <header style={{
    background: "var(--qp-dark-blue)", height: 52,
    display: "flex", alignItems: "center", padding: "0 16px", gap: 10,
    fontFamily: "var(--font-sans)", position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
  }}>
    <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }} aria-label="Products">
      <span className="wm-home" style={{ fontSize: 21 }} />
    </button>
    <div style={{ width: 1, height: 20, background: "rgba(255,255,255,.2)", flexShrink: 0 }} />
    <button style={{
      display: "flex", alignItems: "center", gap: 4,
      background: "rgba(255,255,255,.12)", border: "none", color: "#fff",
      cursor: "pointer", padding: "3px 10px", borderRadius: 4, height: 30,
    }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>Audience</span>
      <span className="wm-arrow-drop-down" style={{ fontSize: 18, opacity: 0.8 }} />
    </button>
    <nav style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,.55)" }}>
      <a href="#" style={{ color: "var(--qp-electric-blue)", textDecoration: "none" }}>My projects</a>
      <span style={{ fontSize: 13, opacity: 0.5 }}>›</span>
      <span style={{ color: "rgba(255,255,255,.9)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{projectName}</span>
    </nav>
    <div style={{ flex: 1 }} />
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(255,255,255,.1)", borderRadius: 4,
      padding: "0 10px", height: 30, width: 190,
    }}>
      <span className="wm-search" style={{ fontSize: 16, color: "rgba(255,255,255,.6)" }} />
      <input placeholder="Search" style={{
        flex: 1, background: "transparent", border: "none", outline: "none",
        color: "#fff", fontFamily: "var(--font-sans)", fontSize: 12, width: 0,
      }} />
    </div>
    <button
      onClick={onTweaks}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        background: tweaksOpen ? "rgba(27,135,230,.35)" : "rgba(255,255,255,.1)",
        border: `1px solid ${tweaksOpen ? "var(--qp-electric-blue)" : "rgba(255,255,255,.15)"}`,
        color: "#fff", cursor: "pointer", padding: "4px 11px", borderRadius: 4,
        fontSize: 12, fontFamily: "var(--font-sans)", transition: "background .15s",
      }}
    >
      <span className="wm-tune" style={{ fontSize: 15 }} /> Tweaks
    </button>
    <span className="wm-help" style={{ fontSize: 20, color: "rgba(255,255,255,.7)", cursor: "pointer" }} />
    <span className="wm-notifications" style={{ fontSize: 20, color: "rgba(255,255,255,.7)", cursor: "pointer" }} />
    <_QAvatar name="Rachel K" size={28} color="var(--qp-electric-blue)" />
  </header>
);

/* ══════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════ */
const Sidebar = () => {
  const [active, setActive] = React.useState(1);
  const topItems = [
    { icon: "wm-menu",                  label: "Menu"      },
    { icon: "wm-format-list-bulleted",  label: "Projects"  },
    { icon: "wm-dashboard",             label: "Dashboard" },
    { icon: "wm-apps",                  label: "Apps"      },
  ];
  const btmItems = [
    { icon: "wm-person",   label: "Account"  },
    { icon: "wm-security", label: "Security" },
    { icon: "wm-settings", label: "Settings" },
  ];
  const btn = (isActive, onClick, icon, label, key) => {
    const [h, setH] = React.useState(false);
    return (
      <button key={key} onClick={onClick} aria-label={label}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 6, border: "none", cursor: "pointer", margin: "0 auto",
          background: isActive ? "var(--qp-electric-blue)" : h ? "var(--qp-gray-25)" : "transparent",
          color: isActive ? "#fff" : "var(--qp-gray-lead)", transition: "background .12s, color .12s",
        }}>
        <span className={icon} style={{ fontSize: 20 }} />
      </button>
    );
  };
  return (
    <aside style={{
      width: 52, background: "var(--qp-gray-20)", flexShrink: 0,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "6px 0", gap: 1, borderRight: "1px solid var(--border-default)",
    }}>
      {topItems.map((it, i) => btn(active === i, () => setActive(i), it.icon, it.label, i))}
      <div style={{ flex: 1 }} />
      {btmItems.map((it, i) => btn(false, () => {}, it.icon, it.label, `b${i}`))}
    </aside>
  );
};

/* ── Export ── */
Object.assign(window, {
  DC: {
    AppHeader, Sidebar,
    StatusChip, TrendBadge, Sparkline, ProgressBar,
    KPICard, ProgressSection, QuotaBar, Tag, CriteriaCard,
  },
});
