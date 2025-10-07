/**
 * Command Registry
 *
 * This module registers all available CLI commands and makes them accessible
 * through a central registry.
 */

// Import all command handlers
const debugCommand = require('./commands/debug');
const deviceAuditCommand = require('./commands/device_audit');
const escalateCommand = require('./commands/escalate');
const linkedinCommand = require('./commands/linkedin');
const promptCommand = require('./commands/prompt');
const promptEngineerCommand = require('./commands/prompt_engineer');
const promptScoreCommand = require('./commands/prompt_score');
const supersetCommand = require('./commands/superset');
const surfCommand = require('./commands/surf');
const systemPromptsCommand = require('./commands/system_prompts');
const taskFilterCommand = require('./commands/task_filter');
const visualQaCommand = require('./commands/visual_qa');
const qaReportCommand = require('./commands/qa_report');
const changelogCommand = require('./commands/changelog');
const retailDashboardCommand = require('./commands/retail_dashboard');
const diagramQaCommand = require('./commands/diagram_qa');
const powerbiQaCommand = require('./commands/powerbi_qa');

// Create the command registry
const commandRegistry = {
  [debugCommand.command]: debugCommand.handler,
  [deviceAuditCommand.command]: deviceAuditCommand.handler,
  [escalateCommand.command]: escalateCommand.handler,
  [linkedinCommand.command]: linkedinCommand.handler,
  [promptCommand.command]: promptCommand.handler,
  [promptEngineerCommand.command]: promptEngineerCommand.handler,
  [promptScoreCommand.command]: promptScoreCommand.handler,
  [qaReportCommand.command]: qaReportCommand.handler,
  [changelogCommand.command]: changelogCommand.handler,
  [supersetCommand.command]: supersetCommand.handler,
  [surfCommand.command]: surfCommand.handler,
  [systemPromptsCommand.command]: systemPromptsCommand.handler,
  [taskFilterCommand.command]: taskFilterCommand.handler,
  [visualQaCommand.command]: visualQaCommand.handler,
  [retailDashboardCommand.command]: retailDashboardCommand.handler,
  [diagramQaCommand.name]: diagramQaCommand.handle,
  [powerbiQaCommand.name]: powerbiQaCommand.handle
};

// Export the registry
module.exports = commandRegistry;