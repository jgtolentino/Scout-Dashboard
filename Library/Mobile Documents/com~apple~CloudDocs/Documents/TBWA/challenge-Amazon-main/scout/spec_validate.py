import json, os
from jsonschema import validate, Draft202012Validator

BASE = os.path.join(os.path.dirname(__file__), "..", "contracts", "json")
INSIGHT = json.load(open(os.path.join(BASE, "insight_spec.schema.json")))
RECOM   = json.load(open(os.path.join(BASE, "recommendation_spec.schema.json")))  
SAVED   = json.load(open(os.path.join(BASE, "saved_query_spec.schema.json")))

def validate_spec(payload: dict):
    t = payload.get("type")
    schema = {"InsightSpec": INSIGHT, "RecommendationSpec": RECOM, "SavedQuerySpec": SAVED}.get(t)
    if not schema: return False, ["Unsupported spec type"]
    v = Draft202012Validator(schema)
    errors = [f"{e.path} {e.message}" for e in v.iter_errors(payload)]
    return (len(errors) == 0, errors)
