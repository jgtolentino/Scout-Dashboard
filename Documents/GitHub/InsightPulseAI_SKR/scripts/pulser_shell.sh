#!/bin/bash
#
# pulser_shell.sh - Interactive shell for Pulser local LLM queries
#
# This script provides an interactive shell interface where every line
# entered is interpreted as a query to the local Pulser LLM (Mistral).

VERSION="1.1.1"

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
PULSER_SCRIPT="${SCRIPT_DIR}/pulser_infer_ollama.py"
HISTORY_FILE="${REPO_ROOT}/logs/pulser_shell_history.txt"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$HISTORY_FILE")"

# Display banner
function show_banner() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}${BOLD}                       Pulser Interactive Shell v${VERSION}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Every line you type is sent to the local Pulser LLM (Mistral)${NC}"
    echo -e "${YELLOW}Type ${MAGENTA}:help${YELLOW} for commands or ${MAGENTA}:quit${YELLOW} to exit${NC}"
    echo
}

# Check if Ollama and Mistral are available
function check_setup() {
    # Check if Ollama is installed
    if ! command -v ollama &> /dev/null; then
        echo -e "${RED}Error: Ollama is not installed. Please install it with:${NC}"
        echo -e "${YELLOW}brew install ollama${NC}"
        exit 1
    fi
    
    # Check if Mistral model is available
    if ! curl -s http://127.0.0.1:11434/api/tags | grep -q "mistral"; then
        echo -e "${YELLOW}Mistral model not found. Downloading...${NC}"
        ollama pull mistral
        
        if ! curl -s http://127.0.0.1:11434/api/tags | grep -q "mistral"; then
            echo -e "${RED}Failed to download Mistral model.${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}Successfully downloaded Mistral model.${NC}"
    fi
}

# Show help message
function show_help() {
    echo -e "${BLUE}${BOLD}Pulser Shell Commands:${NC}"
    echo -e "${MAGENTA}:help${NC}              Show this help message"
    echo -e "${MAGENTA}:quit${NC}, ${MAGENTA}:exit${NC}       Exit the shell"
    echo -e "${MAGENTA}:clear${NC}             Clear the screen"
    echo -e "${MAGENTA}:history${NC}           Show command history"
    echo -e "${MAGENTA}:task NAME${NC}         Create a new task with the given name"
    echo -e "${MAGENTA}:clodrep ISSUE${NC}     Report a Pulser v1.2.1 defect to Claudia"
    echo -e "${MAGENTA}:models${NC}            List available Ollama models"
    echo -e "${MAGENTA}:switch MODEL${NC}      Switch to a different Ollama model"
    echo -e "${MAGENTA}:!COMMAND${NC}          Execute a shell command"
    echo -e "${MAGENTA}:save FILENAME${NC}     Save the last response to a file"
    echo -e "${MAGENTA}:stream${NC}            Toggle streaming mode (default: on)"
    echo
    echo -e "${YELLOW}Any other input will be sent as a query to the LLM.${NC}"
}

# Main function
function main() {
    show_banner
    check_setup
    
    local current_model="mistral"
    local last_response=""
    local streaming=true
    
    echo -e "${GREEN}Pulser shell ready. Using ${BOLD}$current_model${NC}"
    
    # Main loop
    while true; do
        # Display prompt
        echo -ne "${BOLD}${CYAN}pulser>${NC} "
        read -r input
        
        # Exit if user presses Ctrl+D (EOF)
        if [ $? -ne 0 ]; then
            echo
            echo -e "${YELLOW}Exiting...${NC}"
            break
        fi
        
        # Skip empty lines
        if [ -z "$input" ]; then
            continue
        fi
        
        # Add to history
        echo "$input" >> "$HISTORY_FILE"
        
        # Handle special commands
        if [[ "$input" == :* ]]; then
            cmd="${input#:}"
            
            case "$cmd" in
                quit|exit)
                    echo -e "${YELLOW}Exiting...${NC}"
                    break
                    ;;
                help)
                    show_help
                    ;;
                clear)
                    clear
                    show_banner
                    ;;
                history)
                    if [ -f "$HISTORY_FILE" ]; then
                        echo -e "${BLUE}Command History:${NC}"
                        cat -n "$HISTORY_FILE" | tail -n 20
                    else
                        echo -e "${YELLOW}No history found.${NC}"
                    fi
                    ;;
                task*)
                    task_name="${cmd#task}"
                    task_name="${task_name## }"
                    
                    if [ -z "$task_name" ]; then
                        echo -e "${YELLOW}Please specify a task name.${NC}"
                    else
                        # Generate a unique task ID with timestamp
                        task_id="${task_name}-$(date +"%Y%m%d%H%M%S")"
                        echo -e "${BLUE}🧠 Creating system task: ${BOLD}$task_id${NC}"
                        
                        # Ensure tasks directory exists
                        mkdir -p "${REPO_ROOT}/SKR/tasks"
                        
                        # Create task file
                        task_file="${REPO_ROOT}/SKR/tasks/${task_id}.yaml"
                        echo "task_id: \"${task_id}\"" > "$task_file"
                        echo "name: \"${task_name}\"" >> "$task_file"
                        echo "created_at: \"$(date +"%Y-%m-%d %H:%M:%S")\"" >> "$task_file"
                        echo "status: \"in_progress\"" >> "$task_file"
                        echo "model: \"${current_model}\"" >> "$task_file"
                        echo "source: \"pulser-shell\"" >> "$task_file"
                        
                        echo -e "${GREEN}✅ Task $task_id logged to SKR/tasks/${NC}"
                        
                        # Run the task router if it exists
                        if [ -f "${REPO_ROOT}/pulser_task_router.py" ]; then
                            echo -e "${BLUE}Running task router...${NC}"
                            python3 "${REPO_ROOT}/pulser_task_router.py" --task "$task_id"
                        fi
                        
                        # Skip LLM processing
                        continue
                    fi
                    ;;
                clodrep*)
                    issue_title="${cmd#clodrep}"
                    issue_title="${issue_title## }"
                    
                    if [ -z "$issue_title" ]; then
                        echo -e "${YELLOW}Please specify an issue title.${NC}"
                    else
                        # Generate a task ID for defect reporting
                        task_id="pulser-defect-$(date +"%Y%m%d%H%M%S")"
                        echo -e "${MAGENTA}🐞 Creating defect report: ${BOLD}$task_id${NC}"
                        
                        # Ensure tasks directory exists
                        mkdir -p "${REPO_ROOT}/SKR/tasks"
                        
                        # Create defect task file
                        task_file="${REPO_ROOT}/SKR/tasks/${task_id}.yaml"
                        echo "task_id: \"${task_id}\"" > "$task_file"
                        echo "name: \"Pulser Defect: ${issue_title}\"" >> "$task_file"
                        echo "type: \"defect_report\"" >> "$task_file"
                        echo "created_at: \"$(date +"%Y-%m-%d %H:%M:%S")\"" >> "$task_file"
                        echo "status: \"pending\"" >> "$task_file"
                        echo "priority: \"high\"" >> "$task_file"
                        echo "version: \"v1.2.1\"" >> "$task_file"
                        echo "component: \"Pulser\"" >> "$task_file"
                        echo "reported_by: \"${USER}\"" >> "$task_file"
                        echo "description: \"${issue_title}\"" >> "$task_file"
                        echo "source: \"clodrep-command\"" >> "$task_file"
                        
                        echo -e "${GREEN}✅ Defect report $task_id logged to SKR/tasks/${NC}"
                        
                        # Run the task router if it exists
                        if [ -f "${REPO_ROOT}/pulser_task_router.py" ]; then
                            echo -e "${BLUE}Running task router...${NC}"
                            python3 "${REPO_ROOT}/pulser_task_router.py" --task "$task_id" --notify
                        fi
                        
                        # Create a file in inbox to ensure Claudia processes it
                        inbox_dir="${REPO_ROOT}/SKR/inbox"
                        mkdir -p "$inbox_dir"
                        
                        notification_file="${inbox_dir}/defect_notification_${task_id}.yaml"
                        echo "type: defect_notification" > "$notification_file"
                        echo "task_id: \"${task_id}\"" >> "$notification_file"
                        echo "timestamp: \"$(date +"%Y-%m-%dT%H:%M:%S")\"" >> "$notification_file"
                        echo "title: \"Pulser Defect: ${issue_title}\"" >> "$notification_file"
                        echo "priority: \"high\"" >> "$notification_file"
                        echo "version: \"v1.2.1\"" >> "$notification_file"
                        echo "message: \"New Pulser v1.2.1 defect reported: ${issue_title}\"" >> "$notification_file"
                        
                        echo -e "${MAGENTA}📬 Notification sent to Claudia about defect ${task_id}${NC}"
                        
                        # Skip LLM processing
                        continue
                    fi
                    ;;
                models)
                    echo -e "${BLUE}Available Models:${NC}"
                    curl -s http://127.0.0.1:11434/api/tags | python3 -c "import sys, json; print('\n'.join([m['name'] for m in json.load(sys.stdin)['models']]))"
                    ;;
                switch*)
                    model_name="${cmd#switch}"
                    model_name="${model_name## }"
                    
                    if [ -z "$model_name" ]; then
                        echo -e "${YELLOW}Please specify a model name.${NC}"
                    else
                        # Check if model exists
                        if curl -s http://127.0.0.1:11434/api/tags | grep -q "\"name\":\"$model_name\""; then
                            current_model="$model_name"
                            echo -e "${GREEN}Switched to model: ${BOLD}$current_model${NC}"
                        else
                            echo -e "${YELLOW}Model '$model_name' not found. Attempting to download...${NC}"
                            if ollama pull "$model_name"; then
                                current_model="$model_name"
                                echo -e "${GREEN}Switched to model: ${BOLD}$current_model${NC}"
                            else
                                echo -e "${RED}Failed to download model '$model_name'.${NC}"
                            fi
                        fi
                    fi
                    ;;
                save*)
                    filename="${cmd#save}"
                    filename="${filename## }"
                    
                    if [ -z "$filename" ]; then
                        echo -e "${YELLOW}Please specify a filename.${NC}"
                    else
                        if [ -z "$last_response" ]; then
                            echo -e "${YELLOW}No response to save.${NC}"
                        else
                            echo "$last_response" > "$filename"
                            echo -e "${GREEN}Response saved to ${BOLD}$filename${NC}"
                        fi
                    fi
                    ;;
                stream)
                    streaming=!$streaming
                    if $streaming; then
                        echo -e "${GREEN}Streaming mode enabled.${NC}"
                    else
                        echo -e "${YELLOW}Streaming mode disabled.${NC}"
                    fi
                    ;;
                !*)
                    shell_cmd="${cmd#!}"
                    echo -e "${YELLOW}Executing: ${shell_cmd}${NC}"
                    eval "$shell_cmd"
                    ;;
                *)
                    echo -e "${YELLOW}Unknown command: ${input}${NC}"
                    ;;
            esac
        else
            # Regular query to LLM
            echo -e "${BLUE}⟩ Asking ${BOLD}$current_model${NC}${BLUE}...${NC}"
            
            # Build parameters
            local params=("--model" "$current_model")
            if $streaming; then
                params+=("--stream")
            fi
            
            # Run the query
            response=$(python3 "$PULSER_SCRIPT" "${params[@]}" "$input")
            exit_code=$?
            
            if [ $exit_code -ne 0 ]; then
                echo -e "${RED}Error: Failed to get response from LLM.${NC}"
            else
                # Store the response
                last_response="$response"
                
                # If not streaming, print the response
                if ! $streaming; then
                    echo
                    echo -e "${GREEN}Response:${NC}"
                    echo "$response"
                    echo
                fi
            fi
        fi
    done
}

# Run main function
main