{% macro test_data_freshness(model, date_column, max_age_hours=24) %}

  {% set query %}
    SELECT COUNT(*)
    FROM {{ model }}
    WHERE {{ date_column }} < CURRENT_TIMESTAMP - INTERVAL '{{ max_age_hours }} hours'
  {% endset %}

  {% set results = run_query(query) %}
  {% if results %}
    {% set stale_count = results.columns[0][0] %}
    {% if stale_count > 0 %}
      SELECT 'Data freshness test failed: {{ stale_count }} stale records found' AS error
    {% endif %}
  {% endif %}

{% endmacro %}