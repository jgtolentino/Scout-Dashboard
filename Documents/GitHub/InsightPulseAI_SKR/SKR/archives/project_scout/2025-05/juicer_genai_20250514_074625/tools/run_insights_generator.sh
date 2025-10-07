#!/bin/bash
# run_insights_generator.sh - Simplified CLI for Juicer Insights Generator
# Usage: ./run_insights_generator.sh [options]

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Juicer GenAI Insights Generator                           ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${PROJECT_ROOT}/output/insights"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${RESET}"
    echo -e "${YELLOW}Please install Node.js to use this tool:${RESET}"
    echo -e "   https://nodejs.org/en/download/"
    exit 1
fi

# Parse command-line arguments
DAYS=7
MODEL="claude"
TYPE="all"
BRAND=""
VISUALIZE=false
CONFIDENCE=0.7
INTERACTIVE=false

# Parse options
while [[ $# -gt 0 ]]; do
    case "$1" in
        --days)
            DAYS="$2"
            shift 2
            ;;
        --model)
            MODEL="$2"
            shift 2
            ;;
        --type)
            TYPE="$2"
            shift 2
            ;;
        --brand)
            BRAND="$2"
            shift 2
            ;;
        --visualize)
            VISUALIZE=true
            shift
            ;;
        --confidence)
            CONFIDENCE="$2"
            shift 2
            ;;
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        --help)
            echo -e "${BLUE}Juicer GenAI Insights Generator${RESET}"
            echo -e "This script helps you generate AI-powered insights from Juicer's data."
            echo
            echo -e "${YELLOW}Usage:${RESET} ./run_insights_generator.sh [options]"
            echo
            echo -e "${YELLOW}Options:${RESET}"
            echo "  --days N          Number of days to analyze (default: 7)"
            echo "  --model NAME      LLM model to use: claude, openai, deepseek, auto (default: claude)"
            echo "  --type TYPE       Insight type: general, brand, sentiment, trend, all (default: all)"
            echo "  --brand NAME      Filter by brand name"
            echo "  --visualize       Generate visualization dashboard"
            echo "  --confidence N    Minimum confidence threshold (0-1, default: 0.7)"
            echo "  -i, --interactive Run in interactive mode with prompts"
            echo "  --help            Show this help message"
            echo
            echo -e "${YELLOW}Examples:${RESET}"
            echo "  ./run_insights_generator.sh --days 30 --model claude --visualize"
            echo "  ./run_insights_generator.sh --type brand --brand \"Jollibee\" --confidence 0.8"
            echo "  ./run_insights_generator.sh -i"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${RESET}"
            echo "Run './run_insights_generator.sh --help' for usage information"
            exit 1
            ;;
    esac
done

# Interactive mode
if [ "$INTERACTIVE" = true ]; then
    echo -e "${GREEN}Running in interactive mode${RESET}"
    echo

    # Prompt for days
    echo -ne "${BLUE}Enter number of days to analyze [7]: ${RESET}"
    read user_days
    if [ -n "$user_days" ]; then
        DAYS=$user_days
    fi

    # Prompt for model
    echo -e "${BLUE}Select LLM model:${RESET}"
    echo "  1) Claude (default)"
    echo "  2) OpenAI"
    echo "  3) DeepSeek"
    echo "  4) Auto (fallback chain)"
    echo -ne "${BLUE}Enter choice [1]: ${RESET}"
    read model_choice
    case "$model_choice" in
        2) MODEL="openai" ;;
        3) MODEL="deepseek" ;;
        4) MODEL="auto" ;;
        *) MODEL="claude" ;;
    esac

    # Prompt for insight type
    echo -e "${BLUE}Select insight type:${RESET}"
    echo "  1) All types (default)"
    echo "  2) General insights"
    echo "  3) Brand insights"
    echo "  4) Sentiment insights"
    echo "  5) Trend insights"
    echo -ne "${BLUE}Enter choice [1]: ${RESET}"
    read type_choice
    case "$type_choice" in
        2) TYPE="general" ;;
        3) TYPE="brand" ;;
        4) TYPE="sentiment" ;;
        5) TYPE="trend" ;;
        *) TYPE="all" ;;
    esac

    # Prompt for brand filter
    echo -ne "${BLUE}Enter brand name to filter (leave empty for all): ${RESET}"
    read BRAND

    # Prompt for confidence threshold
    echo -ne "${BLUE}Enter confidence threshold (0.0-1.0) [0.7]: ${RESET}"
    read user_confidence
    if [ -n "$user_confidence" ]; then
        CONFIDENCE=$user_confidence
    fi

    # Prompt for visualization
    echo -ne "${BLUE}Generate visualization dashboard? (y/n) [n]: ${RESET}"
    read visualize_choice
    if [[ "$visualize_choice" =~ ^[Yy] ]]; then
        VISUALIZE=true
    fi

    echo
    echo -e "${GREEN}Summary of choices:${RESET}"
    echo -e "  Days to analyze: ${YELLOW}$DAYS${RESET}"
    echo -e "  LLM model: ${YELLOW}$MODEL${RESET}"
    echo -e "  Insight type: ${YELLOW}$TYPE${RESET}"
    echo -e "  Brand filter: ${YELLOW}${BRAND:-"All brands"}${RESET}"
    echo -e "  Confidence threshold: ${YELLOW}$CONFIDENCE${RESET}"
    echo -e "  Generate visualization: ${YELLOW}$([ "$VISUALIZE" = true ] && echo "Yes" || echo "No")${RESET}"
    echo

    echo -ne "${BLUE}Proceed with these settings? (y/n) [y]: ${RESET}"
    read proceed
    if [[ "$proceed" =~ ^[Nn] ]]; then
        echo -e "${RED}Operation canceled by user${RESET}"
        exit 0
    fi
fi

# Build arguments for Node script
NODE_ARGS=("--days" "$DAYS" "--model" "$MODEL" "--type" "$TYPE" "--confidence" "$CONFIDENCE" "--output" "$OUTPUT_DIR")

if [ -n "$BRAND" ]; then
    NODE_ARGS+=("--brand" "$BRAND")
fi

if [ "$VISUALIZE" = true ]; then
    NODE_ARGS+=("--visualize")
fi

# Run the insights generator
echo -e "${GREEN}Running Juicer Insights Generator...${RESET}"
echo -e "${BLUE}Configuration:${RESET}"
echo -e "  Days to analyze: ${DAYS}"
echo -e "  LLM model: ${MODEL}"
echo -e "  Insight type: ${TYPE}"
echo -e "  Brand filter: ${BRAND:-"All brands"}"
echo -e "  Confidence threshold: ${CONFIDENCE}"
echo -e "  Generate visualization: $([ "$VISUALIZE" = true ] && echo "Yes" || echo "No")"
echo -e "  Output directory: ${OUTPUT_DIR}"
echo

# First, make sure the script is executable
chmod +x "${SCRIPT_DIR}/insights_generator.js"

# Execute Node script with arguments
node "${SCRIPT_DIR}/insights_generator.js" "${NODE_ARGS[@]}"

# Check exit status
if [ $? -ne 0 ]; then
    echo -e "${RED}Error running insights generator${RESET}"
    exit 1
fi

echo -e "${GREEN}Insights generator completed${RESET}"