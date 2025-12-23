import json
from pathlib import Path

from adapters.replay.utils import write_stub_outputs

if __name__ == "__main__":
    base = Path(__file__).resolve().parents[1] / "conformance/test-vectors/emg_2025_kinematic"
    write_stub_outputs(base)
    print(f"wrote stub vectors to {base}")
