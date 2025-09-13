{% macro export_model_to_json(model_name, output_path) %}
    {% if execute %}
        {% set relation = ref(model_name) %}
        
        {# Get the SQL to query the model #}
        {% set sql %}
            SELECT * FROM {{ relation }}
        {% endset %}
        
        {# Run the query #}
        {% set results = run_query(sql) %}
        
        {# Convert results to JSON #}
        {% set column_names = results.column_names %}
        {% set rows = results.rows %}
        
        {% set json_data = [] %}
        {% for row in rows %}
            {% set row_data = {} %}
            {% for i in range(column_names|length) %}
                {% set column_name = column_names[i] %}
                {% set column_value = row[i] %}
                
                {# Handle different data types for JSON serialization #}
                {% if column_value is number %}
                    {% do row_data.update({column_name: column_value}) %}
                {% elif column_value is string %}
                    {% do row_data.update({column_name: column_value}) %}
                {% elif column_value is none %}
                    {% do row_data.update({column_name: null}) %}
                {% elif column_value is boolean %}
                    {% do row_data.update({column_name: column_value}) %}
                {% else %}
                    {% do row_data.update({column_name: column_value|string}) %}
                {% endif %}
            {% endfor %}
            {% do json_data.append(row_data) %}
        {% endfor %}
        
        {# Write JSON to file #}
        {% do dbt_utils.write_json_to_file(json_data, output_path) %}
        
        {% do log("Exported " ~ results|length ~ " rows from " ~ model_name ~ " to " ~ output_path, info=True) %}
    {% endif %}
{% endmacro %}