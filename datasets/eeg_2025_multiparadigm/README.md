# EEG 2025 multi-paradigm dataset

Instructions to download Figshare EEG dataset. Place EDF/CSV/NPZ files under `datasets/eeg_2025_multiparadigm/raw/`.

The replay adapter `adapters/replay/replay_eeg_2025_multiparadigm.py` emits TransducerFrames, NIL stream, intents, and CSL sessions into `conformance/test-vectors/eeg_2025_multiparadigm/`.
