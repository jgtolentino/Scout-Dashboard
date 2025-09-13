# Claude Desktop Persistence Implementation Analysis

## Storage Locations

### 1. Application Support Directory
`~/Library/Application Support/Claude/`
- **Cache/** - Chromium cache data
- **GPUCache/** - Graphics cache
- **IndexedDB/** - Browser storage
- **Session Storage/** - LevelDB for session data
- **claude_desktop_config.json** - MCP server configurations
- **config.json** - UI preferences (dark mode, scale, locale)
- **window-state.json** - Window position/size

### 2. User Memory Directory
`~/.claude/`
- **memory/** - Persistent memory storage
  - `context.db` - SQLite database for memories
  - `*.md` files - Product/project documentation
- **todos/** - Task management
- **projects/** - Project-specific data
- **statsig/** - Analytics/telemetry
- **settings.local.json** - User settings

## Memory Implementation

### SQLite Schema (context.db)
```sql
CREATE TABLE memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Features:
1. **Tag-based organization** - Memories tagged for retrieval
2. **Session tracking** - Links memories to specific sessions
3. **Automatic timestamps** - Tracks creation and updates
4. **Views for quick access**:
   - `recent_memories` - Last 50 entries
   - `memory_stats` - Aggregated statistics by tag

### Memory File Types:
1. **CLAUDE.md** - Project-level instructions (in project root)
2. **~/.claude/CLAUDE.md** - Global user preferences
3. **Markdown files** - Structured documentation (like prd_scout dashboard.md)

## MCP Persistence

MCP servers are configured in:
- `~/Library/Application Support/Claude/claude_desktop_config.json`

This persists:
- Server configurations
- Environment variables
- Connection settings

## Data Persistence Types

1. **Session Storage** (LevelDB)
   - Temporary session data
   - Cleared on app restart

2. **SQLite Database**
   - Long-term memory storage
   - Survives app restarts
   - Tagged and searchable

3. **Configuration Files** (JSON)
   - UI preferences
   - MCP server configs
   - Window state

4. **Document Storage** (Markdown)
   - Project documentation
   - PRDs and specifications
   - User instructions

## Key Insights

1. **Layered Persistence**: Multiple storage mechanisms for different data types
2. **Tag-Based Retrieval**: Memories organized by tags for semantic search
3. **Session Context**: Each session tracked separately while maintaining global memory
4. **File-Based Config**: JSON files for configuration, making it easy to backup/restore
5. **Standard Technologies**: Uses SQLite, LevelDB, and JSON - all well-established formats

This architecture enables Claude Desktop to maintain context across sessions while keeping different types of data appropriately separated and searchable.