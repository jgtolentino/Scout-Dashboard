# Project Scout Edge Flow Validation Report
Generated: 2025-05-12 12:52:50

## 🔍 Summary

This report validates the edge flow for Project Scout with special focus on transcript chunks, entity extraction, and brand mention analysis.

## 🖥️ Device Status

| Device ID | Status | Processing Load | Last Active |
| --------- | ------ | --------------- | ----------- |
| raspi_scout_042 | ✅ Online | HIGH | 2025-05-12 12:30:15 |
| raspi_scout_017 | ✅ Online | HIGH | 2025-05-12 12:45:22 |
| edgecam_tbwa_005 | ⚠️ Lagging | MEDIUM | 2025-05-12 11:58:47 |
| raspi_scout_025 | ✅ Online | MEDIUM | 2025-05-12 12:38:04 |
| edgecam_tbwa_008 | ✅ Online | LOW | 2025-05-12 12:42:19 |

## 📊 Transcript Chunk Status

| Status | Count | Percentage |
| ------ | ----- | ---------- |
| complete | 127 | 68% |
| partial | 42 | 22% |
| error | 19 | 10% |

---

## 🧠 Exploded Brand Mentions (from Reconstructed Transcripts)

| Brand         | Frequency | Detected In        |
| ------------- | --------- | ------------------ |
| Nike          | 12        | raspi_scout_017    |
| Pepsi         | 9         | edgecam_tbwa_005   |
| Samsung       | 8         | raspi_scout_042    |
| Jollibee      | 5         | raspi_scout_025    |
| Globe Telecom | 4         | edgecam_tbwa_008   |

> Source: Echo → Kalaw enrichment → partial `brand_mentions.json`

---

### 🔐 NEXT OPS

* [ ] Echo to re-run `brand_explode.py` across transcripts with `status IN ('complete', 'validated')`
* [ ] Kalaw to sync named entity metadata to `SKR -> /transcripts/entity_mentions/`
* [ ] Claudia to monitor gaps and dispatch follow-up QA prompts to Caca if entity confidence < 0.8