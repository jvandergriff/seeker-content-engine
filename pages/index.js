import { useState, useEffect, useCallback } from "react";
import { PROPERTIES, STAGES, STAGE_IDS, STAGE_COLORS } from "../lib/properties";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function getNextStage(item) {
  const idx = STAGE_IDS.indexOf(item.stage);
  return idx === -1 || idx === STAGE_IDS.length - 1 ? null : STAGE_IDS[idx + 1];
}

function getSetupItems(prop) {
  const items = [];
  if (!prop.notionDbEnvKey)    items.push("Create Notion keyword DB + set env var");
  if (!prop.voiceGuideFileId)  items.push("Create voice guide in Google Drive");
  if (!prop.elementorMcp)      items.push("Connect Elementor MCP");
  return items;
}

function buildPrompt(prop, item, stage) {
  const s = prop.slug;
  if (stage === "draft")
    return `/get-voice ${s}\n\nThen:\n/create-blog-post ${s}\n\nTarget keyword: "${item.keyword}"\nCluster: ${item.cluster || "—"}\nPriority: ${item.priority || "—"}\nKD: ${item.kd ?? "—"} | Volume: ${item.volume?.toLocaleString() ?? "—"}`;
  if (stage === "edit")
    return `/send-to-editor ${s}\n\nDraft URL: ${item.draftUrl || "(paste draft URL)"}\nKeyword: "${item.keyword}"`;
  if (stage === "backlink")
    return `/count-backlinks ${s}\n\n(Upload WordPress XML export first)\n\nThen:\n/internal-backlinks ${s}\n\nTarget URL: ${item.publishedUrl || item.targetUrl || "(paste published URL)"}\nKeyword: "${item.keyword}"\nRequested backlinks: 8`;
  return "";
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ children, accent }) {
  const rgb = accent ? hexToRgb(accent) : null;
  return (
    <span style={{
      fontSize: "10px", padding: "1px 6px", borderRadius: "4px",
      background: rgb ? `rgba(${rgb},0.08)` : "#F3F4F6",
      color: accent || "#6B7280",
      border: `1px solid ${rgb ? `rgba(${rgb},0.2)` : "#E5E7EB"}`,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ContentEngine() {
  const [selectedSlug, setSelectedSlug] = useState("seeker");
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterStage,  setFilterStage]  = useState(null);
  const [toast,        setToast]        = useState(null);
  const [contentMap,   setContentMap]   = useState({
    seeker: [], boombrand: [], wildlifeconnect: [], salescast: [],
  });
  const [loadingMap, setLoadingMap] = useState({});
  const [errorMap,   setErrorMap]   = useState({});

  const prop     = PROPERTIES.find((p) => p.slug === selectedSlug);
  const rgb      = hexToRgb(prop.accent);
  const items    = contentMap[selectedSlug] || [];
  const filtered = filterStage ? items.filter((i) => i.stage === filterStage) : items;
  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.id] = items.filter((i) => i.stage === s.id).length;
    return acc;
  }, {});

  // Fetch from API route when switching to an active property
  useEffect(() => {
    if (prop.status !== "active") return;
    if (contentMap[prop.slug].length > 0) return;
    setLoadingMap((l) => ({ ...l, [prop.slug]: true }));
    setErrorMap((e) => ({ ...e, [prop.slug]: null }));
    fetch(`/api/keywords?property=${prop.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setContentMap((m) => ({ ...m, [prop.slug]: data.items }));
      })
      .catch((err) => setErrorMap((e) => ({ ...e, [prop.slug]: err.message })))
      .finally(() => setLoadingMap((l) => ({ ...l, [prop.slug]: false })));
  }, [selectedSlug]);

  const handleCopy = useCallback((text, label) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setToast(label || "Copied");
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleAdvance = useCallback((item) => {
    const next = getNextStage(item);
    if (!next) return;
    setContentMap((prev) => ({
      ...prev,
      [selectedSlug]: prev[selectedSlug].map((i) =>
        i.id === item.id ? { ...i, stage: next } : i
      ),
    }));
    setSelectedItem((prev) => (prev?.id === item.id ? { ...prev, stage: next } : prev));
  }, [selectedSlug]);

  const handleSelectProperty = (slug) => {
    setSelectedSlug(slug);
    setSelectedItem(null);
    setFilterStage(null);
  };

  const currentStageIdx = selectedItem ? STAGE_IDS.indexOf(selectedItem.stage) : -1;
  const nextStage       = selectedItem ? getNextStage(selectedItem) : null;
  const nextStageObj    = nextStage ? STAGES.find((s) => s.id === nextStage) : null;
  const isLoading       = loadingMap[selectedSlug];
  const hasError        = errorMap[selectedSlug];

  // ── Link style ──────────────────────────────────────────────────────────────
  const linkStyle = {
    display: "block", padding: "8px 11px", borderRadius: "7px", marginBottom: "5px",
    background: `rgba(${rgb},0.06)`, color: prop.accent,
    border: `1px solid rgba(${rgb},0.15)`, fontSize: "11px",
  };

  const promptStyle = {
    background: "#F8F9FB", borderRadius: "7px", padding: "12px",
    fontSize: "11px", color: "#374151", lineHeight: 1.6,
    border: "1px solid #E5E7EB", whiteSpace: "pre-wrap",
    marginBottom: "8px", wordBreak: "break-word",
    fontFamily: "'Poppins', sans-serif",
  };

  const primaryBtn = {
    width: "100%", padding: "9px", borderRadius: "7px",
    background: prop.accent, color: "#fff", border: "none",
    fontSize: "12px", fontWeight: "600", cursor: "pointer", marginBottom: "6px",
    fontFamily: "'Poppins', sans-serif",
  };

  const secondaryBtn = {
    width: "100%", padding: "8px", borderRadius: "7px",
    background: "transparent", color: prop.accent,
    border: `1px solid ${prop.accent}`, fontSize: "11px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'Poppins', sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB" }}>

      {/* ── Header ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E5E7EB",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: "52px",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "26px", height: "26px", borderRadius: "7px",
            background: prop.accent, display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: "13px",
          }}>🌐</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Seeker Worldwide
            </div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", lineHeight: 1.1 }}>Content Engine</div>
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
          {isLoading ? "Loading…" : `${items.length} pieces · ${prop.brand}`}
        </div>
      </div>

      {/* ── Property tabs ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E5E7EB",
        padding: "0 24px", display: "flex", gap: "2px", overflowX: "auto",
      }}>
        {PROPERTIES.map((p) => {
          const cnt    = (contentMap[p.slug] || []).length;
          const active = selectedSlug === p.slug;
          const pRgb   = hexToRgb(p.accent);
          return (
            <button key={p.slug} onClick={() => handleSelectProperty(p.slug)} style={{
              padding: "10px 14px", fontSize: "12px", fontWeight: active ? "600" : "400",
              color: active ? p.accent : "#6B7280", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "5px",
              background: "none", border: "none",
              borderBottom: active ? `2px solid ${p.accent}` : "2px solid transparent",
              whiteSpace: "nowrap",
            }}>
              {p.icon} {p.brand}
              <span style={{
                fontSize: "10px", fontWeight: "700", padding: "1px 5px", borderRadius: "10px",
                background: active ? `rgba(${pRgb},0.1)` : "#F3F4F6",
                color: active ? p.accent : "#9CA3AF",
              }}>
                {loadingMap[p.slug] ? "…" : cnt}
              </span>
              {p.status === "setup" && (
                <span style={{ fontSize: "9px", color: "#F59E0B" }}>setup</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main layout ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: selectedItem ? "1fr 360px" : "1fr",
        minHeight: "calc(100vh - 100px)",
      }}>

        {/* ── Left: content board ── */}
        <div style={{ padding: "20px 24px", borderRight: selectedItem ? "1px solid #E5E7EB" : "none" }}>

          {/* Stage filter pills */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
            <button onClick={() => setFilterStage(null)} style={{
              padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: !filterStage ? "600" : "400",
              cursor: "pointer", border: "1px solid #E5E7EB",
              background: !filterStage ? "#111827" : "#fff", color: !filterStage ? "#fff" : "#6B7280",
              fontFamily: "'Poppins', sans-serif",
            }}>
              All <strong>{items.length}</strong>
            </button>
            {STAGES.map((s) => {
              const c      = STAGE_COLORS[s.id];
              const active = filterStage === s.id;
              return (
                <button key={s.id} onClick={() => setFilterStage(active ? null : s.id)} style={{
                  padding: "4px 12px", borderRadius: "20px", fontSize: "11px",
                  fontWeight: active ? "600" : "400", cursor: "pointer",
                  border: `1px solid ${active ? c.border : "#E5E7EB"}`,
                  background: active ? c.bg : "#fff", color: active ? c.text : "#6B7280",
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  {s.icon} {s.label} <strong>{stageCounts[s.id]}</strong>
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {isLoading && (
            <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF", fontSize: "12px" }}>
              Loading from Notion…
            </div>
          )}

          {/* Error */}
          {hasError && (
            <div style={{ padding: "14px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#991B1B", fontSize: "12px", marginBottom: "16px" }}>
              ⚠️ Notion error: {hasError}
              <br /><span style={{ opacity: 0.7 }}>Check the integration is connected to this DB in Notion (··· → Connections).</span>
            </div>
          )}

          {/* Setup banner */}
          {!isLoading && prop.status === "setup" && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#92400E", marginBottom: "8px" }}>
                ⚠️ {prop.brand} setup required
              </div>
              {getSetupItems(prop).map((item, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#78350F", padding: "2px 0" }}>☐ {item}</div>
              ))}
            </div>
          )}

          {/* Kanban — all stages */}
          {!isLoading && !filterStage && prop.status !== "setup" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "10px", alignItems: "start" }}>
              {STAGES.map((stage) => {
                const stageItems = items.filter((i) => i.stage === stage.id);
                return (
                  <div key={stage.id} style={{ background: "#fff", borderRadius: "10px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
                    {/* Column header */}
                    <div style={{ padding: "9px 11px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: "#374151", display: "flex", alignItems: "center", gap: "4px" }}>
                        {stage.icon} {stage.label}
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: prop.accent, background: `rgba(${rgb},0.08)`, padding: "1px 6px", borderRadius: "10px" }}>
                        {stageItems.length}
                      </span>
                    </div>
                    {stageItems.length === 0 && (
                      <div style={{ padding: "14px 11px", fontSize: "11px", color: "#D1D5DB", textAlign: "center" }}>empty</div>
                    )}
                    {stageItems.map((item) => {
                      const selected = selectedItem?.id === item.id;
                      return (
                        <div key={item.id} onClick={() => setSelectedItem(selected ? null : item)} style={{
                          margin: "7px", padding: "9px 10px", borderRadius: "7px", cursor: "pointer",
                          border: `1px solid ${selected ? prop.accent : "#F3F4F6"}`,
                          background: selected ? `rgba(${rgb},0.04)` : "#FAFAFA",
                          boxShadow: selected ? `0 0 0 2px rgba(${rgb},0.12)` : "none",
                        }}>
                          <div style={{ fontSize: "11px", fontWeight: "500", color: "#111827", lineHeight: 1.35, marginBottom: "5px" }}>
                            {item.keyword}
                          </div>
                          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                            {item.priority && <Chip accent={prop.accent}>{item.priority}</Chip>}
                            {item.kd != null && <Chip>KD {item.kd}</Chip>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* List — filtered */}
          {!isLoading && filterStage && prop.status !== "setup" && (
            <div>
              {filtered.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: "12px" }}>
                  No content in this stage
                </div>
              )}
              {filtered.map((item) => {
                const selected = selectedItem?.id === item.id;
                return (
                  <div key={item.id} onClick={() => setSelectedItem(selected ? null : item)} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 12px", borderRadius: "8px", marginBottom: "5px", cursor: "pointer",
                    border: `1px solid ${selected ? prop.accent : "#E5E7EB"}`,
                    background: selected ? `rgba(${rgb},0.04)` : "#fff",
                  }}>
                    <div style={{ flex: 1, fontSize: "12px", fontWeight: "500", color: "#111827" }}>{item.keyword}</div>
                    <div style={{ display: "flex", gap: "5px", alignItems: "center", flexShrink: 0 }}>
                      {item.cluster  && <Chip>{item.cluster}</Chip>}
                      {item.priority && <Chip accent={prop.accent}>{item.priority}</Chip>}
                      {item.kd != null && <Chip>KD {item.kd}</Chip>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: detail panel ── */}
        {selectedItem && (
          <div style={{
            padding: "20px", background: "#fff",
            height: "calc(100vh - 100px)", overflowY: "auto",
            position: "sticky", top: "52px",
            borderLeft: "1px solid #E5E7EB",
          }}>
            <button onClick={() => setSelectedItem(null)} style={{ float: "right", background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#9CA3AF" }}>×</button>

            {/* Title */}
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827", letterSpacing: "-0.02em", marginBottom: "3px", paddingRight: "24px", lineHeight: 1.3 }}>
              {selectedItem.keyword}
            </div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", marginBottom: "14px" }}>{prop.domain}</div>

            {/* Stage progress rail */}
            <div style={{ display: "flex", background: "#F9FAFB", borderRadius: "10px", padding: "10px 8px", border: "1px solid #F3F4F6", marginBottom: "16px" }}>
              {STAGES.map((s, i) => {
                const done    = i < currentStageIdx;
                const current = i === currentStageIdx;
                const isLast  = i === STAGES.length - 1;
                return (
                  <div key={s.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", position: "relative" }}>
                    {!isLast && (
                      <div style={{ position: "absolute", top: "13px", left: "calc(50% + 13px)", right: "calc(-50% + 13px)", height: "2px", background: done ? prop.accent : "#E5E7EB", zIndex: 0 }} />
                    )}
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: done ? "11px" : "13px", zIndex: 1, position: "relative",
                      background: done ? prop.accent : current ? "#fff" : "#F3F4F6",
                      border: `2px solid ${done ? prop.accent : current ? prop.accent : "#E5E7EB"}`,
                      color: done ? "#fff" : current ? prop.accent : "#9CA3AF",
                    }}>
                      {done ? "✓" : s.icon}
                    </div>
                    <div style={{ fontSize: "9px", fontWeight: current ? "600" : "400", color: current ? "#111827" : done ? "#6B7280" : "#9CA3AF", textAlign: "center", lineHeight: 1.2 }}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meta grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginBottom: "14px" }}>
              {[
                { label: "KD",       value: selectedItem.kd ?? "—",                       big: true },
                { label: "Volume",   value: selectedItem.volume?.toLocaleString() ?? "—",  big: true },
                { label: "Priority", value: selectedItem.priority ?? "—",                  big: false },
                { label: "Cluster",  value: selectedItem.cluster ?? "—",                   big: false },
              ].map(({ label, value, big }) => (
                <div key={label} style={{ background: "#F9FAFB", borderRadius: "7px", padding: "9px 11px", border: "1px solid #F3F4F6" }}>
                  <div style={{ fontSize: "9px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{label}</div>
                  <div style={{ fontSize: big ? "16px" : "12px", fontWeight: big ? "700" : "500", color: big ? prop.accent : "#111827" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Funnel + angle (Boombrand) */}
            {selectedItem.funnel && (
              <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "10px" }}>
                Funnel: <strong>{selectedItem.funnel}</strong>
                {selectedItem.angle && <> · {selectedItem.angle}</>}
              </div>
            )}

            {/* Notes */}
            {selectedItem.notes && (
              <div style={{ fontSize: "11px", color: "#6B7280", background: "#F9FAFB", borderRadius: "7px", padding: "8px 10px", border: "1px solid #F3F4F6", marginBottom: "12px" }}>
                {selectedItem.notes}
              </div>
            )}

            {/* Stage action */}
            <div style={{ fontSize: "9px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px" }}>
              Action · {STAGES.find((s) => s.id === selectedItem.stage)?.label}
            </div>

            {selectedItem.stage === "idea" && (
              <>
                <div style={promptStyle}>{buildPrompt(prop, selectedItem, "draft")}</div>
                <button style={primaryBtn} onClick={() => handleCopy(buildPrompt(prop, selectedItem, "draft"), "Prompt copied")}>
                  Copy draft prompt →
                </button>
              </>
            )}

            {selectedItem.stage === "draft" && (
              <>
                <div style={promptStyle}>{buildPrompt(prop, selectedItem, "edit")}</div>
                <button style={primaryBtn} onClick={() => handleCopy(buildPrompt(prop, selectedItem, "edit"), "Prompt copied")}>
                  Copy edit prompt →
                </button>
                {selectedItem.draftUrl && (
                  <a href={selectedItem.draftUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    ↗ Open draft in Elementor
                  </a>
                )}
              </>
            )}

            {selectedItem.stage === "edit" && (
              <>
                <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "8px" }}>
                  Editorial review complete. Publish in WP admin.
                </div>
                {selectedItem.draftUrl && (
                  <a href={selectedItem.draftUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>↗ Open draft in Elementor</a>
                )}
                <a href={prop.adminUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  ↗ WP admin — {prop.domain}
                </a>
              </>
            )}

            {(selectedItem.stage === "publish" || selectedItem.stage === "backlink") && (
              <>
                {selectedItem.stage === "publish" && (
                  <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "8px" }}>Post is live. Build internal backlinks now.</div>
                )}
                {(selectedItem.publishedUrl || selectedItem.targetUrl) && (
                  <a href={selectedItem.publishedUrl || selectedItem.targetUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    ↗ View published post
                  </a>
                )}
                <div style={promptStyle}>{buildPrompt(prop, selectedItem, "backlink")}</div>
                <button style={primaryBtn} onClick={() => handleCopy(buildPrompt(prop, selectedItem, "backlink"), "Prompt copied")}>
                  Copy backlink prompt →
                </button>
                <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "4px" }}>
                  Upload WordPress XML export first, then /count-backlinks, then /internal-backlinks.
                </div>
              </>
            )}

            {/* Advance stage */}
            {nextStageObj && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "9px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  {selectedItem.stage === "edit" ? "After publishing" : "Mark as advanced"}
                </div>
                <button style={secondaryBtn} onClick={() => handleAdvance(selectedItem)}>
                  Move to {nextStageObj.icon} {nextStageObj.label} →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
          background: "#111827", color: "#fff", padding: "9px 18px", borderRadius: "8px",
          fontSize: "12px", fontWeight: "500", zIndex: 999, pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
