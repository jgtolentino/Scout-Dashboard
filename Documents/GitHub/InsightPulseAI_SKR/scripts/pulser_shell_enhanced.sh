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
SESSION_LOG="${REPO_ROOT}/logs/pulser_session.log"
LAST_SESSION_FILE="${REPO_ROOT}/logs/pulser_last_session.json"
SKR_DIR="${REPO_ROOT}/SKR"
SKR_SESSIONS_DIR="${SKR_DIR}/sessions"
SKR_INDEX_FILE="${SKR_SESSIONS_DIR}/index.json"

# Create necessary directories
mkdir -p "$(dirname "$HISTORY_FILE")" "$SKR_SESSIONS_DIR"

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
    
    # Check if Ollama is running
    if ! curl -s http://127.0.0.1:11434/api/tags &> /dev/null; then
        echo -e "${YELLOW}Ollama is not running. Starting service...${NC}"
        ollama serve &>/dev/null &
        sleep 2
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
    echo -e "${MAGENTA}:models${NC}            List available Ollama models"
    echo -e "${MAGENTA}:switch MODEL${NC}      Switch to a different Ollama model"
    echo -e "${MAGENTA}:task NAME${NC}         Start a new task with automatic session tagging"
    echo -e "${MAGENTA}:!COMMAND${NC}          Execute a shell command"
    echo -e "${MAGENTA}:save FILENAME${NC}     Save the last response to a file"
    echo -e "${MAGENTA}:stream${NC}            Toggle streaming mode (default: on)"
    echo -e "${MAGENTA}:logs${NC}              Show recent session logs"
    echo -e "${MAGENTA}:skr${NC}               Save current session to SKR"
    echo -e "${MAGENTA}:resume${NC}            Resume from your last session"
    echo -e "${MAGENTA}:search TERM${NC}       Search SKR for past sessions"
    echo -e "${MAGENTA}:docs${NC}              Open agent capabilities documentation dashboard"
    echo
    echo -e "${YELLOW}Keyboard Shortcuts:${NC}"
    echo -e "${MAGENTA}Ctrl+C${NC}             Interrupt current operation (press twice to force exit)"
    echo -e "${MAGENTA}Esc${NC}                Cancel current input"
    echo
    echo -e "${YELLOW}Any other input will be sent as a query to the LLM.${NC}"
}

# Log entry to SKR
function save_to_skr() {
    local title="$1"
    local content="$2"
    local model="$3"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local skr_dir="${SKR_DIR}/inbox/pulser_session_${timestamp}"
    
    # Create SKR entry directory
    mkdir -p "$skr_dir"
    
    # Create metadata file
    cat > "${skr_dir}/metadata.yml" << EOF
title: "Pulser Shell Session: ${title}"
date: "$(date +"%Y-%m-%d %H:%M:%S")"
author: "Pulser Shell"
type: "shell_session"
model: "${model}"
tags:
  - pulser
  - shell
  - ${model}
  - ollama
EOF
    
    # Create content file
    echo "$content" > "${skr_dir}/content.txt"
    
    # Create summary
    echo "# Pulser Shell Session: ${title}" > "${skr_dir}/summary.md"
    echo "" >> "${skr_dir}/summary.md"
    echo "Date: $(date +"%Y-%m-%d %H:%M:%S")" >> "${skr_dir}/summary.md"
    echo "Model: ${model}" >> "${skr_dir}/summary.md"
    echo "" >> "${skr_dir}/summary.md"
    echo "## Overview" >> "${skr_dir}/summary.md"
    echo "Shell session with local Pulser LLM." >> "${skr_dir}/summary.md"
    
    # Run the indexer to update the index
    python3 "${SCRIPT_DIR}/session_indexer.py" --update > /dev/null
    
    # Save this as the last session
    local session_data="{
        \"id\": \"pulser_session_${timestamp}\",
        \"title\": \"${title}\",
        \"date\": \"$(date +"%Y-%m-%d %H:%M:%S")\",
        \"path\": \"${skr_dir}\",
        \"model\": \"${model}\",
        \"content\": \"${content//\"/\\\"}\",
        \"type\": \"shell_session\"
    }"
    
    echo "$session_data" > "${LAST_SESSION_FILE}"
    
    return 0
}

# Search SKR sessions
function search_skr_sessions() {
    local query="$1"
    
    if [ -z "$query" ]; then
        echo -e "${YELLOW}Please provide a search term.${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Searching SKR sessions for '${query}'...${NC}"
    python3 "${SCRIPT_DIR}/session_indexer.py" --search "$query"
    return $?
}

# Resume from last session
function resume_last_session() {
    if [ ! -f "$LAST_SESSION_FILE" ]; then
        echo -e "${YELLOW}No previous session found.${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Loading previous session...${NC}"
    
    # Extract data from last session
    local title=$(jq -r '.title' "$LAST_SESSION_FILE" 2>/dev/null)
    local content=$(jq -r '.content' "$LAST_SESSION_FILE" 2>/dev/null)
    local session_id=$(jq -r '.id' "$LAST_SESSION_FILE" 2>/dev/null)
    local model=$(jq -r '.model' "$LAST_SESSION_FILE" 2>/dev/null)
    
    if [ -z "$title" ] || [ -z "$content" ] || [ -z "$session_id" ]; then
        echo -e "${RED}Error: Failed to load previous session data.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Resumed from: ${BOLD}${title}${NC}"
    echo -e "${BLUE}Session ID: ${session_id}${NC}"
    
    if [ ! -z "$model" ] && [ "$model" != "null" ]; then
        if curl -s http://127.0.0.1:11434/api/tags | grep -q "\"name\":\"$model\""; then
            echo -e "${GREEN}Using model from previous session: ${BOLD}${model}${NC}"
            current_model="$model"
        else
            echo -e "${YELLOW}Model '${model}' from previous session not found. Using default model.${NC}"
        fi
    fi
    
    # Add the previous content to the current session
    session_content=$(echo -e "$content")
    
    echo -e "${GREEN}Previous context loaded. Continue your conversation.${NC}"
    return 0
}

# Handle Ctrl+C
function handle_sigint() {
    echo
    echo -e "${YELLOW}Received interrupt signal. Use ${MAGENTA}:quit${YELLOW} to exit cleanly or press Ctrl+C again to force exit.${NC}"
    # Reset the trap
    trap handle_force_exit SIGINT
}

# Handle forced exit (second Ctrl+C)
function handle_force_exit() {
    echo
    echo -e "${RED}Forcing exit...${NC}"
    # Log session end
    local session_end=$(date +"%Y-%m-%d %H:%M:%S")
    echo "=== Pulser Shell Session $session_id force terminated at $session_end ===" >> "$SESSION_LOG"
    exit 1
}

# Main function
function main() {
    show_banner
    check_setup
    
    local current_model="mistral"
    local last_response=""
    local streaming=true
    local session_start=$(date +"%Y-%m-%d %H:%M:%S")
    local session_id=$(date +"%Y%m%d_%H%M%S")
    local session_content=""
    
    # Set up signal trap for Ctrl+C
    trap handle_sigint SIGINT
    
    # Log session start
    echo "=== Pulser Shell Session $session_id started at $session_start ===" >> "$SESSION_LOG"
    
    echo -e "${GREEN}Pulser shell ready. Using ${BOLD}$current_model${NC}"
    
    # Main loop
    while true; do
        # Display prompt
        echo -ne "${BOLD}${CYAN}pulser>${NC} "
        # Use -e for escape sequences, including ESC key support
        read -e -r input
        
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
        
        # Add to session content
        session_content+="User: $input\n\n"
        
        # Handle special commands
        if [[ "$input" == :* ]]; then
            cmd="${input#:}"
            
            case "$cmd" in
                quit|exit)
                    echo -e "${YELLOW}Exiting...${NC}"
                    
                    # Log session end
                    local session_end=$(date +"%Y-%m-%d %H:%M:%S")
                    echo "=== Pulser Shell Session $session_id ended at $session_end ===" >> "$SESSION_LOG"
                    
                    # Ask if user wants to save to SKR
                    echo -e "${YELLOW}Would you like to save this session to SKR? (y/N)${NC}"
                    read -r save_skr
                    if [[ "$save_skr" =~ ^[Yy]$ ]]; then
                        echo -e "${YELLOW}Enter a title for this session:${NC}"
                        read -r session_title
                        if [ -z "$session_title" ]; then
                            session_title="Pulser Session $session_id"
                        fi
                        
                        if save_to_skr "$session_title" "$session_content" "$current_model"; then
                            echo -e "${GREEN}Session saved to SKR${NC}"
                        else
                            echo -e "${RED}Failed to save session to SKR${NC}"
                        fi
                    fi
                    
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
                            
                            # Log model switch
                            echo "[$(date +"%Y-%m-%d %H:%M:%S")] Switched to model: $current_model" >> "$SESSION_LOG"
                            session_content+="System: Switched to model: $current_model\n\n"
                        else
                            echo -e "${YELLOW}Model '$model_name' not found. Attempting to download...${NC}"
                            if ollama pull "$model_name"; then
                                current_model="$model_name"
                                echo -e "${GREEN}Switched to model: ${BOLD}$current_model${NC}"
                                
                                # Log model switch
                                echo "[$(date +"%Y-%m-%d %H:%M:%S")] Downloaded and switched to model: $current_model" >> "$SESSION_LOG"
                                session_content+="System: Downloaded and switched to model: $current_model\n\n"
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
                            
                            # Log save operation
                            echo "[$(date +"%Y-%m-%d %H:%M:%S")] Saved response to: $filename" >> "$SESSION_LOG"
                            session_content+="System: Saved response to: $filename\n\n"
                        fi
                    fi
                    ;;
                stream)
                    streaming=!$streaming
                    if $streaming; then
                        echo -e "${GREEN}Streaming mode enabled.${NC}"
                        
                        # Log streaming mode change
                        echo "[$(date +"%Y-%m-%d %H:%M:%S")] Streaming mode enabled" >> "$SESSION_LOG"
                        session_content+="System: Streaming mode enabled\n\n"
                    else
                        echo -e "${YELLOW}Streaming mode disabled.${NC}"
                        
                        # Log streaming mode change
                        echo "[$(date +"%Y-%m-%d %H:%M:%S")] Streaming mode disabled" >> "$SESSION_LOG"
                        session_content+="System: Streaming mode disabled\n\n"
                    fi
                    ;;
                logs)
                    if [ -f "$SESSION_LOG" ]; then
                        echo -e "${BLUE}Recent Session Logs:${NC}"
                        tail -n 50 "$SESSION_LOG"
                    else
                        echo -e "${YELLOW}No session logs found.${NC}"
                    fi
                    ;;
                docs)
                    echo -e "${BLUE}Opening agent capabilities documentation dashboard...${NC}"
                    
                    # Run the documentation viewer script
                    if [ -f "${SCRIPT_DIR}/pulser_docs.sh" ]; then
                        "${SCRIPT_DIR}/pulser_docs.sh"
                    else
                        echo -e "${YELLOW}Documentation viewer script not found.${NC}"
                    fi
                    ;;
                task*)
                    task_name="${cmd#task}"
                    task_name="${task_name## }"
                    
                    if [ -z "$task_name" ]; then
                        echo -e "${YELLOW}Please specify a task name.${NC}"
                    else
                        task_id="task_$(date +"%Y%m%d%H%M%S")"
                        echo -e "${GREEN}Starting task: ${BOLD}$task_name${NC}"
                        echo -e "${BLUE}Task ID: ${task_id}${NC}"
                        
                        # Log task start
                        echo "[$(date +"%Y-%m-%d %H:%M:%S")] Started task: $task_name (ID: $task_id)" >> "$SESSION_LOG"
                        session_content+="System: Started task: $task_name (ID: $task_id)\n\n"
                        
                        # Create task metadata
                        mkdir -p "${SKR_DIR}/tasks"
                        cat > "${SKR_DIR}/tasks/${task_id}.yaml" << EOF
task_id: "${task_id}"
name: "${task_name}"
started_at: "$(date +"%Y-%m-%d %H:%M:%S")"
status: "in_progress"
model: "${current_model}"
session_id: "${session_id}"
EOF
                        
                        # Add task marker to session content
                        input="Define a new multi-phase system routine called \"${task_name}\"."
                        
                        # Add to history
                        echo "$input" >> "$HISTORY_FILE"
                        
                        # Add to session content
                        session_content+="User: $input\n\n"
                        
                        # Process as regular query
                        echo -e "${BLUE}⟩ Asking ${BOLD}$current_model${NC}${BLUE}...${NC}"
                        
                        # Get timestamp for logging
                        local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
                        
                        # Log query
                        echo "[$timestamp] Query: $input" >> "$SESSION_LOG"
                        
                        if $streaming; then
                            # Create a temporary file for capturing output
                            temp_file=$(mktemp)
                            
                            # Run the query with streaming, capturing output to both console and file
                            python3 "$PULSER_SCRIPT" --stream --model "$current_model" "$input" | tee "$temp_file"
                            
                            # Read the response from the temp file
                            last_response=$(cat "$temp_file")
                            rm "$temp_file"
                            
                            # Add to session content
                            session_content+="$current_model: $last_response\n\n"
                            
                            # Log response (abbreviated)
                            truncated_response=$(echo "$last_response" | head -c 100)
                            echo "[$timestamp] Response: $truncated_response..." >> "$SESSION_LOG"
                        else
                            # Run without streaming
                            local params=("--model" "$current_model")
                            response=$(python3 "$PULSER_SCRIPT" "${params[@]}" "$input")
                            exit_code=$?
                            
                            if [ $exit_code -ne 0 ]; then
                                echo -e "${RED}Error: Failed to get response from LLM.${NC}"
                                
                                # Log failure
                                echo "[$timestamp] Error: Failed to get response" >> "$SESSION_LOG"
                                session_content+="System: Error - Failed to get response\n\n"
                            else
                                # Store the response
                                last_response="$response"
                                
                                # Add to session content
                                session_content+="$current_model: $last_response\n\n"
                                
                                # Log response (abbreviated)
                                truncated_response=$(echo "$last_response" | head -c 100)
                                echo "[$timestamp] Response: $truncated_response..." >> "$SESSION_LOG"
                                
                                # Print the response
                                echo
                                echo -e "${GREEN}Response:${NC}"
                                echo "$response"
                                echo
                            fi
                        fi
                    fi
                    ;;
                skr)
                    # Save current session to SKR
                    echo -e "${YELLOW}Enter a title for this session:${NC}"
                    read -r session_title
                    if [ -z "$session_title" ]; then
                        session_title="Pulser Session $session_id"
                    fi
                    
                    if save_to_skr "$session_title" "$session_content" "$current_model"; then
                        echo -e "${GREEN}Session saved to SKR${NC}"
                        
                        # Log SKR save
                        echo "[$(date +"%Y-%m-%d %H:%M:%S")] Session saved to SKR: $session_title" >> "$SESSION_LOG"
                        session_content+="System: Session saved to SKR: $session_title\n\n"
                    else
                        echo -e "${RED}Failed to save session to SKR${NC}"
                    fi
                    ;;
                search*)
                    search_term="${cmd#search}"
                    search_term="${search_term## }"
                    
                    if [ -z "$search_term" ]; then
                        echo -e "${YELLOW}Please provide a search term.${NC}"
                    else
                        search_skr_sessions "$search_term"
                    fi
                    ;;
                resume)
                    if resume_last_session; then
                        echo -e "${GREEN}Ready to continue previous conversation.${NC}"
                    else
                        echo -e "${YELLOW}Continuing with a new session.${NC}"
                    fi
                    ;;
                !*)
                    shell_cmd="${cmd#!}"
                    echo -e "${YELLOW}Executing: ${shell_cmd}${NC}"
                    
                    # Log shell command
                    echo "[$(date +"%Y-%m-%d %H:%M:%S")] Executing shell command: $shell_cmd" >> "$SESSION_LOG"
                    session_content+="System: Executing shell command: $shell_cmd\n\n"
                    
                    eval "$shell_cmd"
                    ;;
                *)
                    echo -e "${YELLOW}Unknown command: ${input}${NC}"
                    ;;
            esac
        else
            # Regular query to LLM
            echo -e "${BLUE}⟩ Asking ${BOLD}$current_model${NC}${BLUE}...${NC}"
            
            # Get timestamp for logging
            local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
            
            # Log query
            echo "[$timestamp] Query: $input" >> "$SESSION_LOG"
            
            if $streaming; then
                # Create a temporary file for capturing output
                temp_file=$(mktemp)
                
                # Run the query with streaming, capturing output to both console and file
                python3 "$PULSER_SCRIPT" --stream --model "$current_model" "$input" | tee "$temp_file"
                
                # Read the response from the temp file
                last_response=$(cat "$temp_file")
                rm "$temp_file"
                
                # Add to session content
                session_content+="$current_model: $last_response\n\n"
                
                # Log response (abbreviated)
                truncated_response=$(echo "$last_response" | head -c 100)
                echo "[$timestamp] Response: $truncated_response..." >> "$SESSION_LOG"
            else
                # Run without streaming
                local params=("--model" "$current_model")
                response=$(python3 "$PULSER_SCRIPT" "${params[@]}" "$input")
                exit_code=$?
                
                if [ $exit_code -ne 0 ]; then
                    echo -e "${RED}Error: Failed to get response from LLM.${NC}"
                    
                    # Log failure
                    echo "[$timestamp] Error: Failed to get response" >> "$SESSION_LOG"
                    session_content+="System: Error - Failed to get response\n\n"
                else
                    # Store the response
                    last_response="$response"
                    
                    # Add to session content
                    session_content+="$current_model: $last_response\n\n"
                    
                    # Log response (abbreviated)
                    truncated_response=$(echo "$last_response" | head -c 100)
                    echo "[$timestamp] Response: $truncated_response..." >> "$SESSION_LOG"
                    
                    # Print the response
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