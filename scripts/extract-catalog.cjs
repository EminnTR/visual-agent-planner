/**
 * Extract lightweight catalog from claude-code-templates NPM package.
 * Outputs: src/data/catalog.json (~50KB metadata only)
 * 
 * Run: node scripts/extract-catalog.cjs
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(
    __dirname, '..', 'node_modules', 'claude-code-templates', 'cli-tool', 'components'
);
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'catalog.json');

// ─── Helpers ──────────────────────────────────────

function parseYamlFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};
    const fm = {};
    match[1].split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
            const key = line.substring(0, idx).trim();
            let val = line.substring(idx + 1).trim();
            // Remove surrounding quotes
            if ((val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            fm[key] = val;
        }
    });
    return fm;
}

function slugToName(slug) {
    return slug
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/\bApi\b/g, 'API')
        .replace(/\bMcp\b/g, 'MCP')
        .replace(/\bCi\b/g, 'CI')
        .replace(/\bCd\b/g, 'CD')
        .replace(/\bSeo\b/g, 'SEO')
        .replace(/\bAi\b/g, 'AI')
        .replace(/\bE2e\b/g, 'E2E')
        .replace(/\bDb\b/g, 'DB')
        .replace(/\bSdk\b/g, 'SDK');
}

function truncateDesc(desc, maxLen = 120) {
    if (!desc) return '';
    // Remove markdown/frontmatter noise
    let clean = desc
        .replace(/\\n/g, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/Examples?:.*$/i, '')
        .replace(/Use this agent when.*$/i, '')
        .trim();
    if (clean.length > maxLen) {
        clean = clean.substring(0, maxLen).replace(/\s+\S*$/, '') + '…';
    }
    return clean;
}

// ─── Category Extractors ─────────────────────────

function extractAgents() {
    const agentsDir = path.join(COMPONENTS_DIR, 'agents');
    const items = [];
    if (!fs.existsSync(agentsDir)) return items;

    const categories = fs.readdirSync(agentsDir).filter(d =>
        fs.statSync(path.join(agentsDir, d)).isDirectory()
    );

    for (const cat of categories) {
        const catDir = path.join(agentsDir, cat);
        const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(catDir, file), 'utf8');
                const fm = parseYamlFrontmatter(content);
                const id = path.basename(file, '.md');
                items.push({
                    id,
                    name: fm.name || slugToName(id),
                    description: truncateDesc(fm.description || ''),
                    category: cat,
                    installCmd: `--agent ${cat}/${id}`,
                });
            } catch (e) { /* skip broken files */ }
        }
    }
    return items;
}

function extractCommands() {
    const dir = path.join(COMPONENTS_DIR, 'commands');
    const items = [];
    if (!fs.existsSync(dir)) return items;

    const categories = fs.readdirSync(dir).filter(d =>
        fs.statSync(path.join(dir, d)).isDirectory()
    );

    for (const cat of categories) {
        const catDir = path.join(dir, cat);
        const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(catDir, file), 'utf8');
                const fm = parseYamlFrontmatter(content);
                const id = path.basename(file, '.md');
                items.push({
                    id,
                    name: fm.name || slugToName(id),
                    description: truncateDesc(fm.description || ''),
                    category: cat,
                    installCmd: `--command ${cat}/${id}`,
                });
            } catch (e) { /* skip broken files */ }
        }
    }
    return items;
}

function extractJsonCategory(folderName, flagName, descKey) {
    const dir = path.join(COMPONENTS_DIR, folderName);
    const items = [];
    if (!fs.existsSync(dir)) return items;

    const categories = fs.readdirSync(dir).filter(d => {
        const p = path.join(dir, d);
        return fs.statSync(p).isDirectory();
    });

    for (const cat of categories) {
        const catDir = path.join(dir, cat);
        const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            try {
                const content = JSON.parse(fs.readFileSync(path.join(catDir, file), 'utf8'));
                const id = path.basename(file, '.json');
                let desc = '';
                if (descKey && content[descKey]) {
                    desc = content[descKey];
                } else if (content.description) {
                    desc = content.description;
                } else {
                    // Try to get description from first nested key
                    const firstKey = Object.keys(content)[0];
                    if (firstKey && content[firstKey] && typeof content[firstKey] === 'object') {
                        const nested = Object.values(content[firstKey]);
                        if (nested[0] && nested[0].description) {
                            desc = nested[0].description;
                        }
                    }
                }
                items.push({
                    id,
                    name: slugToName(id),
                    description: truncateDesc(desc),
                    category: cat,
                    installCmd: `--${flagName} ${cat}/${id}`,
                });
            } catch (e) { /* skip broken files */ }
        }
    }
    return items;
}

function extractSkills() {
    const dir = path.join(COMPONENTS_DIR, 'skills');
    const items = [];
    if (!fs.existsSync(dir)) return items;

    const categories = fs.readdirSync(dir).filter(d => {
        const p = path.join(dir, d);
        return fs.statSync(p).isDirectory() && d !== 'ANTHROPIC_ATTRIBUTION.md';
    });

    for (const cat of categories) {
        const catDir = path.join(dir, cat);
        const skillDirs = fs.readdirSync(catDir).filter(d => {
            const p = path.join(catDir, d);
            return fs.statSync(p).isDirectory();
        });
        for (const skillDir of skillDirs) {
            const skillMd = path.join(catDir, skillDir, 'SKILL.md');
            if (!fs.existsSync(skillMd)) continue;
            try {
                const content = fs.readFileSync(skillMd, 'utf8');
                const fm = parseYamlFrontmatter(content);
                items.push({
                    id: skillDir,
                    name: fm.name || slugToName(skillDir),
                    description: truncateDesc(fm.description || ''),
                    category: cat,
                    installCmd: `--skill ${cat}/${skillDir}`,
                });
            } catch (e) { /* skip */ }
        }
    }
    return items;
}

// ─── Main ─────────────────────────────────────────

function main() {
    console.log('🔍 Scanning claude-code-templates package...\n');

    const catalog = {
        _meta: {
            source: 'claude-code-templates@npm',
            generated: new Date().toISOString(),
            baseCmd: 'npx claude-code-templates@latest',
        },
        agents: extractAgents(),
        commands: extractCommands(),
        hooks: extractJsonCategory('hooks', 'hook', 'description'),
        mcps: extractJsonCategory('mcps', 'mcp', null),
        settings: extractJsonCategory('settings', 'setting', 'description'),
        skills: extractSkills(),
    };

    // Summary
    const total = Object.entries(catalog)
        .filter(([k]) => k !== '_meta')
        .reduce((sum, [, arr]) => sum + arr.length, 0);

    console.log(`  🤖 Agents:   ${catalog.agents.length}`);
    console.log(`  ⚡ Commands: ${catalog.commands.length}`);
    console.log(`  🪝 Hooks:    ${catalog.hooks.length}`);
    console.log(`  🔌 MCPs:     ${catalog.mcps.length}`);
    console.log(`  ⚙️  Settings: ${catalog.settings.length}`);
    console.log(`  🎨 Skills:   ${catalog.skills.length}`);
    console.log(`  ─────────────────`);
    console.log(`  📦 Total:    ${total}`);

    // Write
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2), 'utf8');

    const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
    console.log(`\n✅ Catalog written to src/data/catalog.json (${sizeKB} KB)`);
}

main();
