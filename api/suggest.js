
import crypto from 'crypto';

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { model, messages, providerId } = req.body;

        // 1. Rate Limiting (Cookie-based)
        // ---------------------------------------------------------
        const secret = process.env.SESSION_SECRET || 'dev-secret';
        const today = new Date().toISOString().split('T')[0]; // Simple daily rotation

        // Cookie format: "date|count|signature"
        const cookieHeader = req.headers.cookie || '';
        const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
        const cookie = cookies['vap_usage'];
        let count = 0;

        if (cookie) {
            // Decode if percent-encoded
            const val = decodeURIComponent(cookie);
            const [date, countStr, sig] = val.split('|');

            // Verify signature
            const expectedSig = crypto
                .createHmac('sha256', secret)
                .update(`${date}|${countStr}`)
                .digest('hex');

            if (sig === expectedSig && date === today) {
                count = parseInt(countStr, 10);
            }
        }

        // Check limit
        if (count >= 5) {
            return res.status(429).json({
                error: 'Demo limit reached (5/day). Please add your own API key in Settings to continue.'
            });
        }

        // Increment and sign new cookie
        count++;
        const newSig = crypto
            .createHmac('sha256', secret)
            .update(`${today}|${count}`)
            .digest('hex');

        const newCookieVal = `${today}|${count}|${newSig}`;

        // Set cookie header
        res.setHeader('Set-Cookie', `vap_usage=${newCookieVal}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);


        // 2. Proxy Logic
        // ---------------------------------------------------------
        let apiKey = '';
        let url = '';

        if (providerId === 'openrouter') {
            apiKey = process.env.SERVER_OPENROUTER_API_KEY;
            url = 'https://openrouter.ai/api/v1/chat/completions';
        } else {
            // Default to Kimi
            apiKey = process.env.SERVER_KIMI_API_KEY;
            url = 'https://api.moonshot.cn/v1/chat/completions';
        }

        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                // OpenRouter specific headers
                ...(providerId === 'openrouter' && {
                    'HTTP-Referer': 'https://visual-agent-planner.vercel.app',
                    'X-Title': 'Visual Agent Planner',
                }),
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.3,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `Provider API Error: ${errText}` });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
