/*
  Audience Dashboard — USA Single-Country v3
  6-card top row: Required · CPI · IR (stacked) · LOI (stacked) · Collected · Budget
  Scenarios: Draft · Live · Paused · Closed
*/

const {
  Card: _Card, CardHeader: _CardHeader,
  Chip: _Chip, Toggle: _Toggle, Avatar: _QAvatar3,
} = window.QuestionProDesignSystem_8f51d4;

const { Button: _Btn, Input: _Input } = window.QPUI;
const { Sidebar, TrendBadge, ProgressBar, ProgressSection } = window.DC;

/* ══════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════ */
const SURVEYv3 = {
  name:        "US Customer Experience Study Q2 2026",
  id:          "QP-M6548",
  client:      "Apex Retail — Consumer Insights",
  launchDate:  "Jun 2, 2026",
  dueDate:     "Jun 30, 2026",
  etcDate:     "Jun 26, 2026",
  daysElapsed: 8,
};

const BASEv3 = {
  collected:   614,
  required:    1500,
  assumedIR:   72,
  realtimeIR:  74,
  assumedLOI:  8.0,
  realtimeLOI: 7.5,
  cpi:         1.20,
  budget:      1800,
};

const DEMO_AGES3      = ["18–24", "25–34", "35–44", "45–54", "55–65"];
const DEMO_GENDERS3   = ["Male", "Female", "Non-binary / other"];
const DEMO_EDUCATION3 = ["High school", "Some college", "Bachelor's degree", "Graduate degree"];
const DEMO_INCOME3    = ["Under $35K", "$35K–$75K", "$75K–$150K", "Over $150K"];

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const StatusBadge3 = ({ status }) => {
  const MAP = {
    Draft:  { color: undefined, label: "Draft"  },
    Live:   { color: "success", label: "Live", dot: true },
    Paused: { color: "warning", label: "Paused" },
    Closed: { color: "danger",  label: "Closed" },
  };
  const conf = MAP[status] || { label: status };
  return (
    <_Chip color={conf.color} shape="rounded" size="sm" style={{ fontWeight: 500 }}>
      {conf.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--qp-success-deep)", display: "inline-block", animation: "dcPulse 2s infinite", marginRight: 2 }} />}
      {conf.label}
    </_Chip>
  );
};

const DemoTag3 = ({ children, blue }) => (
  <_Chip size="sm" style={blue ? { background: "var(--qp-info-soft)", color: "var(--qp-info-deep)", border: "1px solid transparent" } : {}}>
    {children}
  </_Chip>
);

/* ══════════════════════════════════════════
   COMBO BUTTON
══════════════════════════════════════════ */
const ComboButton3 = ({ mainLabel, mainIcon, onMain, dropItems = [] }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <_Btn variant="outline" Icon={<span className={mainIcon} style={{ fontSize: 16 }} />} onClick={onMain}
        style={dropItems.length ? { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: "none" } : {}}>
        {mainLabel}
      </_Btn>
      {dropItems.length > 0 && (
        <>
          <div style={{ width: 1, background: "var(--border-default)", alignSelf: "stretch" }} />
          <_Btn variant="outline" iconOnly Icon={<span className="wm-arrow-drop-down" style={{ fontSize: 18 }} />}
            onClick={() => setOpen(o => !o)}
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: "none", minWidth: 30, padding: "0 4px" }} />
          {open && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", minWidth: 185, zIndex: 50, overflow: "hidden" }}>
              {dropItems.map(item => (
                <button key={item.label} onClick={() => { item.onClick(); setOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: item.danger ? "var(--qp-error-deep)" : "var(--text-body)", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--qp-gray-10)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span className={item.icon} style={{ fontSize: 16 }} /> {item.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   PROJECT HEADER
══════════════════════════════════════════ */
const ProjectHeader3 = ({ status, onAction }) => {
  const isDraft = status === "Draft";
  const pauseConf = {
    Live:   { label: "Pause survey",  icon: "wm-pause"      },
    Paused: { label: "Resume survey", icon: "wm-play-arrow" },
  }[status];
  const dropItems = (status === "Live" || status === "Paused")
    ? [{ label: "Close survey", icon: "wm-cancel", danger: true, onClick: () => onAction("close") }] : [];
  const metaItems = isDraft
    ? [{ icon: "wm-tag", text: `#${SURVEYv3.id}` }, { icon: "wm-person", text: SURVEYv3.client }, { icon: "wm-event", text: `Due ${SURVEYv3.dueDate}` }]
    : [{ icon: "wm-tag", text: `#${SURVEYv3.id}` }, { icon: "wm-person", text: SURVEYv3.client }, { icon: "wm-rocket-launch", text: `Launched ${SURVEYv3.launchDate}` }, { icon: "wm-event", text: `Due ${SURVEYv3.dueDate}` }];
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 22, paddingBottom: 20, borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 400, color: "var(--text-strong)", lineHeight: 1.2 }}>{SURVEYv3.name}</h1>
          <StatusBadge3 status={status} />
          <_Chip size="sm" shape="rounded" style={{ background: "var(--qp-gray-10)", color: "var(--text-muted)", border: "1px solid var(--border-default)" }}>United States only</_Chip>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
          {metaItems.map(m => (
            <span key={m.text} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className={m.icon} style={{ fontSize: 15 }} />{m.text}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isDraft && <_Btn variant="outline" Icon={<span className="wm-edit" style={{ fontSize: 16 }} />} onClick={() => onAction("edit")}>Edit</_Btn>}
        {isDraft && <_Btn variant="primary" Icon={<span className="wm-rocket-launch" style={{ fontSize: 16 }} />} onClick={() => onAction("launch")}>Launch survey</_Btn>}
        {status === "Closed" && (
          <_Btn variant="outline" disabled Icon={<span className="wm-cancel" style={{ fontSize: 16 }} />}>Closed</_Btn>
        )}
        {!isDraft && status !== "Closed" && pauseConf && <ComboButton3 mainLabel={pauseConf.label} mainIcon={pauseConf.icon} onMain={() => onAction("pause")} dropItems={dropItems} />}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   STANDARD KPI CARD (single value)
══════════════════════════════════════════ */
const KPICard3 = ({ label, value, sub, iconClass, iconBg, iconFg, accentPct, muted, compact }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <_Card
      style={{ padding: 0, display: "flex", flexDirection: "column", borderColor: hov ? "var(--qp-electric-blue)" : "var(--border-default)", boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-xs)", transition: "border-color .15s, box-shadow .15s", minWidth: 0, height: "100%" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <_CardHeader style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
        {iconClass && (
          <span style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", flexShrink: 0, background: iconBg, color: iconFg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className={iconClass} style={{ fontSize: 16 }} />
          </span>
        )}
        {label}
      </_CardHeader>
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3, justifyContent: "flex-start" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 22, lineHeight: 1.1, color: muted ? "var(--qp-gray-40)" : "var(--text-strong)" }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-sans)" }}>{sub}</div>}
      </div>
      {accentPct !== undefined && (
        <div style={{ padding: "0 14px 10px" }}>
          <ProgressBar pct={accentPct} height={3} color={iconFg || "var(--qp-electric-blue)"} animated />
        </div>
      )}
    </_Card>
  );
};

/* ══════════════════════════════════════════
   STACKED KPI CARD — two segments top/bottom
   Used for IR and LOI
══════════════════════════════════════════ */
const StackedKPICard = ({ title, iconClass, iconBg, iconFg, top, bottom, launched }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <_Card
      style={{ borderColor: hov ? "var(--qp-electric-blue)" : "var(--border-default)", boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-xs)", transition: "border-color .15s, box-shadow .15s", height: "100%", display: "flex", flexDirection: "column" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Card title */}
      <_CardHeader style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
        <span style={{ width: 22, height: 22, borderRadius: "var(--radius-sm)", background: iconBg, color: iconFg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span className={iconClass} style={{ fontSize: 12 }} />
        </span>
        {title}
      </_CardHeader>

      {/* Top segment — Assumed (always shown) */}
      <div style={{ flex: 1, padding: "12px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
          {top.label}
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 400, color: "var(--text-strong)", lineHeight: 1.1 }}>
          {top.value}
        </div>
        {top.sub && <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>{top.sub}</div>}
      </div>

      {/* Bottom segment — Real-time (placeholder when not launched) */}
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
          {bottom.label}
        </div>
        {launched ? (
          <>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 400, color: "var(--text-strong)", lineHeight: 1.1 }}>
              {bottom.value}
            </div>
            {bottom.trend && <div style={{ marginTop: 2 }}>{bottom.trend}</div>}
          </>
        ) : (
          <>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 400, color: "var(--qp-gray-40)", lineHeight: 1.1 }}>–</div>
            <div style={{ fontSize: 11, color: "var(--qp-gray-40)", fontFamily: "var(--font-sans)" }}>Available after launch</div>
          </>
        )}
      </div>
    </_Card>
  );
};

/* ══════════════════════════════════════════
   TOTAL COST CARD — split left/right
   Left: budget total · Right: CPI
══════════════════════════════════════════ */
const TotalCostCard3 = ({ budget, cpi, totalCost, isLaunched }) => {
  const [hov, setHov] = React.useState(false);
  const budgetPct = isLaunched ? (totalCost / budget) * 100 : 0;
  return (
    <_Card
      style={{ borderColor: hov ? "var(--qp-electric-blue)" : "var(--border-default)", boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-xs)", transition: "border-color .15s, box-shadow .15s", height: "100%", display: "flex", flexDirection: "column" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <_CardHeader style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", background: "var(--qp-error-soft)", color: "var(--qp-error-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span className="wm-account-balance-wallet" style={{ fontSize: 16 }} />
        </span>
        Total cost
      </_CardHeader>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1 }}>
        {/* Left — budget total */}
        <div style={{ padding: "12px 14px", borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 400, color: "var(--text-strong)", lineHeight: 1.1 }}>
            ${budget.toLocaleString()}
          </div>
          {isLaunched && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent
            </div>
          )}
        </div>

        {/* Right — CPI */}
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>CPI</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 400, color: "var(--text-strong)", lineHeight: 1.1 }}>
            ${cpi.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>Per interview</div>
        </div>
      </div>

      {isLaunched && (
        <div style={{ padding: "0 14px 10px" }}>
          <ProgressBar pct={budgetPct} height={3} color="var(--qp-error-deep)" animated />
        </div>
      )}
    </_Card>
  );
};

/* ══════════════════════════════════════════
   KPI ROW — 6 equal columns
   1 Required · 2 CPI · 3 IR (stacked) · 4 LOI (stacked) · 5 Collected · 6 Budget
══════════════════════════════════════════ */
const KPIRow3 = ({ metrics, compact, isLaunched }) => {
  const { collected, required, assumedIR, realtimeIR, assumedLOI, realtimeLOI, cpi, budget } = metrics;
  const totalCost = isLaunched ? collected * cpi : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14, alignItems: "stretch" }}>

      {/* 1 — Responses */}
      <KPICard3
        label="Responses"
        value={required.toLocaleString()}
        sub={isLaunched ? `${(required - collected).toLocaleString()} remaining` : "Target"}
        iconClass="wm-flag" iconBg="var(--qp-gray-10)" iconFg="var(--text-muted)"
        compact={compact}
      />

      {/* 2 — Incidence rate */}
      <KPICard3
        label="Incidence rate"
        value={`${assumedIR}%`}
        sub="Assumed IR"
        iconClass="wm-tune" iconBg="var(--qp-info-soft)" iconFg="var(--qp-info-deep)"
        compact={compact}
      />

      {/* 3 — Length of interview */}
      <KPICard3
        label="Length of interview"
        value={`${assumedLOI} min`}
        sub="Assumed LOI"
        iconClass="wm-schedule" iconBg="var(--qp-warning-soft)" iconFg="var(--qp-warning-deep)"
        compact={compact}
      />

      {/* 4 — Total cost */}
      <TotalCostCard3 budget={budget} cpi={cpi} totalCost={totalCost} isLaunched={isLaunched} />

    </div>
  );
};

/* ══════════════════════════════════════════
   CRITERIA CARD (collapsible)
══════════════════════════════════════════ */
const CriteriaCardDS3 = ({ title, iconClass, iconBg, iconFg, children, initialOpen = true }) => {
  const [open, setOpen] = React.useState(initialOpen);
  const [hov,  setHov]  = React.useState(false);
  return (
    <_Card style={{ overflow: "hidden" }}>
      <_CardHeader
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: hov ? "var(--qp-gray-10)" : "#fff", transition: "background .12s", borderBottom: open ? "1px solid var(--border-subtle)" : "none", padding: "13px 16px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: iconBg, color: iconFg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className={iconClass} style={{ fontSize: 15 }} />
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, color: "var(--text-strong)" }}>{title}</span>
        </div>
        <span className={open ? "wm-expand-less" : "wm-expand-more"} style={{ fontSize: 20, color: "var(--text-muted)" }} />
      </_CardHeader>
      {open && <div style={{ padding: "14px 16px" }} className="dc-fade-in">{children}</div>}
    </_Card>
  );
};

/* ══════════════════════════════════════════
   CRITERIA SECTION
══════════════════════════════════════════ */
const CriteriaSection3 = ({ layout }) => {
  const isAccordion = layout === "accordion";
  const sublabel = t => (
    <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>{t}</div>
  );
  const chipRow = (tags, blue = false) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {tags.map(t => <DemoTag3 key={t} blue={blue}>{t}</DemoTag3>)}
    </div>
  );
  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 500, color: "var(--text-strong)" }}>
        Launch criteria &amp; audience configuration
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: isAccordion ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
        <CriteriaCardDS3 title="Geography" iconClass="wm-public" iconBg="var(--qp-info-soft)" iconFg="var(--qp-info-deep)" initialOpen={!isAccordion}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              {sublabel("Country")}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--text-strong)" }}>United States</span>
                <DemoTag3 blue>Single country</DemoTag3>
              </div>
            </div>
            <div>{sublabel("Regions")}{chipRow(["Northeast", "South", "Midwest", "West"])}</div>
            <div>{sublabel("Scope")}<span style={{ fontSize: 13, color: "var(--text-body)", fontFamily: "var(--font-sans)" }}>All 50 states</span></div>
          </div>
        </CriteriaCardDS3>

        <CriteriaCardDS3 title="Demographics" iconClass="wm-people" iconBg="var(--qp-success-soft)" iconFg="var(--qp-success-deep)" initialOpen={!isAccordion}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[{ label: "Age groups", tags: DEMO_AGES3 }, { label: "Gender", tags: DEMO_GENDERS3 }, { label: "Education", tags: DEMO_EDUCATION3 }, { label: "Income", tags: DEMO_INCOME3 }].map(row => (
              <div key={row.label}>{sublabel(row.label)}{chipRow(row.tags)}</div>
            ))}
          </div>
        </CriteriaCardDS3>

        <CriteriaCardDS3 title="Qualification criteria" iconClass="wm-verified" iconBg="var(--qp-gray-10)" iconFg="var(--text-muted)" initialOpen={!isAccordion}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--qp-gray-10)", border: "1px dashed var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="wm-rule" style={{ fontSize: 22, color: "var(--text-muted)" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 260 }}>
              All panelists matching the demographic profile are eligible to respond.
            </p>
          </div>
        </CriteriaCardDS3>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   APP HEADER
══════════════════════════════════════════ */
const AppHeaderV3 = ({ projectName, onTweaks, tweaksOpen }) => (
  <header style={{ background: "var(--qp-dark-blue)", height: 52, display: "flex", alignItems: "center", padding: "0 16px", gap: 10, fontFamily: "var(--font-sans)", position: "sticky", top: 0, zIndex: 100, flexShrink: 0 }}>
    <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
      <span className="wm-home" style={{ fontSize: 21 }} />
    </button>
    <div style={{ width: 1, height: 20, background: "rgba(255,255,255,.2)", flexShrink: 0 }} />
    <button style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,.12)", border: "none", color: "#fff", cursor: "pointer", padding: "3px 10px", borderRadius: 4, height: 30 }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>Audience</span>
      <span className="wm-arrow-drop-down" style={{ fontSize: 18, opacity: 0.8 }} />
    </button>
    <nav style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,.55)" }}>
      <a href="#" style={{ color: "var(--qp-electric-blue)", textDecoration: "none" }}>My projects</a>
      <span style={{ opacity: 0.5 }}>›</span>
      <span style={{ color: "rgba(255,255,255,.9)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{projectName}</span>
    </nav>
    <div style={{ flex: 1 }} />
    <div style={{ width: 190 }}>
      <_Input placeholder="Search" LeadIcon={<span className="wm-search" style={{ fontSize: 16 }} />}
        style={{ height: 30, fontSize: 12, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", borderRadius: 4 }} />
    </div>
    <button onClick={onTweaks} style={{ display: "flex", alignItems: "center", gap: 5, background: tweaksOpen ? "rgba(27,135,230,.35)" : "rgba(255,255,255,.1)", border: `1px solid ${tweaksOpen ? "var(--qp-electric-blue)" : "rgba(255,255,255,.15)"}`, color: "#fff", cursor: "pointer", padding: "4px 11px", borderRadius: 4, fontSize: 12, fontFamily: "var(--font-sans)", transition: "background .15s" }}>
      <span className="wm-tune" style={{ fontSize: 15 }} /> Tweaks
    </button>
    <span className="wm-help"          style={{ fontSize: 20, color: "rgba(255,255,255,.7)", cursor: "pointer" }} />
    <span className="wm-notifications" style={{ fontSize: 20, color: "rgba(255,255,255,.7)", cursor: "pointer" }} />
    <_QAvatar3 name="Rachel K" size={28} color="var(--qp-electric-blue)" />
  </header>
);

/* ══════════════════════════════════════════
   TWEAKS PANEL
══════════════════════════════════════════ */
const TweaksPanel3 = ({ open, onClose, tweaks, setTweak }) => {
  if (!open) return null;
  const SegRow = ({ tKey, opts }) => (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {opts.map(opt => (
        <_Chip key={opt} size="sm" selected={tweaks[tKey] === opt} onClick={() => setTweak(tKey, opt)} style={{ cursor: "pointer", flex: 1, justifyContent: "center" }}>
          {opt}
        </_Chip>
      ))}
    </div>
  );
  const Row = ({ label, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      {children}
    </div>
  );
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200, width: 268, background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-lg)", fontFamily: "var(--font-sans)" }} className="dc-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 7 }}>
          <span className="wm-tune" style={{ fontSize: 17, color: "var(--qp-electric-blue)" }} /> Tweaks
        </span>
        <_Btn variant="ghost" iconOnly Icon={<span className="wm-close" style={{ fontSize: 18 }} />} onClick={onClose} size="sm" />
      </div>
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Row label="Scenario">
          <SegRow tKey="status" opts={["Draft", "Live", "Paused", "Closed"]} />
        </Row>
        <Row label="Compact cards">
          <_Toggle checked={tweaks.density === "Compact"} onChange={on => setTweak("density", on ? "Compact" : "Standard")} Label="Compact view" />
        </Row>
        <Row label="Criteria layout">
          <SegRow tKey="layout" opts={["Cards", "Accordion"]} />
        </Row>
        <Row label="Collection velocity">
          <SegRow tKey="rate" opts={["Fast", "Normal", "Slow"]} />
        </Row>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
const Toast3 = ({ msg, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [msg]);
  return (
    <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--qp-dark-blue)", color: "#fff", padding: "10px 22px", borderRadius: "var(--radius-md)", fontSize: 13, fontFamily: "var(--font-sans)", boxShadow: "var(--shadow-md)", zIndex: 300, whiteSpace: "nowrap" }} className="dc-fade-in">{msg}</div>
  );
};

/* ══════════════════════════════════════════
   APP ROOT
══════════════════════════════════════════ */
function AppV3() {
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [toast,      setToast]      = React.useState(null);
  const [liveCount,  setLiveCount]  = React.useState(BASEv3.collected);

  const [tweaks, setTweaksState] = React.useState(() => {
    try {
      const s = localStorage.getItem("qp-usa-v3-tweaks");
      return s ? JSON.parse(s) : { status: "Draft", density: "Standard", layout: "Cards", rate: "Normal" };
    } catch { return { status: "Draft", density: "Standard", layout: "Cards", rate: "Normal" }; }
  });

  const setTweak = (k, v) => setTweaksState(p => {
    const next = { ...p, [k]: v };
    localStorage.setItem("qp-usa-v3-tweaks", JSON.stringify(next));
    return next;
  });

  const isLaunched = tweaks.status !== "Draft";

  React.useEffect(() => {
    if (tweaks.status !== "Live") return;
    const velPerDay = { Fast: 180, Normal: 110, Slow: 55 }[tweaks.rate] || 110;
    const tickMs    = Math.max(4000, Math.min((86400 / velPerDay) * 1000 / 8, 12000));
    const t = setInterval(() => setLiveCount(c => c + 1), tickMs);
    return () => clearInterval(t);
  }, [tweaks.status, tweaks.rate]);

  const currentVel = { Fast: 7, Normal: 5, Slow: 2 }[tweaks.rate] || 5;
  const metrics    = { ...BASEv3, collected: liveCount };

  const handleAction = action => {
    if      (action === "launch") { setTweak("status", "Live"); setToast("Survey launched!"); }
    else if (action === "pause")  setTweak("status", tweaks.status === "Live" ? "Paused" : "Live");
    else if (action === "close")  { setTweak("status", "Closed"); setToast("Survey closed."); }
    else if (action === "edit")   setToast("Opening survey editor…");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <AppHeaderV3 projectName={SURVEYv3.name} onTweaks={() => setTweaksOpen(o => !o)} tweaksOpen={tweaksOpen} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "auto", background: "var(--surface-subtle)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "26px 28px 56px" }}>

            <ProjectHeader3 status={tweaks.status} onAction={handleAction} />

            <KPIRow3 metrics={metrics} compact={tweaks.density === "Compact"} isLaunched={isLaunched} />

            {isLaunched && tweaks.status !== "Closed" && (
              <div style={{ marginBottom: 20 }}>
                <ProgressSection
                  collected={liveCount}
                  required={BASEv3.required}
                  velocity={currentVel}
                  etcDate={SURVEYv3.etcDate}
                  daysElapsed={SURVEYv3.daysElapsed}
                />
              </div>
            )}

            <CriteriaSection3
              key={tweaks.layout}
              layout={tweaks.layout === "Accordion" ? "accordion" : "cards"}
            />

          </div>
        </main>
      </div>

      <TweaksPanel3 open={tweaksOpen} onClose={() => setTweaksOpen(false)} tweaks={tweaks} setTweak={setTweak} />
      {toast && <Toast3 msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppV3 />);
