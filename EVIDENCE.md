# EVIDENCE.md

Rule: a resume claim is allowed only if its row can be reproduced. Last verified: 2026-10-22.

| Claim | Number | How to reproduce | Status |
|---|---|---|---|
| Automated test suite | 45 tests pass | `pytest tests -q` | verified 2026-10-22 |
| Simulator is deterministic | same frame for same inputs | `pytest tests/test_simulator.py -q` | verified |
| Web payload telemetry is measured, not constants | record counts and run time computed per export | `pytest tests/test_export_honesty.py -q` | verified |
| Public payload never contains vendor data | default mode ignores the local lake | `pytest tests/test_export_honesty.py::test_simulated_mode_ignores_existing_lake -q` | verified |
| Alerts fire only on boundary crossings | transition logic | `pytest tests/test_serverless_alerts.py -q` | verified (tests pass; review code before quoting) |
| Previously claimed: "41.8 s ingestion vs 300 s SLA", "142K+ records", "Zero synthetic data", "100% validated" | none | were hard-coded or false | REMOVED, do not use on any resume |

## Known limits
- No live AWS deployment is claimed yet.
- Detection quality of the data checks is not yet benchmarked (planned: fault injection with ground truth).
