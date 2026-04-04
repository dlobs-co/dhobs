# Ollama + Open-WebUI Integration Log

## Overview

Local LLM support added to HomeForge via two new containers: **Ollama** (model inference engine) and **Open-WebUI** (ChatGPT-style chat frontend). The dashboard includes a live Ollama section that lists pulled models and reports service health.

This document covers the initial setup, the backend hardening work done in PR #99, and the model management roadmap (issue #100).

---

## Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Ollama | `ollama/ollama:0.6.5` | `11434` | LLM inference engine |
| Open-WebUI | `ghcr.io/open-webui/open-webui:0.6.5` | `8085` | Chat UI |

### Data volumes
| Path | Purpose |
|------|---------|
| `./data/ollama:/root/.ollama` | Model weights (persisted across restarts) |
| `./data/open-webui:/app/backend/data` | User accounts, chat history, settings |
| `./data/workspace:/workspace` | Shared workspace mounted in Ollama |

---

## Architecture

```
Browser → http://<host>:8085 → Open-WebUI (8080 internal)
                                     ↓
                              http://ollama:11434
                                     ↓
                              Ollama container

Dashboard → /api/ollama (Next.js proxy)
                ↓
          http://ollama:11434/api/tags
```

The dashboard **never** hits port 11434 directly from the browser. All Ollama API calls are proxied server-side through `/api/ollama/*`. This ensures the dashboard works regardless of how it is accessed (localhost, LAN IP, reverse proxy, domain).

---

## Docker Compose Configuration

### Ollama
```yaml
ollama:
  image: ollama/ollama:0.6.5
  container_name: project-s-ollama
  ports:
    - '11434:11434'
  volumes:
    - ./data/ollama:/root/.ollama
    - ./data/workspace:/workspace
    - ./config/ollama:/modelfiles:ro
  restart: unless-stopped
  deploy:
    resources:
      limits:
        memory: 4g
  healthcheck:
    test: ["CMD", "ollama", "list"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

### Open-WebUI
```yaml
open-webui:
  image: ghcr.io/open-webui/open-webui:0.6.5
  container_name: project-s-open-webui
  ports:
    - '8085:8080'
  volumes:
    - ./data/open-webui:/app/backend/data
  environment:
    - OLLAMA_BASE_URL=http://ollama:11434
    - WEBUI_SECRET_KEY=${WEBUI_SECRET_KEY}
    - CORS_ALLOW_ORIGIN=http://localhost:8085,http://localhost:3069,http://${HOMEFORGE_LAN_IP:-localhost}:8085,http://${HOMEFORGE_LAN_IP:-localhost}:3069
    - WEBUI_AUTH=true
    - JWT_EXPIRES_IN=7d
    - ENABLE_PASSWORD_VALIDATION=true
  depends_on:
    ollama:
      condition: service_healthy
  restart: unless-stopped
  deploy:
    resources:
      limits:
        memory: 2g
  healthcheck:
    test: ["CMD", "curl", "-sf", "http://localhost:8080/"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

Key points:
- `depends_on: ollama: condition: service_healthy` — Open-WebUI waits until Ollama passes its healthcheck before starting
- `WEBUI_SECRET_KEY` must be set in `.env` — changing it invalidates all sessions
- `CORS_ALLOW_ORIGIN` includes both localhost and LAN IP for dashboard ↔ Open-WebUI calls
- Memory limit is 2g — first start downloads an embedding model (~400MB); 512m caused crash loops

---

## Dashboard Integration (PR #99)

### Problem (pre-fix)
The dashboard's Ollama section was calling `http://${window.location.hostname}:11434` directly from the browser. This worked on `localhost` but failed on any other device on the LAN because port 11434 is only exposed on the server, not accessible cross-origin from a browser.

### Fix
Created a Next.js server-side proxy route at `app/api/ollama/route.ts`:

```typescript
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://ollama:11434'

export async function GET() {
  return new Promise<NextResponse>((resolve) => {
    const req = httpGet(`${OLLAMA_BASE}/api/tags`, { timeout: 5000 }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(NextResponse.json(JSON.parse(data))) }
        catch { resolve(NextResponse.json({ error: 'Invalid response from Ollama' }, { status: 502 })) }
      })
    })
    req.on('error', (err) => resolve(NextResponse.json({ error: err.message }, { status: 503 })))
    req.on('timeout', () => { req.destroy(); resolve(NextResponse.json({ error: 'timed out' }, { status: 504 })) })
  })
}
```

The frontend component `ollama-section.tsx` now calls `fetch('/api/ollama')` with no hardcoded hostname or port.

### Environment variable
`OLLAMA_BASE_URL` can be set in the dashboard's environment block to override the default `http://ollama:11434`. This is useful if Ollama is running on a different host.

---

## Current Dashboard Features

The Ollama section (`components/dashboard/ollama-section.tsx`) provides:

- **Health badge** — green/red Online/Offline status, checked on mount and on refresh
- **Model list** — name, size (formatted GB/MB/KB), last modified date
- **Refresh button** — manual re-fetch with spinner

Data source: `GET /api/ollama` → `GET http://ollama:11434/api/tags`

---

## Model Management (Issue #100 — Planned)

The following features are planned but not yet implemented. All require additional API proxy routes.

### Available Ollama API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tags` | GET | List local models ✅ already proxied |
| `/api/ps` | GET | Models currently loaded in RAM |
| `/api/pull` | POST | Pull a model — streams NDJSON progress |
| `/api/delete` | DELETE | Delete a local model |
| `/api/show` | POST | Full model details (parameters, template, etc.) |

### Proxy Routes to Add

```
/api/ollama/ps        → GET    http://ollama:11434/api/ps
/api/ollama/pull      → POST   http://ollama:11434/api/pull  (streaming)
/api/ollama/delete    → DELETE http://ollama:11434/api/delete
/api/ollama/show      → POST   http://ollama:11434/api/show
```

### Feature Plan

**1. Running state badge**
Poll `/api/ollama/ps` every 30s. Show a "Loaded" pill on any model that is currently resident in RAM.

**2. Pull a model**
Input + Pull button in the section header. Stream the NDJSON progress response back to the browser via `ReadableStream`. Each chunk: `{ status, completed?, total?, digest? }`. Compute `completed / total * 100` for a progress bar. Disable duplicate pulls.

**3. Delete a model**
Delete icon on each model tile with a confirm dialog. DELETE to `/api/ollama/delete`. Optimistic removal with error rollback.

**4. Model details drawer**
Click a tile → slide-in drawer. Fetch from `/api/ollama/show`. Show: family, parameter count (e.g. 8B), quantization, context window, license, modelfile template.

### Streaming pull implementation notes
The Next.js route should use `TransformStream` to pipe the Ollama NDJSON stream directly to the browser response without buffering the full download:

```typescript
// rough sketch
export async function POST(req: Request) {
  const { name } = await req.json()
  const { readable, writable } = new TransformStream()
  fetch(`${OLLAMA_BASE}/api/pull`, {
    method: 'POST',
    body: JSON.stringify({ name, stream: true }),
  }).then(res => res.body!.pipeTo(writable))
  return new Response(readable, { headers: { 'Content-Type': 'application/x-ndjson' } })
}
```

---

## Usage

### Pull a model (current — terminal)
```bash
# From the dashboard terminal:
docker exec project-s-ollama ollama pull llama3.2
docker exec project-s-ollama ollama list
docker exec project-s-ollama ollama rm llama3.2
```

### Chat UI
Open `http://<host>:8085` — create an admin account on first visit, select a model, and chat.

### Recommended starter models

| Model | Size | Use case |
|-------|------|---------|
| `llama3.2` | ~2GB | General chat, fast |
| `llama3.2:1b` | ~1.3GB | Minimal RAM, fast responses |
| `mistral` | ~4GB | Better reasoning |
| `codellama` | ~4GB | Code generation |
| `phi3` | ~2.3GB | Small, capable |

---

## Bugs Fixed During Integration

| Service | Issue | Fix |
|---------|-------|-----|
| Open-WebUI | Crash loop on first start | Increased memory limit 512m → 2g (embedding model download) |
| Open-WebUI | Sessions lost on container restart | Added `WEBUI_SECRET_KEY` to env |
| Open-WebUI | CORS errors from dashboard | Added `CORS_ALLOW_ORIGIN` with LAN IP |
| Open-WebUI | Started before Ollama was ready | Added `depends_on: ollama: condition: service_healthy` |
| Dashboard | Ollama section broken on LAN access | Replaced direct port 11434 calls with `/api/ollama` proxy |
| Ollama | Healthcheck using curl (not installed) | Switched to `ollama list` |

---

## Related PRs and Issues

| # | Type | Title | Status |
|---|------|-------|--------|
| #40 | PR | Initial Ollama + Open-WebUI setup | Merged |
| #88 | Issue | Ollama ↔ Open-WebUI unreliable connection + hardening | Closed via #99 |
| #99 | PR | fix: Ollama integration hardening | Merged |
| #100 | Issue | feat: Ollama model manager (pull, delete, running state) | Open |
