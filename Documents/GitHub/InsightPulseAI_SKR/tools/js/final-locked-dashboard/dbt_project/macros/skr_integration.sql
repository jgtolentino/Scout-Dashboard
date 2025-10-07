-- dbt macros for SKR integration

-- Export dbt metadata to SKR after run
{% macro on_run_end() %}
    {{ log("Running on_run_end hook for SKR integration", info=True) }}
    {% do run_query("select 1") %}  -- Dummy query to ensure hook runs
    {{ log("Exporting metadata to SKR...", info=True) }}
    {% if execute %}
        {% do run_shell_command("python ../skr_integration/dbt_to_skr.py --manifest target/manifest.json --catalog target/catalog.json --template ../skr_integration/dbt_model_meta.yaml --output-dir ../skr_integration/metadata") %}
    {% endif %}
{% endmacro %}

-- Add SKR metadata to models
{% macro skr_metadata(
    resource_type = "model",
    owner = "scout_edge",
    tags = [],
    metrics = []
) %}
  {{ config(
    meta = {
      "resource_type": resource_type,
      "owner": owner,
      "tags": tags,
      "skr_metrics": metrics,
      "skr_updated_at": modules.datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
  ) }}
{% endmacro %}
