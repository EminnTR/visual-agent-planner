# Visual Agent Planner (VAP)

**A visual configuration builder for [Claude Code](https://github.com/anthropics/claude-code).**


VAP brings the powerful `aitmpl.com` template catalog (1477+ components) to a visual interface. Describe your project, and AI selects the best Agents, Commands, and MCPs to supercharge your Claude Code CLI.

## Features

- 🎨 **Visual Interface**: Browse Agents, Skills, and more in a sleek dark UI.
- 🤖 **AI Suggestions**: Get automatic recommendations based on your project description.
- 📦 **Huge Catalog**: 1477+ templates (Agents, Commands, Hooks, MCPs).
- 🚀 **One-Click Install**: Copy a single `npx` command to set up everything.
- ⚙️ **Settings Panel**: Configure API Connection (Demo Proxy or Personal Key) directly from the UI.

## Getting Started

```bash
git clone https://github.com/aitmpl/visual-agent-planner.git
cd visual-agent-planner
npm install
npm run dev
# OR for full backend features:
vercel dev
```

## Deployment (Vercel)

1.  Deploy to **Vercel**.
2.  Add the following **Environment Variables** in Vercel Settings:

| Variable | Description |
| :--- | :--- |
| `SERVER_OPENROUTER_API_KEY` | API Key for OpenRouter (Backend Proxy) |
| `VITE_DEMO_LIMIT` | Global Daily Limit (Optional, default: 5). Requires Vercel KV. |


## Tech Stack

- **Frontend**: React + Vite + Zustand (Persist)
- **Backend**: Vercel Serverless Functions (`/api/suggest`)
- **UI**: Custom Glassmorphism CSS + Lucide Icons
- **AI**: OpenRouter (Google Gemini Flash 2.5 default)

License: MIT
