import json
from pathlib import Path

def write_stub_outputs(base: Path) -> None:
    base.mkdir(parents=True, exist_ok=True)
    sample_doc = {"version": "stub", "note": "replace with real replay outputs"}
    for name in ["transducer_frames.jsonl", "nil_stream.jsonl", "nil_intents.jsonl", "csl_sessions.jsonl"]:
        (base / name).write_text(json.dumps(sample_doc) + "\n")
