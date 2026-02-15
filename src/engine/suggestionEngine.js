// Suggestion Engine — powered by catalog.json + Kimi K2.5 API
import catalog from '../data/catalog.json';

// ═══════════════════════════════════════════
//  CATALOG ACCESS
// ═══════════════════════════════════════════

export const CATEGORIES = [
    { key: 'agents', label: 'Agents', icon: '🤖', flag: '--agent', color: '#60a5fa' },
    { key: 'commands', label: 'Commands', icon: '⚡', flag: '--command', color: '#fb7185' },
    { key: 'hooks', label: 'Hooks', icon: '🪝', flag: '--hook', color: '#fbbf24' },
    { key: 'mcps', label: 'MCPs', icon: '🔌', flag: '--mcp', color: '#34d399' },
    { key: 'settings', label: 'Settings', icon: '⚙️', flag: '--setting', color: '#818cf8' },
    { key: 'skills', label: 'Skills', icon: '🎨', flag: '--skill', color: '#a78bfa' },
];

export function getCatalog() {
    return catalog;
}

export function getCategoryItems(categoryKey) {
    return catalog[categoryKey] || [];
}

export function searchCatalog(query, categoryKey = null) {
    const q = query.toLowerCase().trim();
    if (!q) return categoryKey ? { [categoryKey]: catalog[categoryKey] } : catalog;

    const tokens = q.split(/\s+/).filter(t => t.length > 0);

    const searchIn = categoryKey
        ? { [categoryKey]: catalog[categoryKey] || [] }
        : {
            agents: catalog.agents || [],
            commands: catalog.commands || [],
            hooks: catalog.hooks || [],
            mcps: catalog.mcps || [],
            settings: catalog.settings || [],
            skills: catalog.skills || []
        };

    const results = {};
    for (const [key, items] of Object.entries(searchIn)) {
        if (!items) continue;
        results[key] = items.filter(item => {
            const searchable = `${item.name} ${item.id} ${item.description || ''} ${item.category || ''}`.toLowerCase();
            // All tokens must match (AND logic)
            return tokens.every(token => searchable.includes(token));
        });
    }
    return results;
}

// ═══════════════════════════════════════════
//  API PROVIDERS (OpenAI-compatible)
// ═══════════════════════════════════════════

export const PROVIDERS = {
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        defaultModel: 'minimax/minimax-m2.5',
    },
};

// Build concise lists for AI prompt (id only to save tokens)
function buildCategoryList(items) {
    return items.map(a => `${a.category}/${a.id}`).join(', ');
}

const SYSTEM_PROMPT = `You are an expert Claude Code configuration planner. Given a project description, select the BEST components from the aitmpl.com catalog.

AVAILABLE AGENTS (category/id):
${buildCategoryList(catalog.agents)}

AVAILABLE COMMANDS (category/id):
${buildCategoryList(catalog.commands)}

AVAILABLE HOOKS (category/id):
${buildCategoryList(catalog.hooks)}

AVAILABLE MCPs (category/id):
${buildCategoryList(catalog.mcps)}

AVAILABLE SETTINGS (category/id):
${buildCategoryList(catalog.settings)}

RULES:
- Quality over quantity — only include items DIRECTLY relevant to the project
- Select 2-3 agents (the most impactful ones)
- Select 1-2 commands if relevant
- Select 0-1 hooks only if clearly needed
- Select 0-2 MCPs if relevant
- Select 0-1 settings only if clearly needed
- Prefer items that have descriptions (they are higher quality)
- Do NOT pad results with generic/unrelated items
- Return ONLY valid JSON, no markdown, no explanation
- Use exact category/id from the lists above

RESPONSE FORMAT (strict JSON):
{"agents":["category/id"],"commands":["category/id"],"hooks":["category/id"],"mcps":["category/id"],"settings":["category/id"],"summary":"One clear sentence about which roles cover this project's needs"}`;

// ═══════════════════════════════════════════
//  SUGGESTION ENGINE
// ═══════════════════════════════════════════

/**
 * @param {string} description - Project description
 * @param {{ apiKey: string, model?: string, apiMode?: 'local'|'backend' }} config - Runtime config from settings store
 */
export async function suggestAgentTeam(description, config) {
    const providerDef = PROVIDERS.openrouter;

    // Determine usage mode:
    // 'backend' -> Force Proxy
    // 'local' -> Direct API (requires key)
    // Fallback -> Check for key
    let useProxy = true;
    if (config.apiMode === 'local') {
        useProxy = false;
    } else if (config.apiMode === 'backend') {
        useProxy = true;
    } else {
        useProxy = !config.apiKey;
    }

    // Demo Mode: Force Minimax
    // Local Mode: Use config model or default
    const model = useProxy
        ? 'minimax/minimax-m2.5'
        : (config.model || providerDef.defaultModel);

    const result = await callProviderAPI(description, {
        url: useProxy ? '/api/suggest' : providerDef.url,
        apiKey: config.apiKey,
        model,
        name: providerDef.name,
        useProxy
    });

    if (result) return result;
    throw new Error('Failed to get suggestions from AI.');
}

async function callProviderAPI(description, { url, apiKey, model, name, useProxy }) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (!useProxy) {
        if (!apiKey) throw new Error('No API key provided for Local Mode. Please add your OpenRouter key in Settings.');
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body = {
        model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Project: ${description}` },
        ],
        temperature: 0.3,
        max_tokens: 1024,
    };

    if (useProxy) {
        // Backend always uses OpenRouter now
        body.providerId = 'openrouter';
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
        throw new Error('Demo API not available locally. Use "vercel dev" or add your own API key.');
    }

    if (!response.ok) {
        let errMsg = `${name} API error: ${response.status}`;
        try {
            const text = await response.text();
            try {
                // Try parsing JSON
                const errData = JSON.parse(text);
                // Handle { error: "message" } and { error: { message: "..." } } keys
                const rawError = errData.error || errData.message;
                if (typeof rawError === 'string') {
                    errMsg = rawError;
                } else if (rawError && typeof rawError === 'object' && rawError.message) {
                    errMsg = rawError.message; // OpenRouter/OpenAI nested format
                } else if (text.length < 200) {
                    errMsg = text; // Fallback to raw text if short
                }
            } catch (jsonErr) {
                // Not JSON, use raw text if it's short/readable
                if (text && text.length < 300) {
                    errMsg = text;
                }
            }
        } catch (readErr) {
            // Cannot read body
        }

        throw new Error(errMsg);
    }

    const data = await response.json();

    // Proxy returns standard format, so we parse it same way
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return buildResult(parsed);
}

function findItem(categoryKey, pathStr) {
    const items = catalog[categoryKey] || [];
    // pathStr = "category/id"
    const parts = pathStr.split('/');
    const id = parts[parts.length - 1];
    const cat = parts.slice(0, -1).join('/');
    return items.find(i => i.id === id && (cat === '' || i.category === cat))
        || items.find(i => i.id === id);
}

function buildResult(parsed) {
    const selected = {};

    for (const catDef of CATEGORIES) {
        const key = catDef.key;
        const paths = parsed[key] || [];
        selected[key] = paths
            .map(p => findItem(key, p))
            .filter(Boolean);
    }

    // Must have at least agents
    if (!selected.agents || selected.agents.length === 0) {
        throw new Error('No valid agents matched');
    }

    return {
        selected,
        summary: parsed.summary || `AI recommended components for your project`,
    };
}

// ═══════════════════════════════════════════
//  LOCAL FALLBACK (concept-based matching)
// ═══════════════════════════════════════════

// Concept map: keywords → preferred item IDs with boost scores
const CONCEPT_MAP = {
    // Web & Frontend
    'web|website|frontend|react|vue|angular|next|nuxt|html|css|ui|interface': [
        'frontend-developer', 'ui-designer', 'ux-researcher', 'accessibility-engineer',
        'cli-ui-designer', 'responsive-design'
    ],
    // Backend & API
    'api|backend|server|rest|graphql|microservice|endpoint': [
        'api-architect', 'backend-architect', 'backend-developer', 'api-designer',
        'graphql-architect'
    ],
    // Database
    'database|sql|postgres|mongo|redis|supabase|nosql|schema|migration': [
        'database-architect', 'database-admin', 'postgres-pro', 'nosql-specialist',
        'supabase-schema-architect', 'neon-database-architect'
    ],
    // E-commerce & Payments
    'ecommerce|e-commerce|shop|store|payment|stripe|checkout|cart|product': [
        'payment-integration', 'shopify-expert', 'product-strategist', 'product-manager',
        'sales-engineer'
    ],
    // AI & ML
    'ai|artificial intelligence|machine learning|ml|llm|gpt|model|neural|nlp|chatbot|recommendation': [
        'llm-architect', 'ml-engineer', 'ai-engineer', 'nlp-engineer', 'data-scientist',
        'prompt-engineer', 'computer-vision-engineer', 'model-evaluator'
    ],
    // Mobile
    'mobile|app|ios|android|react native|flutter|swift|kotlin': [
        'mobile-developer', 'react-native', 'dotnet-maui'
    ],
    // Security & Auth
    'security|auth|authentication|authorization|login|oauth|jwt|encryption': [
        'security-engineer', 'penetration-tester', 'graphql-security-specialist',
        'neon-auth-specialist', 'legal-advisor'
    ],
    // Testing & Quality
    'test|testing|qa|quality|tdd|unit test|integration test|cypress|jest': [
        'test-engineer', 'tdd-red', 'tdd-green', 'code-reviewer'
    ],
    // DevOps & Deployment
    'devops|deploy|ci|cd|docker|kubernetes|aws|cloud|infrastructure|pipeline': [
        'devops-engineer', 'docker-specialist', 'cloud-architect', 'infrastructure'
    ],
    // Data & Analytics
    'data|analytics|dashboard|report|metrics|visualization|chart': [
        'data-analyst', 'data-engineer', 'quant-analyst', 'power-bi-dax-expert'
    ],
    // Blockchain
    'blockchain|web3|crypto|smart contract|solidity|nft|defi': [
        'blockchain-developer', 'smart-contract-auditor', 'smart-contract-specialist',
        'web3-integration-specialist'
    ],
    // SEO & Marketing
    'seo|marketing|content|blog|social media|analytics|growth': [
        'seo-specialist', 'content-marketer', 'marketing-attribution-analyst',
        'trend-analyst', 'competitive-analyst'
    ],
    // Game Development
    'game|gaming|multiplayer|leaderboard|realtime|real-time|unity|unreal': [
        'game-developer', 'backend-architect'
    ],
    // Research & Documentation
    'research|documentation|docs|wiki|knowledge base': [
        'academic-researcher', 'technical-researcher', 'research-coordinator'
    ],
    // Chat & Communication
    'chat|messaging|real-time|websocket|notification|email': [
        'backend-architect', 'communication-excellence-coach'
    ],
    // Image & Media
    'image|photo|video|media|upload|gallery|coloring|drawing|canvas': [
        'computer-vision-engineer', 'content-marketer'
    ],
    // Fitness & Health
    'fitness|health|workout|exercise|nutrition|wellness|sport': [
        'product-manager', 'data-analyst', 'backend-architect'
    ],
    // Travel & Maps
    'travel|map|location|geo|route|navigation|booking|hotel|flight': [
        'api-architect', 'data-analyst', 'search-specialist', 'product-strategist'
    ],
};

// Score threshold — items below this are noise
const MIN_SCORE = 4;

function localSuggest(description) {
    const desc = description.toLowerCase();

    // Step 1: Identify which concepts are triggered
    const boostedIds = new Set();
    for (const [patternStr, ids] of Object.entries(CONCEPT_MAP)) {
        const patterns = patternStr.split('|');
        if (patterns.some(p => desc.includes(p))) {
            ids.forEach(id => boostedIds.add(id));
        }
    }

    // Step 2: Score all items with improved algorithm
    function scoreItems(items) {
        return items
            .map(item => {
                let score = 0;
                const idLower = item.id.toLowerCase();
                const nameLower = item.name.toLowerCase();
                const descLower = (item.description || '').toLowerCase();
                const catLower = (item.category || '').toLowerCase();

                // Concept map boost (most important signal)
                if (boostedIds.has(item.id)) {
                    score += 15;
                }

                // ID/name exact substring in description
                if (desc.includes(idLower) || desc.includes(nameLower)) {
                    score += 20;
                }

                // Category name relevance
                if (desc.includes(catLower.replace(/-/g, ' ')) || desc.includes(catLower.replace(/-/g, ''))) {
                    score += 5;
                }

                // Keyword matching from item metadata → description
                const descWords = desc.split(/[\s,.\-/]+/).filter(w => w.length > 3);
                const itemWords = `${nameLower} ${idLower} ${descLower} ${catLower}`.split(/[\s,.\-/]+/);

                for (const dw of descWords) {
                    for (const iw of itemWords) {
                        if (iw.length > 3 && (iw.includes(dw) || dw.includes(iw))) {
                            score += iw.length > 6 ? 4 : 2;
                        }
                    }
                }

                // Quality bias: items with descriptions are higher quality
                if (!item.description || item.description.trim() === '') {
                    score = Math.floor(score * 0.5); // 50% penalty for no description
                }

                return { item, score };
            })
            .filter(x => x.score >= MIN_SCORE)
            .sort((a, b) => b.score - a.score);
    }

    // Step 3: Collect results with TIGHTER limits
    const agents = scoreItems(catalog.agents).slice(0, 3).map(x => x.item);
    const commands = scoreItems(catalog.commands).slice(0, 2).map(x => x.item);
    const hooks = scoreItems(catalog.hooks).slice(0, 1).map(x => x.item);
    const mcps = scoreItems(catalog.mcps).slice(0, 1).map(x => x.item);
    const settings = scoreItems(catalog.settings).slice(0, 1).map(x => x.item);
    const skills = scoreItems(catalog.skills).slice(0, 2).map(x => x.item);

    // Step 4: Smart fallback — use concept map to pick sensible defaults
    if (agents.length === 0) {
        // Pick the first 2 concept-matched agents, or generic ones
        const conceptAgents = catalog.agents.filter(a => boostedIds.has(a.id) && a.description);
        if (conceptAgents.length > 0) {
            agents.push(...conceptAgents.slice(0, 2));
        } else {
            // Ultimate fallback: well-known agents that exist
            const fallbackIds = ['backend-architect', 'code-architect', 'code-explorer'];
            const fallbacks = catalog.agents.filter(a => fallbackIds.includes(a.id));
            agents.push(...fallbacks.slice(0, 2));
        }
    }

    // Step 5: Generate a natural summary
    const totalCount = agents.length + commands.length + hooks.length + mcps.length + settings.length + skills.length;
    const parts = [];
    if (agents.length > 0) parts.push(`${agents.length} agent${agents.length > 1 ? 's' : ''}`);
    if (commands.length > 0) parts.push(`${commands.length} command${commands.length > 1 ? 's' : ''}`);
    if (mcps.length > 0) parts.push(`${mcps.length} MCP${mcps.length > 1 ? 's' : ''}`);
    if (skills.length > 0) parts.push(`${skills.length} skill${skills.length > 1 ? 's' : ''}`);
    if (hooks.length > 0) parts.push(`${hooks.length} hook${hooks.length > 1 ? 's' : ''}`);

    const summary = `Selected ${parts.join(', ')} for your ${description.length > 60 ? description.slice(0, 57) + '...' : description} project`;

    return {
        selected: { agents, commands, hooks, mcps, settings, skills },
        summary,
    };
}

