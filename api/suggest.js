
import crypto from 'crypto';

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { model, messages, providerId } = req.body;

        // 1. Rate Limiting Strategy
        // ---------------------------------------------------------
        // Strategy A: Global Limit (Requires Vercel KV)
        // Strategy B: Per-User Limit (Cookie-based Fallback)

        const limit = parseInt(process.env.VITE_DEMO_LIMIT || '5', 10);
        let limitReached = false;
        let limitMsg = '';
        let kvFailed = false;

        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            // --- STRATEGY A: GLOBAL LIMIT (KV) ---
            try {
                const { kv } = require('@vercel/kv');
                const today = new Date().toISOString().split('T')[0];
                const counterKey = `vap_global_limit:${today}`;

                let currentCount = await kv.incr(counterKey);
                if (currentCount === 1) await kv.expire(counterKey, 86400);

                if (currentCount > limit) {
                    limitReached = true;
                    limitMsg = `Global Demo Limit Reached (${limit}/${limit}). The demo is paused for today.`;
                }
            } catch (error) {
                console.error('KV Error (Falling back to cookies):', error);
                limitReached = false; // Reset just in case
                // Force fallback by modifying a flag or ensuring the next block runs
                kvFailed = true;
            }
        }

        // Check KV vars again OR if manual fallback triggered
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN || kvFailed || limitReached) {
            // --- STRATEGY B: PER-USER LIMIT (COOKIE) ---
            // Only runs if KV is missing or failed, or if KV limit was already reached
            // If KV limit was reached, we still want to set the cookie for the user
            const secret = process.env.SESSION_SECRET || 'dev-secret';
            const today = new Date().toISOString().split('T')[0];

            const cookieHeader = req.headers.cookie || '';
            const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
            const cookie = cookies['vap_usage'];
            let count = 0;

            if (cookie) {
                const val = decodeURIComponent(cookie);
                const [date, countStr, sig] = val.split('|');
                const expectedSig = crypto.createHmac('sha256', secret).update(`${date}|${countStr}`).digest('hex');

                if (sig === expectedSig && date === today) {
                    count = parseInt(countStr, 10);
                }
            }

            if (count >= limit) {
                // If KV limit already reached, we prefer that message unless user limit also reached
                // Actually if user limit reached, show that.
                if (!limitReached) {
                    limitReached = true;
                    limitMsg = `Your Daily Demo Limit Reached (${limit}/${limit}). Please add your own API key.`;
                }
            } else if (!limitReached) {
                // Only increment if NO limit is reached (Global or Personal)
                count++;
                const newSig = crypto.createHmac('sha256', secret).update(`${today}|${count}`).digest('hex');
                const newCookieVal = `${today}|${count}|${newSig}`;
                res.setHeader('Set-Cookie', `vap_usage=${newCookieVal}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
            }
        }

        if (limitReached) {
            return res.status(429).json({ error: limitMsg });
        }


        // 2. Proxy Logic
        // ---------------------------------------------------------
        const apiKey = process.env.SERVER_OPENROUTER_API_KEY;
        const url = 'https://openrouter.ai/api/v1/chat/completions';

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
