#!/bin/sh
set -e

# Generate config.json from environment variables if they are set
if [ -n "$TYPESENSE_API_KEY" ] || [ -n "$TYPESENSE_NODE_HOST" ]; then
  /usr/local/bin/generate-config.sh
fi

# Start Caddy file server
exec caddy file-server
