#!/bin/bash
# build_promptbook.sh - Create an HTML viewer for browsing MCP prompts locally
# 
# This script generates a standalone HTML file that displays all MCP prompts
# in a user-friendly interface.

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
MCP_PROMPTS_DIR="$SCRIPT_DIR/mcp_prompts"
OUTPUT_FILE="$SCRIPT_DIR/PromptBook.html"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
KALAW_INDEX_PATH="$SCRIPT_DIR/kalaw_mcp_prompts.yaml"

echo -e "${BOLD}Building PromptBook HTML Viewer${NC}"
echo -e "MCP Prompts Directory: ${BLUE}$MCP_PROMPTS_DIR${NC}"
echo -e "Output File: ${BLUE}$OUTPUT_FILE${NC}"
echo

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Function to find all MCP prompt files
find_prompt_files() {
  echo -e "${BOLD}Step 1: Finding MCP prompt files${NC}"
  
  if [ ! -d "$MCP_PROMPTS_DIR" ]; then
    echo -e "${RED}Error: MCP prompts directory not found at $MCP_PROMPTS_DIR${NC}"
    return 1
  fi
  
  local prompt_files=()
  
  # Find all .mcp.yaml files
  while IFS= read -r -d '' file; do
    prompt_files+=("$file")
  done < <(find "$MCP_PROMPTS_DIR" -name "*.mcp.yaml" -type f -print0)
  
  local file_count=${#prompt_files[@]}
  
  if [ $file_count -eq 0 ]; then
    echo -e "${RED}Error: No MCP prompt files found${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓${NC} Found $file_count MCP prompt files"
  
  # Create a temporary file with the list of prompt files
  printf "%s\n" "${prompt_files[@]}" > "$SCRIPT_DIR/logs/prompt_files.txt"
  
  return 0
}

# Function to extract metadata from YAML files
extract_prompt_metadata() {
  echo -e "${BOLD}Step 2: Extracting prompt metadata${NC}"
  
  local temp_dir="$SCRIPT_DIR/logs/promptbook_temp"
  mkdir -p "$temp_dir"
  
  # Check if Python is available for YAML parsing
  if command_exists python3; then
    # Create a Python script for YAML extraction
    cat > "$temp_dir/extract_yaml.py" << 'EOF'
#!/usr/bin/env python3
import yaml
import sys
import os
import json
from pathlib import Path

def extract_yaml_data(file_path):
    """Extract data from a YAML file."""
    try:
        with open(file_path, 'r') as f:
            data = yaml.safe_load(f)
        
        # Get relative path for display
        script_dir = Path(os.environ.get('SCRIPT_DIR', '.')).resolve()
        rel_path = Path(file_path).resolve().relative_to(script_dir)
        
        # Extract relevant fields
        result = {
            'file_path': str(rel_path),
            'name': data.get('metadata', {}).get('name', os.path.basename(file_path)),
            'description': data.get('metadata', {}).get('description', 'No description'),
            'version': data.get('metadata', {}).get('version', '1.0.0'),
            'aliases': data.get('metadata', {}).get('aliases', []),
            'capabilities': data.get('metadata', {}).get('capabilities', []),
            'use_cases': data.get('metadata', {}).get('use_cases', []),
            'model': data.get('metadata', {}).get('model', 'Unknown'),
            'author': data.get('metadata', {}).get('author', 'Unknown'),
            'access_level': data.get('access_level', 'internal'),
            'system_prompt': data.get('system_prompt', 'No system prompt defined'),
            'requires': data.get('requires', [])
        }
        
        return result
    except Exception as e:
        return {
            'file_path': file_path,
            'name': os.path.basename(file_path),
            'description': f'Error parsing YAML: {str(e)}',
            'error': True
        }

def main():
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # Read list of files
    with open(input_file, 'r') as f:
        files = [line.strip() for line in f if line.strip()]
    
    # Process each file
    results = []
    for file_path in files:
        data = extract_yaml_data(file_path)
        results.append(data)
    
    # Sort by name
    results.sort(key=lambda x: x.get('name', '').lower())
    
    # Write to output file
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()
EOF
    
    # Make the script executable
    chmod +x "$temp_dir/extract_yaml.py"
    
    # Run the Python script
    SCRIPT_DIR="$SCRIPT_DIR" python3 "$temp_dir/extract_yaml.py" "$SCRIPT_DIR/logs/prompt_files.txt" "$temp_dir/prompt_data.json"
    
    if [ $? -eq 0 ] && [ -s "$temp_dir/prompt_data.json" ]; then
      echo -e "${GREEN}✓${NC} Extracted metadata from YAML files"
      return 0
    else
      echo -e "${RED}Error: Failed to extract metadata from YAML files${NC}"
      return 1
    fi
  else
    echo -e "${RED}Error: Python 3 is required but not found${NC}"
    return 1
  fi
}

# Function to generate HTML viewer
generate_html() {
  echo -e "${BOLD}Step 3: Generating HTML viewer${NC}"
  
  local temp_dir="$SCRIPT_DIR/logs/promptbook_temp"
  local prompt_data="$temp_dir/prompt_data.json"
  
  if [ ! -f "$prompt_data" ]; then
    echo -e "${RED}Error: Prompt data not found at $prompt_data${NC}"
    return 1
  fi
  
  # Create the HTML file
  cat > "$OUTPUT_FILE" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PulseDev MCP PromptBook</title>
  <style>
    :root {
      --primary-color: #3498db;
      --primary-dark: #2980b9;
      --secondary-color: #2ecc71;
      --secondary-dark: #27ae60;
      --accent-color: #e74c3c;
      --light-gray: #f5f5f5;
      --medium-gray: #e0e0e0;
      --dark-gray: #333;
      --sidebar-width: 280px;
      --header-height: 60px;
      --card-shadow: 0 2px 5px rgba(0,0,0,0.1);
      --transition-speed: 0.3s;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9f9f9;
      overflow-x: hidden;
    }
    
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--primary-color);
      color: white;
      padding: 0 20px;
      height: var(--header-height);
      position: fixed;
      width: 100%;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    header h1 {
      font-size: 20px;
      display: flex;
      align-items: center;
    }
    
    header h1 .logo {
      margin-right: 10px;
      font-size: 24px;
    }
    
    .search-box {
      position: relative;
      margin-right: 20px;
    }
    
    .search-box input {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      width: 240px;
      font-size: 14px;
    }
    
    .search-box i {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #888;
    }
    
    .container {
      display: flex;
      margin-top: var(--header-height);
      min-height: calc(100vh - var(--header-height));
    }
    
    .sidebar {
      width: var(--sidebar-width);
      background: white;
      border-right: 1px solid var(--medium-gray);
      overflow-y: auto;
      height: calc(100vh - var(--header-height));
      position: fixed;
      padding-bottom: 20px;
    }
    
    .sidebar-header {
      padding: 15px;
      background-color: var(--light-gray);
      border-bottom: 1px solid var(--medium-gray);
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .sidebar-header .count {
      background-color: var(--primary-color);
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .category {
      padding: 10px 15px;
      border-bottom: 1px solid var(--medium-gray);
      font-weight: bold;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color var(--transition-speed);
    }
    
    .category:hover {
      background-color: var(--light-gray);
    }
    
    .category.active {
      background-color: var(--light-gray);
    }
    
    .category span {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .category .count {
      background-color: var(--medium-gray);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .prompt-list {
      list-style: none;
    }
    
    .prompt-item {
      padding: 10px 15px 10px 25px;
      border-bottom: 1px solid var(--medium-gray);
      cursor: pointer;
      transition: background-color var(--transition-speed);
    }
    
    .prompt-item:hover {
      background-color: var(--light-gray);
    }
    
    .prompt-item.active {
      background-color: #e3f2fd;
      border-left: 4px solid var(--primary-color);
    }
    
    .prompt-item .title {
      font-weight: bold;
      display: block;
      margin-bottom: 3px;
      max-width: 230px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .prompt-item .description {
      font-size: 12px;
      color: #666;
      display: block;
      max-width: 230px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .content {
      flex: 1;
      padding: 20px;
      margin-left: var(--sidebar-width);
    }
    
    .prompt-detail {
      background: white;
      border-radius: 6px;
      box-shadow: var(--card-shadow);
      margin-bottom: 20px;
      overflow: hidden;
    }
    
    .prompt-detail-header {
      background-color: var(--light-gray);
      padding: 15px 20px;
      border-bottom: 1px solid var(--medium-gray);
    }
    
    .prompt-detail-header h2 {
      margin-bottom: 5px;
      display: flex;
      align-items: center;
    }
    
    .prompt-detail-header h2 .access-badge {
      margin-left: 10px;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: normal;
      text-transform: uppercase;
    }
    
    .access-badge.public {
      background-color: var(--secondary-color);
      color: white;
    }
    
    .access-badge.beta {
      background-color: #f39c12;
      color: white;
    }
    
    .access-badge.internal {
      background-color: #95a5a6;
      color: white;
    }
    
    .prompt-detail-header .description {
      color: #666;
      font-size: 14px;
    }
    
    .prompt-detail-content {
      padding: 20px;
    }
    
    .meta-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .meta-card {
      background-color: var(--light-gray);
      border-radius: 6px;
      padding: 15px;
    }
    
    .meta-card h3 {
      font-size: 16px;
      margin-bottom: 10px;
      color: var(--dark-gray);
      display: flex;
      align-items: center;
    }
    
    .meta-card h3 i {
      margin-right: 8px;
      color: var(--primary-color);
    }
    
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    
    .tag {
      background-color: var(--medium-gray);
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
    }
    
    .system-prompt {
      background-color: #f8f9fa;
      border: 1px solid var(--medium-gray);
      border-radius: 6px;
      padding: 15px;
      white-space: pre-wrap;
      overflow-x: auto;
      font-family: 'Fira Code', monospace;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      margin-top: 20px;
    }
    
    .copy-btn {
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 15px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      transition: background-color var(--transition-speed);
      margin-top: 10px;
    }
    
    .copy-btn:hover {
      background-color: var(--primary-dark);
    }
    
    .copy-btn i {
      margin-right: 5px;
    }
    
    .no-prompts {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .no-prompts i {
      font-size: 48px;
      margin-bottom: 10px;
      color: var(--medium-gray);
    }
    
    .filter-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .filter-btn {
      background-color: var(--light-gray);
      border: 1px solid var(--medium-gray);
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 14px;
      cursor: pointer;
      transition: all var(--transition-speed);
      display: flex;
      align-items: center;
    }
    
    .filter-btn i {
      margin-right: 5px;
      font-size: 12px;
    }
    
    .filter-btn:hover {
      background-color: var(--medium-gray);
    }
    
    .filter-btn.active {
      background-color: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }
    
    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        position: static;
        height: auto;
        display: none;
      }
      
      .sidebar.active {
        display: block;
      }
      
      .content {
        margin-left: 0;
      }
      
      .header-toggle {
        display: block;
      }
    }
    
    /* Icons using inline SVG */
    .icon {
      display: inline-block;
      width: 1em;
      height: 1em;
      vertical-align: -0.15em;
      fill: currentColor;
    }
  </style>
</head>
<body>
  <header>
    <h1>
      <span class="logo">📚</span>
      PulseDev MCP PromptBook
    </h1>
    <div class="search-box">
      <input type="text" id="search-input" placeholder="Search prompts...">
      <i>🔍</i>
    </div>
  </header>
  
  <div class="container">
    <aside class="sidebar">
      <div class="sidebar-header">
        Prompt Categories <span class="count" id="total-count">0</span>
      </div>
      <div class="filter-actions">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="public">Public</button>
        <button class="filter-btn" data-filter="beta">Beta</button>
        <button class="filter-btn" data-filter="internal">Internal</button>
      </div>
      <div id="categories-container"></div>
    </aside>
    
    <main class="content">
      <div id="prompt-detail-container">
        <div class="no-prompts">
          <i>📝</i>
          <h3>Select a prompt to view details</h3>
          <p>Choose from the list of prompts on the left to view its details.</p>
        </div>
      </div>
    </main>
  </div>

  <script>
    // Load prompt data
    const promptData = PROMPT_DATA_PLACEHOLDER;
    
    // DOM elements
    const categoriesContainer = document.getElementById('categories-container');
    const promptDetailContainer = document.getElementById('prompt-detail-container');
    const searchInput = document.getElementById('search-input');
    const totalCountElement = document.getElementById('total-count');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // State
    let activePromptId = null;
    let currentFilter = 'all';
    let categories = {};
    let categorizedPrompts = {};
    
    // Initialize the app
    function init() {
      if (!promptData || promptData.length === 0) {
        promptDetailContainer.innerHTML = `
          <div class="no-prompts">
            <i>📝</i>
            <h3>No prompts found</h3>
            <p>The PromptBook couldn't find any MCP prompt data.</p>
          </div>
        `;
        return;
      }
      
      // Update total count
      totalCountElement.textContent = promptData.length;
      
      // Group prompts by category
      promptData.forEach(prompt => {
        const path = prompt.file_path.split('/');
        const category = path.length >= 3 ? path[1] : 'other';
        
        if (!categories[category]) {
          categories[category] = {
            name: category,
            count: 0,
            prompts: []
          };
        }
        
        categories[category].prompts.push(prompt);
        categories[category].count++;
      });
      
      // Sort categories
      categorizedPrompts = Object.values(categories).sort((a, b) => a.name.localeCompare(b.name));
      
      // Render categories and prompts
      renderCategoriesAndPrompts();
      
      // Add event listeners
      searchInput.addEventListener('input', handleSearch);
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          currentFilter = button.getAttribute('data-filter');
          filterButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          renderCategoriesAndPrompts();
        });
      });
    }
    
    // Render categories and prompts
    function renderCategoriesAndPrompts() {
      categoriesContainer.innerHTML = '';
      
      categorizedPrompts.forEach(category => {
        // Filter prompts based on current filter
        const filteredPrompts = currentFilter === 'all' 
          ? category.prompts 
          : category.prompts.filter(p => p.access_level === currentFilter);
        
        if (filteredPrompts.length === 0) return;
        
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category';
        categoryEl.innerHTML = `
          <span>${category.name}</span>
          <span class="count">${filteredPrompts.length}</span>
        `;
        
        const promptListEl = document.createElement('ul');
        promptListEl.className = 'prompt-list';
        
        filteredPrompts.forEach(prompt => {
          const promptItem = document.createElement('li');
          promptItem.className = 'prompt-item';
          promptItem.setAttribute('data-id', prompt.file_path);
          promptItem.innerHTML = `
            <span class="title">${prompt.name}</span>
            <span class="description">${prompt.description}</span>
          `;
          
          promptItem.addEventListener('click', () => {
            document.querySelectorAll('.prompt-item').forEach(item => item.classList.remove('active'));
            promptItem.classList.add('active');
            activePromptId = prompt.file_path;
            renderPromptDetail(prompt);
          });
          
          promptListEl.appendChild(promptItem);
        });
        
        categoriesContainer.appendChild(categoryEl);
        categoriesContainer.appendChild(promptListEl);
      });
    }
    
    // Render prompt detail
    function renderPromptDetail(prompt) {
      // Format model name nicely
      let modelName = prompt.model || 'Unknown Model';
      if (modelName.startsWith('claude')) {
        const parts = modelName.split('-');
        if (parts.length >= 3) {
          modelName = `Claude ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)} (${parts[2]})`;
        }
      }
      
      // Format system prompt for HTML
      const systemPrompt = (prompt.system_prompt || 'No system prompt defined')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      promptDetailContainer.innerHTML = `
        <div class="prompt-detail">
          <div class="prompt-detail-header">
            <h2>
              ${prompt.name}
              <span class="access-badge ${prompt.access_level}">${prompt.access_level}</span>
            </h2>
            <div class="description">${prompt.description}</div>
          </div>
          
          <div class="prompt-detail-content">
            <div class="meta-section">
              <div class="meta-card">
                <h3><span class="icon">📋</span> File Path</h3>
                <div>${prompt.file_path}</div>
              </div>
              
              <div class="meta-card">
                <h3><span class="icon">🤖</span> Model</h3>
                <div>${modelName}</div>
              </div>
              
              <div class="meta-card">
                <h3><span class="icon">👤</span> Author</h3>
                <div>${prompt.author || 'Unknown'}</div>
              </div>
              
              <div class="meta-card">
                <h3><span class="icon">🏷️</span> Version</h3>
                <div>${prompt.version || '1.0.0'}</div>
              </div>
            </div>
            
            <div class="meta-section">
              <div class="meta-card">
                <h3><span class="icon">⚡</span> Capabilities</h3>
                <div class="tag-list">
                  ${(prompt.capabilities || []).map(cap => `<span class="tag">${cap}</span>`).join('') || 'None specified'}
                </div>
              </div>
              
              <div class="meta-card">
                <h3><span class="icon">🎯</span> Use Cases</h3>
                <div class="tag-list">
                  ${(prompt.use_cases || []).map(uc => `<span class="tag">${uc}</span>`).join('') || 'None specified'}
                </div>
              </div>
            </div>
            
            <div class="meta-section">
              <div class="meta-card">
                <h3><span class="icon">🔤</span> Aliases</h3>
                <div class="tag-list">
                  ${(prompt.aliases || []).map(alias => `<span class="tag">${alias}</span>`).join('') || 'No aliases'}
                </div>
              </div>
              
              <div class="meta-card">
                <h3><span class="icon">🔗</span> Dependencies</h3>
                <div class="tag-list">
                  ${(prompt.requires || []).map(req => `<span class="tag">${req}</span>`).join('') || 'No dependencies'}
                </div>
              </div>
            </div>
            
            <h3><span class="icon">📝</span> System Prompt</h3>
            <div class="system-prompt">${systemPrompt}</div>
            
            <button class="copy-btn" onclick="copyToClipboard('${prompt.file_path}')">
              <span class="icon">📋</span> Copy System Prompt
            </button>
          </div>
        </div>
      `;
    }
    
    // Handle search
    function handleSearch() {
      const searchTerm = searchInput.value.toLowerCase();
      
      // Reset if search is empty
      if (!searchTerm) {
        renderCategoriesAndPrompts();
        return;
      }
      
      // Filter prompts by search term
      const flattenedPrompts = promptData.filter(prompt => {
        return (
          prompt.name.toLowerCase().includes(searchTerm) ||
          prompt.description.toLowerCase().includes(searchTerm) ||
          (prompt.aliases || []).some(alias => alias.toLowerCase().includes(searchTerm)) ||
          (prompt.capabilities || []).some(cap => cap.toLowerCase().includes(searchTerm))
        );
      });
      
      // Show search results
      categoriesContainer.innerHTML = '';
      
      const searchResultsCategory = document.createElement('div');
      searchResultsCategory.className = 'category';
      searchResultsCategory.innerHTML = `
        <span>Search Results</span>
        <span class="count">${flattenedPrompts.length}</span>
      `;
      
      const promptListEl = document.createElement('ul');
      promptListEl.className = 'prompt-list';
      
      flattenedPrompts.forEach(prompt => {
        // Filter based on access level
        if (currentFilter !== 'all' && prompt.access_level !== currentFilter) {
          return;
        }
        
        const promptItem = document.createElement('li');
        promptItem.className = 'prompt-item';
        promptItem.setAttribute('data-id', prompt.file_path);
        promptItem.innerHTML = `
          <span class="title">${prompt.name}</span>
          <span class="description">${prompt.description}</span>
        `;
        
        promptItem.addEventListener('click', () => {
          document.querySelectorAll('.prompt-item').forEach(item => item.classList.remove('active'));
          promptItem.classList.add('active');
          activePromptId = prompt.file_path;
          renderPromptDetail(prompt);
        });
        
        promptListEl.appendChild(promptItem);
      });
      
      if (flattenedPrompts.length === 0) {
        promptListEl.innerHTML = `
          <li class="prompt-item">
            <span class="title">No matches found</span>
            <span class="description">Try a different search term</span>
          </li>
        `;
      }
      
      categoriesContainer.appendChild(searchResultsCategory);
      categoriesContainer.appendChild(promptListEl);
    }
    
    // Copy system prompt to clipboard
    function copyToClipboard(promptId) {
      const prompt = promptData.find(p => p.file_path === promptId);
      if (!prompt) return;
      
      const textarea = document.createElement('textarea');
      textarea.value = prompt.system_prompt;
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        alert('System prompt copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
      
      document.body.removeChild(textarea);
    }
    
    // Initialize the app when the page loads
    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>
EOF
  
  # Replace the placeholder with the actual prompt data
  local temp_dir="$SCRIPT_DIR/logs/promptbook_temp"
  local prompt_data="$temp_dir/prompt_data.json"
  local prompt_data_content=$(cat "$prompt_data")
  
  sed -i '' "s|PROMPT_DATA_PLACEHOLDER|$prompt_data_content|g" "$OUTPUT_FILE"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Generated HTML PromptBook at $OUTPUT_FILE"
  else
    echo -e "${RED}Error: Failed to generate HTML PromptBook${NC}"
    return 1
  fi
  
  return 0
}

# Main function
main() {
  # Create logs directory
  mkdir -p "$SCRIPT_DIR/logs"
  
  # Step 1: Find prompt files
  if ! find_prompt_files; then
    echo -e "${RED}Failed to find prompt files${NC}"
    exit 1
  fi
  echo
  
  # Step 2: Extract metadata from YAML files
  if ! extract_prompt_metadata; then
    echo -e "${RED}Failed to extract metadata from YAML files${NC}"
    exit 1
  fi
  echo
  
  # Step 3: Generate HTML viewer
  if ! generate_html; then
    echo -e "${RED}Failed to generate HTML viewer${NC}"
    exit 1
  fi
  echo
  
  # Final status
  echo -e "${BOLD}PromptBook Build Complete!${NC}"
  echo -e "HTML viewer created at: ${BLUE}$OUTPUT_FILE${NC}"
  echo -e "Open it in your browser to explore MCP prompts"
  echo -e "To open in browser: ${YELLOW}open $OUTPUT_FILE${NC}"
}

# Run the main function
main