require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ─── Configuration ────────────────────────────────────────────────────────────
const PORT                  = process.env.PORT                  || 3000;
const TEMPERATURE_SERVICE_URL = process.env.TEMPERATURE_SERVICE_URL || 'http://localhost:8080';
const CURRENCY_SERVICE_URL    = process.env.CURRENCY_SERVICE_URL    || 'http://localhost:8081';
const API_KEY               = process.env.API_KEY               || 'SUPER-SECRET-DEV-KEY-123';

app.use(cors());
app.use(express.json());

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Build a query string from a request query object
function getQueryString(query) {
    const params = new URLSearchParams(query);
    const str = params.toString();
    return str ? `?${str}` : '';
}

// Generic proxy helper
async function proxyRequest({ method, url, headers = {}, body = null }) {
    try {
        const options = {
            method,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = typeof body === 'object' ? JSON.stringify(body) : body;
        }

        const response = await fetch(url, options);
        const isJson = response.headers.get('content-type')?.includes('application/json');

        let responseData;
        if (isJson) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        return { status: response.status, data: responseData, isJson };
    } catch (error) {
        console.error(`Proxy Error calling ${url}:`, error.message);
        throw error;
    }
}

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ═══════════════════════════════════════════════════════════════════════════════
//  API KEY MANAGEMENT PROXY ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/keys
app.get('/api/keys', async (req, res) => {
    const targetUrl = `${TEMPERATURE_SERVICE_URL}/api/keys`;
    console.log(`→ API Keys: GET ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({ method: 'GET', url: targetUrl });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'API Keys service unavailable.' });
    }
});

// POST /api/keys
app.post('/api/keys', async (req, res) => {
    const targetUrl = `${TEMPERATURE_SERVICE_URL}/api/keys`;
    console.log(`→ API Keys: POST ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({
            method: 'POST',
            url: targetUrl,
            body: req.body
        });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'API Keys service unavailable.' });
    }
});

// PATCH /api/keys/:id/toggle
app.patch('/api/keys/:id/toggle', async (req, res) => {
    const targetUrl = `${TEMPERATURE_SERVICE_URL}/api/keys/${req.params.id}/toggle`;
    console.log(`→ API Keys: PATCH ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({ method: 'PATCH', url: targetUrl });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'API Keys service unavailable.' });
    }
});

// DELETE /api/keys/:id
app.delete('/api/keys/:id', async (req, res) => {
    const targetUrl = `${TEMPERATURE_SERVICE_URL}/api/keys/${req.params.id}`;
    console.log(`→ API Keys: DELETE ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({ method: 'DELETE', url: targetUrl });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'API Keys service unavailable.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TEMPERATURE SERVICE PROXY ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/temperature/convert — Injects the API key securely (hidden from browser)
app.post('/api/temperature/convert', async (req, res) => {
    const targetUrl = `${TEMPERATURE_SERVICE_URL}/api/temperature/convert${getQueryString(req.query)}`;
    console.log(`→ Temperature: POST ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({
            method: 'POST',
            url: targetUrl,
            headers: { 'X-API-Key': API_KEY }
        });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'Temperature service unavailable. Is Spring Boot running on port 8080?' });
    }
});

// GET /api/temperature/safety-check
app.get('/api/temperature/safety-check', async (req, res) => {
    const targetUrl = `${TEMPERATURE_SERVICE_URL}/api/temperature/safety-check${getQueryString(req.query)}`;
    console.log(`→ Temperature: GET ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({ method: 'GET', url: targetUrl });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'Temperature safety check unavailable.' });
    }
});

// GET /api/temperature/logs — All logs (no filter)
app.get('/api/temperature/logs', async (req, res) => {
    const targetUrl = `${TEMPERATURE_SERVICE_URL}/api/temperature/logs`;
    console.log(`→ Temperature: GET ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({ method: 'GET', url: targetUrl });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'Temperature logs unavailable.' });
    }
});

// GET /api/temperature/logs/filter — Filtered logs (DB-level filtering)
// Query params: unit, from, to
app.get('/api/temperature/logs/filter', async (req, res) => {
    const targetUrl = `${TEMPERATURE_SERVICE_URL}/api/temperature/logs/filter${getQueryString(req.query)}`;
    console.log(`→ Temperature Filter: GET ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({ method: 'GET', url: targetUrl });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'Temperature filter logs unavailable.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CURRENCY SERVICE PROXY ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/currency/convert
app.post('/api/currency/convert', async (req, res) => {
    const targetUrl = `${CURRENCY_SERVICE_URL}/api/currency/convert${getQueryString(req.query)}`;
    console.log(`→ Currency: POST ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({ method: 'POST', url: targetUrl });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'Currency service unavailable. Is Spring Boot running on port 8081?' });
    }
});

// GET /api/currency/logs — All logs (no filter)
app.get('/api/currency/logs', async (req, res) => {
    const targetUrl = `${CURRENCY_SERVICE_URL}/api/currency/logs`;
    console.log(`→ Currency: GET ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({ method: 'GET', url: targetUrl });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'Currency logs unavailable.' });
    }
});

// GET /api/currency/logs/filter — Filtered logs (DB-level filtering)
// Query params: currency, from, to
app.get('/api/currency/logs/filter', async (req, res) => {
    const targetUrl = `${CURRENCY_SERVICE_URL}/api/currency/logs/filter${getQueryString(req.query)}`;
    console.log(`→ Currency Filter: GET ${targetUrl}`);
    try {
        const proxyRes = await proxyRequest({ method: 'GET', url: targetUrl });
        res.status(proxyRes.status).send(proxyRes.data);
    } catch (error) {
        res.status(502).json({ message: 'Currency filter logs unavailable.' });
    }
});

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`  BFF Gateway running at  http://localhost:${PORT}`);
    console.log(`  Temperature Service  →  ${TEMPERATURE_SERVICE_URL}`);
    console.log(`  Currency Service     →  ${CURRENCY_SERVICE_URL}`);
    console.log(`  Static UI served from   ./public`);
    console.log(`═══════════════════════════════════════════════════`);
});
