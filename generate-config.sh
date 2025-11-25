#!/bin/sh
# Generate config.json from environment variables
# This script is used in Docker containers to create config.json at runtime

CONFIG_FILE="${CONFIG_FILE:-/srv/config.json}"

# Create config object from environment variables
cat > "$CONFIG_FILE" <<EOF
{
  "apiKey": "${TYPESENSE_API_KEY:-}",
  "node": {
    "host": "${TYPESENSE_NODE_HOST:-localhost}",
    "port": "${TYPESENSE_NODE_PORT:-8108}",
    "protocol": "${TYPESENSE_NODE_PROTOCOL:-http}",
    "path": "${TYPESENSE_NODE_PATH:-}",
    "tls": ${TYPESENSE_NODE_TLS:-false}
  }
EOF

# Add history if TYPESENSE_HISTORY is provided (as JSON array)
if [ -n "$TYPESENSE_HISTORY" ]; then
  echo "," >> "$CONFIG_FILE"
  echo "  \"history\": $TYPESENSE_HISTORY" >> "$CONFIG_FILE"
fi

# Add UI config if provided
if [ -n "$TYPESENSE_UI_CONFIG" ]; then
  if [ -z "$TYPESENSE_HISTORY" ]; then
    echo "," >> "$CONFIG_FILE"
  else
    echo "," >> "$CONFIG_FILE"
  fi
  echo "  \"ui\": $TYPESENSE_UI_CONFIG" >> "$CONFIG_FILE"
fi

echo "}" >> "$CONFIG_FILE"

echo "Generated config.json at $CONFIG_FILE"
