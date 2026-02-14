# Visual Agent Planner (VAP)

**Build your Claude Code team in seconds.**

VAP brings the powerful `aitmpl.com` template catalog (1477+ components) to a visual interface. Describe your project, and AI selects the best Agents, Commands, and MCPs for you.

## Features

- 🎨 **Visual Interface**: Browse Agents, Skills, and more in a sleek dark UI.
- 🤖 **AI Suggestions**: Get automatic recommendations based on your project description.
- 🎨 **Visual Interface**: Browse Agents, Skills, and more in a sleek dark UI.
- 🤖 **AI Suggestions**: Get automatic recommendations based on your project description.
- ⚙️ **Settings Panel**: Configure API Connection (Demo Proxy or Personal Key) directly from the UI.
- 🔒 **Secure Demo Mode**: Includes a Vercel-ready backend proxy with rate limiting (5 requests/day) for secure public demos.
- 📦 **Huge Catalog**: 1477+ templates (Agents, Commands, Hooks, MCPs).
- 🚀 **One-Click Install**: Copy a single `npx` command to set up everything.

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

To enable the secure backend proxy and rate limiting for demos:

1.  Deploy to **Vercel**.
2.  Add the following **Environment Variables** in Vercel Settings:

| Variable | Description |
| :--- | :--- |
| `SERVER_OPENROUTER_API_KEY` | API Key for OpenRouter (Backend Proxy) |
| `SESSION_SECRET` | Random string for signing cookies |

*Note: Frontend-only mode works if users enter their own keys in the Settings panel.*

## Tech Stack

- **Frontend**: React + Vite + Zustand (Persist)
- **Backend**: Vercel Serverless Functions (`/api/suggest`)
- **UI**: Custom Glassmorphism CSS + Lucide Icons
- **AI**: OpenRouter (Google Gemini Flash 2.5 default)

License: MIT
