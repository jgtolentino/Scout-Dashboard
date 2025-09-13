#!/bin/bash
# This script is the main entrypoint for the code executor container

# Apply resource limits
source /home/pulsedev/limits.sh

# Check which runtime to use based on environment variables
if [ -n "$EXECUTE_FILE" ]; then
    FILE_PATH="/home/pulsedev/workspace/$EXECUTE_FILE"
    
    if [ ! -f "$FILE_PATH" ]; then
        echo "Error: File not found: $EXECUTE_FILE"
        exit 1
    fi
    
    # Get the file extension
    EXT="${EXECUTE_FILE##*.}"
    
    # Execute based on file extension
    case "$EXT" in
        js|jsx|ts|tsx)
            # Execute JavaScript/TypeScript file
            echo "Executing JavaScript/TypeScript file: $EXECUTE_FILE"
            node "$FILE_PATH"
            ;;
        py)
            # Execute Python file
            echo "Executing Python file: $EXECUTE_FILE"
            python3 "$FILE_PATH"
            ;;
        html)
            # For HTML files, just print a message
            echo "HTML file: $EXECUTE_FILE (preview in browser)"
            ;;
        sh)
            # Execute shell script
            echo "Executing shell script: $EXECUTE_FILE"
            bash "$FILE_PATH"
            ;;
        *)
            echo "Unsupported file type: $EXT"
            exit 1
            ;;
    esac
elif [ -n "$EXECUTE_CODE" ]; then
    LANGUAGE="${LANGUAGE:-js}"
    
    # Write the code to a temporary file
    if [ "$LANGUAGE" = "js" ] || [ "$LANGUAGE" = "javascript" ]; then
        TMP_FILE="/tmp/code.js"
        echo "$EXECUTE_CODE" > "$TMP_FILE"
        echo "Executing JavaScript code..."
        node "$TMP_FILE"
    elif [ "$LANGUAGE" = "py" ] || [ "$LANGUAGE" = "python" ]; then
        TMP_FILE="/tmp/code.py"
        echo "$EXECUTE_CODE" > "$TMP_FILE"
        echo "Executing Python code..."
        python3 "$TMP_FILE"
    elif [ "$LANGUAGE" = "sh" ] || [ "$LANGUAGE" = "bash" ]; then
        TMP_FILE="/tmp/code.sh"
        echo "$EXECUTE_CODE" > "$TMP_FILE"
        chmod +x "$TMP_FILE"
        echo "Executing shell script..."
        bash "$TMP_FILE"
    else
        echo "Unsupported language: $LANGUAGE"
        exit 1
    fi
elif [ -n "$EXECUTE_COMMAND" ]; then
    # Execute a shell command
    echo "Executing command: $EXECUTE_COMMAND"
    bash -c "$EXECUTE_COMMAND"
elif [ -n "$INSTALL_PACKAGE" ]; then
    # Install package
    PACKAGE_MANAGER="${PACKAGE_MANAGER:-npm}"
    
    if [ "$PACKAGE_MANAGER" = "npm" ]; then
        echo "Installing npm package: $INSTALL_PACKAGE"
        npm install "$INSTALL_PACKAGE" $NPM_FLAGS
    elif [ "$PACKAGE_MANAGER" = "pip" ]; then
        echo "Installing pip package: $INSTALL_PACKAGE"
        python3 -m pip install "$INSTALL_PACKAGE" $PIP_FLAGS
    else
        echo "Unsupported package manager: $PACKAGE_MANAGER"
        exit 1
    fi
else
    # If no execution parameters are provided, run the JS executor
    echo "No execution parameters provided. Starting executor..."
    
    # Determine which executor to run
    if [ -n "$USE_PYTHON_EXECUTOR" ]; then
        echo "Starting Python executor..."
        python3 /home/pulsedev/executor.py
    else
        echo "Starting JavaScript executor..."
        node /home/pulsedev/executor.js
    fi
fi

# Exit with the last command's exit code
exit $?