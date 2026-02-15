
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // 1. GET Request: Check Global Limit Status
    if (req.method === 'GET') {
        const limit = parseInt(process.env.VITE_DEMO_LIMIT || '5', 10);

        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
            return res.status(200).json({
                limit: null,
                used: 0,
                remaining: null,
                status: 'unlimited'
            });
        }

        try {
            const { kv } = require('@vercel/kv');
            const today = new Date().toISOString().split('T')[0];
            const counterKey = `vap_global_limit:${today}`;

            const currentCount = await kv.get(counterKey) || 0;
            const used = parseInt(currentCount, 10);

            return res.status(200).json({
                limit,
                used,
                remaining: Math.max(0, limit - used),
                status: used >= limit ? 'exhausted' : 'active'
            });
        } catch (error) {
            console.error('KV Status Check Error:', error);
            // Fail open/gracefully for status check
            return res.status(200).json({ status: 'error', error: 'Could not fetch status' });
        }
    }

    // Only allow POST for suggestions
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { model, messages, providerId } = req.body;

        // Security: Limit prompt length
        if (messages && Array.isArray(messages)) {
            const userMsg = messages.find(m => m.role === 'user');
            if (userMsg && userMsg.content && userMsg.content.length > 300) {
                return res.status(400).json({ error: 'Prompt too long (max 235 chars allowed).' });
            }
        }

        // 1. Rate Limiting (Global Only - Vercel KV)
        // ---------------------------------------------------------
        const limit = parseInt(process.env.VITE_DEMO_LIMIT || '5', 10);

        // Only run rate limiting if KV is configured
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            try {
                const today = new Date().toISOString().split('T')[0];
                const counterKey = `vap_global_limit:${today}`;

                let currentCount = await kv.incr(counterKey);

                // Set expiry for 24 hours (86400 seconds) only on first create
                if (currentCount === 1) {
                    await kv.expire(counterKey, 86400);
                }

                if (currentCount > limit) {
                    return res.status(429).json({
                        error: `Global Demo Limit Reached (${limit}/${limit}). The demo is paused for today.`
                    });
                }
            } catch (error) {
                // If KV fails (e.g. connection error), log it but allow request
                console.error('KV Rate Limit Error:', error);
            }
        }

        // If KV is not configured, we proceed WITHOUT limits (Fail Open).


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
