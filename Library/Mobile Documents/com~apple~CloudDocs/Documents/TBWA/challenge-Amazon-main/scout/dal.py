import os, json, urllib.parse, requests
from typing import Dict, Any, List

API_BASE = os.environ.get("SCOUT_API_BASE", "http://localhost:54321/rest/v1")
# Bruno injects SCOUT_API_KEY securely at run time; we never commit it.
API_KEY  = os.environ.get("SCOUT_API_KEY", None)

def _headers():
    h = {"Content-Type": "application/json"}
    if API_KEY: h["apikey"] = API_KEY; h["Authorization"] = f"Bearer {API_KEY}"
    return h

def trend(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    params = {kvi, time_grain, dimensions, filters{date_from,date_to,brand,region,category,persona}}
    maps to scout.gold_transactions and friends
    """
    # Example: /rpc/scout_trend?select=...
    url = f"{API_BASE}/rpc/scout_trend"
    resp = requests.post(url, headers=_headers(), data=json.dumps(params), timeout=60)
    resp.raise_for_status()
    return resp.json()

def top(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    url = f"{API_BASE}/rpc/scout_top"
    resp = requests.post(url, headers=_headers(), data=json.dumps(params), timeout=60)
    resp.raise_for_status()
    return resp.json()

def geo(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    url = f"{API_BASE}/rpc/scout_geo"
    resp = requests.post(url, headers=_headers(), data=json.dumps(params), timeout=60)
    resp.raise_for_status()
    return resp.json()

def ai(spec: Dict[str, Any]) -> Dict[str, Any]:
    # Forward spec to your Edge Function for AI/JSON prompting
    edge = os.environ.get("SCOUT_AI_EDGE", "")
    if not edge: return {"error":"SCOUT_AI_EDGE not set"}
    r = requests.post(edge, headers=_headers(), data=json.dumps(spec), timeout=90)
    r.raise_for_status()
    return r.json()
