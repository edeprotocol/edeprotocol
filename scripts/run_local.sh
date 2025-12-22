#!/usr/bin/env bash
set -euo pipefail
MODE=${1:-docker}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [[ "$MODE" == "docker" ]]; then
  docker compose up -d
  sleep 5
elif [[ "$MODE" == "no-docker" ]]; then
  echo "Starting resolver (uvicorn)" && uvicorn resolver.server.main:app --port 8000 --host 0.0.0.0 --reload &
  RESOLVER_PID=$!
  echo "Starting gateway (uvicorn)" && uvicorn gateway.http.server.main:app --port 9000 --host 0.0.0.0 --reload &
  GATEWAY_PID=$!
  trap "kill $RESOLVER_PID $GATEWAY_PID" EXIT
  sleep 5
fi

curl -sf http://localhost:8000/health
curl -sf http://localhost:9000/health

curl -s -X POST http://localhost:8000/register -H 'Content-Type: application/json' \
  -d @${ROOT}/examples/example_nir.json || true
curl -s -X POST http://localhost:9000/ingest -H 'Content-Type: application/json' \
  -d @${ROOT}/examples/example_nil_intent.json || true

if command -v node >/dev/null; then
  (cd ${ROOT}/conformance/cli/ede-lint && npm install && npm run build >/dev/null)
  node ${ROOT}/conformance/cli/ede-lint/dist/index.js validate ${ROOT}/examples || true
fi

echo "SUCCESS: services healthy"
