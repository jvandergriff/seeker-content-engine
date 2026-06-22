import { queryNotionDb, mapSeekerRow, mapBoombrandRow } from "../../lib/notion";

const MAPPERS = {
  seeker:    { dbEnvKey: "NOTION_DB_SEEKER",    mapper: mapSeekerRow },
  boombrand: { dbEnvKey: "NOTION_DB_BOOMBRAND", mapper: mapBoombrandRow },
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { property } = req.query;
  const config = MAPPERS[property];

  if (!config) return res.status(400).json({ error: `Unknown property: ${property}` });

  const dbId = process.env[config.dbEnvKey];
  if (!dbId) return res.status(500).json({ error: `No DB ID configured for ${property}` });

  try {
    const rows   = await queryNotionDb(dbId);
    const mapped = rows.map(config.mapper);
    return res.status(200).json({ items: mapped });
  } catch (err) {
    console.error(`Notion error for ${property}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}
