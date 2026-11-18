#!/bin/sh
set -eu
exec curl --fail --silent --show-error --max-time 3 \
  "http://127.0.0.1:${PORT:-8080}/api/health" >/dev/null
