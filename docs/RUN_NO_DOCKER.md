# Run without Docker

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r resolver/server/requirements.txt -r gateway/http/server/requirements.txt
uvicorn resolver.server.main:app --host 0.0.0.0 --port 8000 &
uvicorn gateway.http.server.main:app --host 0.0.0.0 --port 9000 &
```
