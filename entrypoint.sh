#!/bin/sh
set -e

if [ -n "$TYPESENSE_DASHBOARD_CONFIG" ]; then
  echo "$TYPESENSE_DASHBOARD_CONFIG" | base64 -d > /srv/config.json
  echo "Generated config.json from TYPESENSE_DASHBOARD_CONFIG environment variable"
fi

exec caddy file-server
