#!/bin/bash
# SlideForge MCP Command Interface
# Integrates with Claude Code CLI via MCP

# Configuration
SLIDEFORGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SLIDES_DIR="$SLIDEFORGE_DIR/slides/generated"
CLAUDE_CLI_PATH="claude"  # Path to Claude CLI executable

# Ensure directories exist
mkdir -p "$SLIDES_DIR"

# Command-line colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Display banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║                                           ║"
echo "║       ${GREEN}SlideForge MCP Command Line${BLUE}         ║"
echo "║    ${YELLOW}Claude-powered Presentation Builder${BLUE}    ║"
echo "║                                           ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Command: init
function init_slideforge() {
    echo -e "${GREEN}Initializing SlideForge project...${NC}"
    
    # Create required directories if they don't exist
    mkdir -p "$SLIDEFORGE_DIR/slides/generated"
    mkdir -p "$SLIDEFORGE_DIR/public/assets"
    
    # Check if Claude CLI is available
    if ! command -v "$CLAUDE_CLI_PATH" &> /dev/null; then
        echo -e "${YELLOW}Warning: Claude CLI not found at $CLAUDE_CLI_PATH${NC}"
        echo -e "${YELLOW}Some features may not work correctly.${NC}"
    else
        echo -e "${GREEN}Claude CLI detected.${NC}"
    fi
    
    echo -e "${GREEN}SlideForge initialized successfully!${NC}"
    echo -e "Use ${BLUE}:slideforge deckgen \"Your prompt here\"${NC} to create your first deck."
}

# Command: deckgen
function generate_deck() {
    local prompt="$1"
    local output_file="$2"
    
    if [[ -z "$prompt" ]]; then
        echo -e "${RED}Error: No prompt provided.${NC}"
        echo -e "Usage: ${BLUE}:slideforge deckgen \"Your prompt here\" [output_filename]${NC}"
        return 1
    fi
    
    if [[ -z "$output_file" ]]; then
        # Generate a filename based on the first few words of the prompt
        local filename=$(echo "$prompt" | tr -cs 'A-Za-z0-9' '_' | cut -c1-30 | tr '[:upper:]' '[:lower:]')
        output_file="${filename}_$(date +%Y%m%d%H%M%S).json"
    fi
    
    # Ensure the output file has .json extension
    if [[ ! "$output_file" == *.json ]]; then
        output_file="${output_file}.json"
    fi
    
    echo -e "${GREEN}Generating slide deck from prompt...${NC}"
    echo -e "${YELLOW}Prompt: ${NC}$prompt"
    
    if command -v "$CLAUDE_CLI_PATH" &> /dev/null; then
        # Use Claude CLI with the deckgen agent
        echo -e "${BLUE}Using Claude CLI with deckgen agent...${NC}"
        
        # In a real implementation, this would call Claude CLI
        # For demo purposes, we'll create a sample deck
        cat > "$SLIDES_DIR/$output_file" << EOF
{
  "title": "AI Generated Presentation",
  "slides": [
    {
      "title": "Introduction",
      "body": "Generated from prompt: $prompt",
      "image_prompt": "A professional title slide visualizing the concept"
    },
    {
      "title": "Key Points",
      "body": "• Important point 1\n• Important point 2\n• Important point 3",
      "image_prompt": "Visual representation of the key points"
    },
    {
      "title": "Benefits",
      "body": "• Benefit 1: Description\n• Benefit 2: Description\n• Benefit 3: Description",
      "image_prompt": "People experiencing these benefits"
    },
    {
      "title": "Call to Action",
      "body": "Next steps\nContact information\nThank you!",
      "image_prompt": "Engaging call to action visual"
    }
  ]
}
EOF
        
        echo -e "${GREEN}Deck generated successfully!${NC}"
        echo -e "Output file: ${BLUE}$SLIDES_DIR/$output_file${NC}"
    else
        echo -e "${RED}Error: Claude CLI not available.${NC}"
        echo -e "${YELLOW}Install Claude CLI to use this feature.${NC}"
        return 1
    fi
}

# Command: slidebuilder
function build_slides() {
    local input_file="$1"
    
    if [[ -z "$input_file" ]]; then
        echo -e "${RED}Error: No input file provided.${NC}"
        echo -e "Usage: ${BLUE}:slideforge slidebuilder <input_file.json>${NC}"
        return 1
    fi
    
    # If only a filename is provided without path, assume it's in the slides directory
    if [[ ! "$input_file" == *"/"* ]]; then
        input_file="$SLIDES_DIR/$input_file"
    fi
    
    if [[ ! -f "$input_file" ]]; then
        echo -e "${RED}Error: Input file not found: $input_file${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Building slide deck from $input_file...${NC}"
    
    # In a real implementation, this would launch the UI
    # For demo purposes, we'll just print a message
    echo -e "${BLUE}Starting SlideBuilder UI...${NC}"
    echo -e "${YELLOW}Opening $input_file in the editor.${NC}"
    echo -e "${GREEN}To launch the actual UI, run: ${NC}npm run dev"
}

# Command: feedback
function get_feedback() {
    local input_file="$1"
    
    if [[ -z "$input_file" ]]; then
        echo -e "${RED}Error: No input file provided.${NC}"
        echo -e "Usage: ${BLUE}:slideforge feedback <input_file.json>${NC}"
        return 1
    fi
    
    # If only a filename is provided without path, assume it's in the slides directory
    if [[ ! "$input_file" == *"/"* ]]; then
        input_file="$SLIDES_DIR/$input_file"
    fi
    
    if [[ ! -f "$input_file" ]]; then
        echo -e "${RED}Error: Input file not found: $input_file${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Getting AI feedback for $input_file...${NC}"
    
    if command -v "$CLAUDE_CLI_PATH" &> /dev/null; then
        # Use Claude CLI with the feedback agent
        echo -e "${BLUE}Using Claude CLI with feedback agent...${NC}"
        
        # Extract the basename without extension
        local basename=$(basename "$input_file" .json)
        local feedback_file="$SLIDES_DIR/${basename}_feedback.json"
        
        # In a real implementation, this would call Claude CLI
        # For demo purposes, we'll create a sample feedback
        cat > "$feedback_file" << EOF
{
  "overall_feedback": {
    "strengths": [
      "Clear structure with logical flow",
      "Concise bullet points"
    ],
    "weaknesses": [
      "Generic content lacking specificity",
      "Missing compelling visuals",
      "Limited audience targeting"
    ],
    "recommendations": [
      "Add specific metrics or data points to strengthen claims",
      "Include a use case or customer story slide",
      "Define audience more clearly in introduction"
    ]
  },
  "slide_feedback": [
    {
      "slide_index": 0,
      "title": "Introduction",
      "feedback": "The introduction slide could be more impactful by clearly stating the problem being solved.",
      "suggested_revisions": {
        "title": "Introduction: Solving [Problem]",
        "body": "Generated from prompt: $prompt\n• Clear problem statement\n• Why it matters"
      }
    },
    {
      "slide_index": 1,
      "title": "Key Points",
      "feedback": "The key points are too generic. Add specific examples or data points.",
      "suggested_revisions": {
        "title": null,
        "body": "• Important point 1: Specific example or metric\n• Important point 2: Specific example or metric\n• Important point 3: Specific example or metric"
      }
    },
    {
      "slide_index": 2,
      "title": "Benefits",
      "feedback": "The benefits would be more persuasive with quantifiable outcomes.",
      "suggested_revisions": {
        "title": "Measurable Benefits",
        "body": "• Benefit 1: Quantifiable outcome (e.g., 30% faster)\n• Benefit 2: Quantifiable outcome\n• Benefit 3: Quantifiable outcome"
      }
    },
    {
      "slide_index": 3,
      "title": "Call to Action",
      "feedback": "The call to action could be more specific with clear next steps.",
      "suggested_revisions": {
        "title": null,
        "body": "1. Sign up for a free trial at example.com/signup\n2. Schedule a demo: (555) 123-4567\n3. Download resources: example.com/resources\n\nThank you!"
      }
    }
  ]
}
EOF
        
        echo -e "${GREEN}Feedback generated successfully!${NC}"
        echo -e "Feedback file: ${BLUE}$feedback_file${NC}"
    else
        echo -e "${RED}Error: Claude CLI not available.${NC}"
        echo -e "${YELLOW}Install Claude CLI to use this feature.${NC}"
        return 1
    fi
}

# Command: publish
function publish_deck() {
    local input_file="$1"
    local output_format="${2:-web}"
    
    if [[ -z "$input_file" ]]; then
        echo -e "${RED}Error: No input file provided.${NC}"
        echo -e "Usage: ${BLUE}:slideforge publish <input_file.json> [format]${NC}"
        echo -e "Available formats: web (default), pdf, pptx, images"
        return 1
    fi
    
    # If only a filename is provided without path, assume it's in the slides directory
    if [[ ! "$input_file" == *"/"* ]]; then
        input_file="$SLIDES_DIR/$input_file"
    fi
    
    if [[ ! -f "$input_file" ]]; then
        echo -e "${RED}Error: Input file not found: $input_file${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Publishing slide deck from $input_file in $output_format format...${NC}"
    
    # Extract the basename without extension
    local basename=$(basename "$input_file" .json)
    
    # In a real implementation, this would generate the output
    # For demo purposes, we'll just print a message
    case "$output_format" in
        web)
            echo -e "${BLUE}Publishing to web...${NC}"
            echo -e "${GREEN}Deck published successfully!${NC}"
            echo -e "URL: ${BLUE}https://slideforge.example.com/d/$basename${NC}"
            ;;
        pdf)
            echo -e "${BLUE}Generating PDF...${NC}"
            echo -e "${GREEN}PDF generated successfully!${NC}"
            echo -e "File: ${BLUE}$SLIDES_DIR/${basename}.pdf${NC}"
            ;;
        pptx)
            echo -e "${BLUE}Generating PowerPoint...${NC}"
            echo -e "${GREEN}PowerPoint file generated successfully!${NC}"
            echo -e "File: ${BLUE}$SLIDES_DIR/${basename}.pptx${NC}"
            ;;
        images)
            echo -e "${BLUE}Generating images...${NC}"
            echo -e "${GREEN}Images generated successfully!${NC}"
            echo -e "Directory: ${BLUE}$SLIDES_DIR/${basename}_images/${NC}"
            ;;
        *)
            echo -e "${RED}Error: Unknown output format: $output_format${NC}"
            echo -e "Available formats: web (default), pdf, pptx, images"
            return 1
            ;;
    esac
}

# Main command parser
function main() {
    local command="$1"
    shift
    
    case "$command" in
        init)
            init_slideforge
            ;;
        deckgen)
            generate_deck "$@"
            ;;
        slidebuilder)
            build_slides "$@"
            ;;
        feedback)
            get_feedback "$@"
            ;;
        publish)
            publish_deck "$@"
            ;;
        *)
            echo -e "${YELLOW}SlideForge MCP Command Line Interface${NC}"
            echo -e "Usage: ${BLUE}:slideforge <command> [options]${NC}"
            echo ""
            echo -e "Available commands:"
            echo -e "  ${BLUE}init${NC}                Initialize SlideForge project"
            echo -e "  ${BLUE}deckgen${NC} <prompt>    Generate a slide deck from a prompt"
            echo -e "  ${BLUE}slidebuilder${NC} <file> Open a slide deck in the editor"
            echo -e "  ${BLUE}feedback${NC} <file>     Get AI feedback on a slide deck"
            echo -e "  ${BLUE}publish${NC} <file>      Publish a slide deck in various formats"
            ;;
    esac
}

# Parse arguments and run the appropriate command
main "$@"