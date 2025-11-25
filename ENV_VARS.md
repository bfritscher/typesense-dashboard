# Environment Variables Configuration

This document explains how to use environment variables instead of hardcoded values in `config.json`.

## Overview

The application now supports three ways to configure autologin:

1. **Environment Variables (Docker)** - Runtime configuration via `TYPESENSE_*` env vars
2. **Vite Environment Variables (Development)** - Build-time configuration via `VITE_*` env vars  
3. **config.json File** - Traditional file-based configuration (fallback)

## Docker / Runtime Configuration

When running in Docker, you can set environment variables that will automatically generate `config.json` at container startup:

```bash
docker run -d -p 80:80 \
  -e TYPESENSE_API_KEY=your-api-key \
  -e TYPESENSE_NODE_HOST=typesense-server.example.com \
  -e TYPESENSE_NODE_PORT=8108 \
  -e TYPESENSE_NODE_PROTOCOL=https \
  -e TYPESENSE_NODE_TLS=true \
  typesense-dashboard
```

### Available Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TYPESENSE_API_KEY` | Typesense API key | - | Yes |
| `TYPESENSE_NODE_HOST` | Server hostname | `localhost` | No |
| `TYPESENSE_NODE_PORT` | Server port | `8108` | No |
| `TYPESENSE_NODE_PROTOCOL` | Protocol (`http` or `https`) | `http` | No |
| `TYPESENSE_NODE_PATH` | API path prefix | `` (empty) | No |
| `TYPESENSE_NODE_TLS` | Enable TLS (`true` or `false`) | `false` | No |
| `TYPESENSE_HISTORY` | JSON array of history entries | - | No |
| `TYPESENSE_UI_CONFIG` | JSON object for UI config | - | No |

### Example with History

```bash
docker run -d -p 80:80 \
  -e TYPESENSE_API_KEY=key1 \
  -e TYPESENSE_NODE_HOST=server1.example.com \
  -e TYPESENSE_HISTORY='[{"apiKey":"key2","node":{"host":"server2.example.com","port":"8108","protocol":"https","path":"","tls":true},"clusterTag":"prod"}]' \
  typesense-dashboard
```

## Development Configuration

For local development, you can either:

1. **Create `public/config.json` manually** - Same format as the sample file
2. **Use environment variables** - Set `TYPESENSE_*` variables and run `generate-config.sh` before starting the dev server

## How It Works

The application loads configuration from `config.json` at runtime via `axios.get('config.json')`. 

- **For Docker**: The `generate-config.sh` script creates `config.json` from `TYPESENSE_*` environment variables at container startup
- **For Development**: You can manually create `public/config.json` or use the same environment variable approach
