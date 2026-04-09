#!/bin/sh
set -e

# Substitute environment variables into homeserver.yaml before starting Synapse
# This is needed because Synapse reads the config file directly and doesn't support
# environment variable interpolation natively.
INPUT="/data/homeserver.yaml.tpl"
OUTPUT="/data/homeserver.yaml"

if [ -f "$INPUT" ]; then
    # Use envsubst-style replacement with sed
    sed \
        -e "s/\${MATRIX_DB_USER}/${MATRIX_DB_USER}/g" \
        -e "s/\${MATRIX_DB_PASSWORD}/${MATRIX_DB_PASSWORD}/g" \
        -e "s/\${MATRIX_REGISTRATION_SECRET}/${MATRIX_REGISTRATION_SECRET}/g" \
        -e "s/\${MATRIX_MACAROON_SECRET_KEY}/${MATRIX_MACAROON_SECRET_KEY}/g" \
        -e "s/\${MATRIX_FORM_SECRET}/${MATRIX_FORM_SECRET}/g" \
        "$INPUT" > "$OUTPUT"
    echo "[entrypoint] homeserver.yaml generated from template"
else
    echo "[entrypoint] Using existing homeserver.yaml (no template found)"
fi

# Start Synapse
exec python -m synapse.app.homeserver -c /data/homeserver.yaml -c /data/localhost.log.config
