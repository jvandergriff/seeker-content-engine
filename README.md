# Seeker Worldwide Content Engine

Content pipeline dashboard for all Seeker Worldwide properties. Reads keyword queues from Notion, tracks each piece of content through 5 stages, and generates Claude prompts for each stage.

## Pipeline stages

💡 Keyword idea → ✍️ Draft post → 🔍 Edit post → 🚀 Publish → 🔗 Backlink post

## Local dev

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel (one time)

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo
3. Add environment variables in Vercel dashboard:
   - `NOTION_TOKEN` — your Notion integration secret
   - `NOTION_DB_SEEKER` — `4b1e68eb-d043-428c-a544-c7b56bc03c70`
   - `NOTION_DB_BOOMBRAND` — `a482b5de-c4dd-44db-b6a4-3ca50753c2e8`
4. Deploy — Vercel gives you a URL like `content-engine-xxx.vercel.app`

## Adding a new property

1. Add entry to `lib/properties.js`
2. Add a mapper in `lib/notion.js`
3. Register the mapper in `pages/api/keywords.js`
4. Add the Notion DB ID as an env var in Vercel

## Notion setup

Each DB must have the Notion integration connected:
- Open the DB → ··· → Connections → add "Content Engine"
