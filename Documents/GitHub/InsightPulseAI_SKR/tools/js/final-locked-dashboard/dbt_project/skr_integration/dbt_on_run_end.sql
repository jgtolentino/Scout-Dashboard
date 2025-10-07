-- dbt hook: run after dbt run completes
-- This hook will be automatically executed after dbt run completes

{% macro export_skr_metadata() %}
    {{ log("Exporting dbt metadata to SKR...", info=True) }}
    {% if execute %}
        {% do run_shell_command("python ../skr_integration/dbt_to_skr.py --manifest target/manifest.json --catalog target/catalog.json --template ../skr_integration/dbt_model_meta.yaml --output-dir ../skr_integration/metadata") %}
    {% endif %}
{% endmacro %}

-- Export metadata at the end of dbt run
{{ export_skr_metadata() }}
