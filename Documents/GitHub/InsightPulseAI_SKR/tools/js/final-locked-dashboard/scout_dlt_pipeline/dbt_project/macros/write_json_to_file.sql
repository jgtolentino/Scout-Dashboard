{% macro write_json_to_file(json_data, output_path) %}
    {% if execute %}
        {% do log("Writing JSON to file: " ~ output_path, info=True) %}
        
        {% set json_string = tojson(json_data) %}
        
        {% set python_code %}
import json
import os

# Create directory if it doesn't exist
os.makedirs(os.path.dirname('{{ output_path }}'), exist_ok=True)

# Write JSON to file
with open('{{ output_path }}', 'w') as f:
    f.write('''{{ json_string }}''')

print(f"Successfully wrote JSON to {{ output_path }}")
        {% endset %}
        
        {% do run_python(python_code) %}
    {% endif %}
{% endmacro %}

{% macro run_python(code) %}
    {% if execute %}
        {% set temp_file = '/tmp/dbt_python_' ~ range(1, 10000) | random ~ '.py' %}
        {% do log("Running Python code via: " ~ temp_file, info=True) %}
        
        {% do write_file(temp_file, code) %}
        {% set result = run_command('python ' ~ temp_file) %}
        {% do run_command('rm ' ~ temp_file) %}
        
        {% do log(result.stderr, info=True) %}
        {% do log(result.stdout, info=True) %}
    {% endif %}
{% endmacro %}

{% macro write_file(filepath, contents) %}
    {% if execute %}
        {% set python_code %}
with open('{{ filepath }}', 'w') as f:
    f.write('''{{ contents }}''')
        {% endset %}
        
        {% set temp_script = '/tmp/dbt_write_file_' ~ range(1, 10000) | random ~ '.py' %}
        {% do log("Writing file: " ~ filepath ~ " via: " ~ temp_script, info=True) %}
        
        {% do run_command('cat > ' ~ temp_script ~ " << 'EOL'\n" ~ python_code ~ '\nEOL') %}
        {% do run_command('python ' ~ temp_script) %}
        {% do run_command('rm ' ~ temp_script) %}
    {% endif %}
{% endmacro %}

{% macro run_command(command) %}
    {% if execute %}
        {% set temp_file = '/tmp/dbt_command_output_' ~ range(1, 10000) | random ~ '.txt' %}
        {% set command_with_output = command ~ ' > ' ~ temp_file ~ ' 2>&1' %}
        
        {% do log("Running command: " ~ command, info=True) %}
        {% do run_shell(command_with_output) %}
        
        {% set output = read_file(temp_file) %}
        {% do run_shell('rm ' ~ temp_file) %}
        
        {% set result = {'stdout': output, 'stderr': ''} %}
        {% do return(result) %}
    {% endif %}
{% endmacro %}

{% macro run_shell(command) %}
    {% if execute %}
        {{ return(adapter.execute(command)) }}
    {% endif %}
{% endmacro %}

{% macro read_file(filepath) %}
    {% if execute %}
        {% set python_code %}
try:
    with open('{{ filepath }}', 'r') as f:
        print(f.read())
except Exception as e:
    print(f"Error reading file: {e}")
        {% endset %}
        
        {% set temp_script = '/tmp/dbt_read_file_' ~ range(1, 10000) | random ~ '.py' %}
        {% do log("Reading file: " ~ filepath ~ " via: " ~ temp_script, info=True) %}
        
        {% do run_command('cat > ' ~ temp_script ~ " << 'EOL'\n" ~ python_code ~ '\nEOL') %}
        {% set result = run_command('python ' ~ temp_script) %}
        {% do run_command('rm ' ~ temp_script) %}
        
        {% do return(result.stdout) %}
    {% endif %}
{% endmacro %}