const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_VERSION = "2022-06-28";

// ─── Raw Notion API call ──────────────────────────────────────────────────────
export async function queryNotionDb(dbId) {
  const results = [];
  let cursor = undefined;

  while (true) {
    const body = cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 };
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Notion ${res.status}: ${err}`);
    }
    const data = await res.json();
    results.push(...(data.results || []));
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }
  return results;
}

// ─── Property extractor ───────────────────────────────────────────────────────
function getProp(page, name, type) {
  const p = page.properties?.[name];
  if (!p) return null;
  if (type === "title")  return p.title?.map((t) => t.plain_text).join("") || null;
  if (type === "select") return p.select?.name || null;
  if (type === "number") return p.number ?? null;
  if (type === "url")    return p.url || null;
  if (type === "text")   return p.rich_text?.map((t) => t.plain_text).join("") || null;
  return null;
}

// ─── Status → pipeline stage maps ────────────────────────────────────────────
const SEEKER_STAGE = {
  "To create":     "idea",
  "In progress":   "draft",
  "Watch":         "idea",
  "Too hard now":  "idea",
  "Existing post": "backlink",
};

const BOOMBRAND_STAGE = {
  "Unassigned":  "idea",
  "Brief Ready": "idea",
  "In Progress": "draft",
  "Published":   "backlink",
};

// ─── Mappers ──────────────────────────────────────────────────────────────────
export function mapSeekerRow(page) {
  const status    = getProp(page, "Status",           "select");
  const targetUrl = getProp(page, "Target URL",       "url");
  const stage     = SEEKER_STAGE[status] || "idea";
  return {
    id:           page.id,
    keyword:      getProp(page, "Keyword",           "title") || "(untitled)",
    status,
    priority:     getProp(page, "Priority",          "select"),
    kd:           getProp(page, "KD",                "number"),
    volume:       getProp(page, "Volume",            "number"),
    trafficPot:   getProp(page, "Traffic Potential", "number"),
    cluster:      getProp(page, "Cluster",           "select"),
    product:      getProp(page, "Product",           "select"),
    targetUrl,
    notes:        getProp(page, "Notes",             "text"),
    stage,
    draftUrl:     stage === "draft"    ? targetUrl : null,
    publishedUrl: stage === "backlink" ? targetUrl : null,
  };
}

export function mapBoombrandRow(page) {
  const status = getProp(page, "Status", "select");
  const stage  = BOOMBRAND_STAGE[status] || "idea";
  return {
    id:         page.id,
    keyword:    getProp(page, "Keyword",           "title") || "(untitled)",
    status,
    priority:   getProp(page, "Priority",          "select"),
    kd:         getProp(page, "KD",                "number"),
    volume:     getProp(page, "Volume",            "number"),
    trafficPot: getProp(page, "Traffic Potential", "number"),
    cluster:    getProp(page, "Cluster",           "select"),
    funnel:     getProp(page, "Funnel Stage",      "select"),
    angle:      getProp(page, "Content Angle",     "text"),
    notes:      getProp(page, "Notes",             "text"),
    stage,
    draftUrl:     null,
    publishedUrl: null,
    targetUrl:    null,
  };
}
