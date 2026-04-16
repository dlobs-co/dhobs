# HomeForge Host Agent

Statically-linked binary that exposes host metrics on `:9101`.  
Replaces `scripts/host-agent.js`. Zero runtime dependencies.

## Build

```bash
# Install Go — https://go.dev/dl or: brew install go
cd agent
make all          # build for current platform
make release      # cross-compile all targets → dist/
```

## Run

```bash
./homeforge-agent
# Metrics:  http://localhost:9101/metrics
# Health:   http://localhost:9101/health
```

## Endpoints

| Endpoint   | Response                          |
|------------|-----------------------------------|
| `GET /metrics` | Full JSON metrics (cached 2s) |
| `GET /health`  | `{"status":"ok","platform":"..."}` |

## Platforms

| Target | Binary |
|--------|--------|
| Linux amd64 | `dist/homeforge-agent-linux-amd64` |
| Linux arm64 | `dist/homeforge-agent-linux-arm64` |
| Linux armv7 | `dist/homeforge-agent-linux-armv7` |
| macOS amd64 | `dist/homeforge-agent-darwin-amd64` |
| macOS arm64 | `dist/homeforge-agent-darwin-arm64` (Apple Silicon) |
| Windows amd64 | `dist/homeforge-agent-windows-amd64.exe` |
