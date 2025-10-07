import os, json, time, requests
from typing import Dict, Any, List

INSIGHTS = os.environ.get("SCOUT_INSIGHTS_EDGE", "")
RECS     = os.environ.get("SCOUT_RECS_EDGE", "")
API_KEY  = os.environ.get("SCOUT_API_KEY", None)

def _headers():
    h = {"Content-Type": "application/json"}
    if API_KEY:
        h["apikey"] = API_KEY
        h["Authorization"] = f"Bearer {API_KEY}"
    return h

def _post(url: str, payload: dict):
    # retry a couple of times on 429/5xx without leaking secrets
    for i in range(3):
        r = requests.post(url, headers=_headers(), data=json.dumps(payload), timeout=90)
        if r.status_code < 400:
            return r.json()
        if r.status_code in (429, 500, 502, 503, 504) and i < 2:
            time.sleep(1.0 * (i + 1))
            continue
        raise RuntimeError(f"{url} failed: {r.status_code} {r.text[:200]}")
    raise RuntimeError(f"{url} failed after retries")

# ---------- Primary API path (Edge Functions) ----------
def trend(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Edge: SCOUT_INSIGHTS_EDGE
    Expecting an InsightSpec-like payload with kpi/time_grain/dimensions/filters
    """
    if not INSIGHTS:
        raise RuntimeError("SCOUT_INSIGHTS_EDGE not set")
    payload = {"type": "InsightSpec", **params}
    data = _post(INSIGHTS, payload)
    # Expect either a direct series or an {data:[...]} envelope
    return data.get("data", data)

def top(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not INSIGHTS:
        raise RuntimeError("SCOUT_INSIGHTS_EDGE not set")
    payload = {"type": "InsightSpec", "mode": "top", **params}
    data = _post(INSIGHTS, payload)
    return data.get("data", data)

def geo(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not INSIGHTS:
        raise RuntimeError("SCOUT_INSIGHTS_EDGE not set")
    payload = {"type": "InsightSpec", "mode": "geo", **params}
    data = _post(INSIGHTS, payload)
    return data.get("data", data)

def recommend(spec: Dict[str, Any]) -> Dict[str, Any]:
    """
    Edge: SCOUT_RECS_EDGE
    Spec is RecommendationSpec
    """
    if not RECS:
        raise RuntimeError("SCOUT_RECS_EDGE not set")
    payload = {"type": "RecommendationSpec", **spec}
    return _post(RECS, payload)

# ---------- Optional CSV fallback helpers ----------
def trend_csv_fallback(read_fn, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    read_fn: callable returning a pandas.DataFrame from local CSV
    Implement your current CSV logic here and return list[dict].
    """
    df = read_fn()
    # ... existing groupby/aggregate code ...
    return json.loads(df.to_json(orient="records"))

# Legacy function for backward compatibility - now uses recommend()
def ai(spec: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy ai() function - redirects to recommend() for backward compatibility"""
    return recommend(spec)
