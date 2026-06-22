export const PROPERTIES = [
  {
    slug:             "seeker",
    brand:            "Seeker",
    domain:           "seeker.io",
    accent:           "#2563EB",
    icon:             "🗺",
    status:           "active",
    notionDbEnvKey:   "NOTION_DB_SEEKER",
    notionDbLabel:    "SEO Keyword Tracker",
    adminUrl:         "https://seeker.io/wp-admin",
    voiceGuideFileId: "1L6J8jFpyFtpZSyf66l-TEdcNL1VLZdYX",
    elementorMcp:     "Elementor-mcp-seeker-products",
  },
  {
    slug:             "boombrand",
    brand:            "Boombrand",
    domain:           "boombrand.ai",
    accent:           "#EA580C",
    icon:             "💥",
    status:           "active",
    notionDbEnvKey:   "NOTION_DB_BOOMBRAND",
    notionDbLabel:    "SEO Keyword Opportunities",
    adminUrl:         "https://boombrand.ai/wp-admin",
    voiceGuideFileId: null,
    elementorMcp:     "boombrand elementor hosted",
  },
  {
    slug:             "wildlifeconnect",
    brand:            "Wildlife Connect",
    domain:           "wildlifeconnect.com",
    accent:           "#16A34A",
    icon:             "🌿",
    status:           "setup",
    notionDbEnvKey:   null,
    notionDbLabel:    null,
    adminUrl:         "https://wildlifeconnect.com/wp-admin",
    voiceGuideFileId: null,
    elementorMcp:     "Wildlife Connect",
  },
  {
    slug:             "salescast",
    brand:            "Salescast",
    domain:           "salescast.ai",
    accent:           "#7C3AED",
    icon:             "📡",
    status:           "setup",
    notionDbEnvKey:   null,
    notionDbLabel:    null,
    adminUrl:         "https://salescast.ai/wp-admin",
    voiceGuideFileId: null,
    elementorMcp:     null,
  },
];

export const STAGES = [
  { id: "idea",     label: "Keyword idea",  icon: "💡" },
  { id: "draft",    label: "Draft post",    icon: "✍️"  },
  { id: "edit",     label: "Edit post",     icon: "🔍" },
  { id: "publish",  label: "Publish",       icon: "🚀" },
  { id: "backlink", label: "Backlink post", icon: "🔗" },
];

export const STAGE_IDS = STAGES.map((s) => s.id);

export const STAGE_COLORS = {
  idea:     { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  draft:    { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  edit:     { bg: "#FEFCE8", text: "#A16207", border: "#FEF08A" },
  publish:  { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  backlink: { bg: "#FAF5FF", text: "#6D28D9", border: "#DDD6FE" },
};
