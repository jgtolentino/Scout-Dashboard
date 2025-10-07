/**
 * changelog.js - Changelog and GitHub release generator for Pulser CLI
 * 
 * Automatically generates formatted changelogs and GitHub release descriptions
 * from git history, categorizing changes and formatting them according to
 * conventional commit standards.
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Configuration
const TEMPLATES_DIR = path.join(os.homedir(), '.pulser', 'templates');
const OUTPUT_DIR = path.join(process.cwd(), 'changelogs');

// Commit type definitions (based on Conventional Commits)
const COMMIT_TYPES = {
  feat: {
    title: 'Features',
    description: 'New features and enhancements',
    order: 1
  },
  fix: {
    title: 'Bug Fixes',
    description: 'Bug fixes and issue resolution',
    order: 2
  },
  perf: {
    title: 'Performance',
    description: 'Performance improvements',
    order: 3
  },
  refactor: {
    title: 'Code Refactoring',
    description: 'Code changes that neither fix bugs nor add features',
    order: 4
  },
  docs: {
    title: 'Documentation',
    description: 'Documentation only changes',
    order: 5
  },
  test: {
    title: 'Tests',
    description: 'Adding or correcting tests',
    order: 6
  },
  ci: {
    title: 'CI',
    description: 'Changes to CI configuration and scripts',
    order: 7
  },
  build: {
    title: 'Build',
    description: 'Changes to build system, dependencies, or project tooling',
    order: 8
  },
  chore: {
    title: 'Chores',
    description: 'Other changes that don\'t modify src or test files',
    order: 9
  },
  other: {
    title: 'Other Changes',
    description: 'Changes that don\'t fit into other categories',
    order: 10
  }
};

/**
 * Handle changelog command
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Command result
 */
async function handleChangelogCommand(args) {
  const subcommand = args._[0];
  delete args._; // Remove the subcommand
  
  // Show help if requested
  if (args.help) {
    showHelp();
    return { status: 'success' };
  }
  
  try {
    switch (subcommand) {
    case 'generate':
      return await generateChangelog(args);
      
    case 'release':
      return await generateReleaseNotes(args);
      
    case 'preview':
      return await previewChangelog(args);
      
    case 'templates':
      return await manageTemplates(args);
      
    default:
      showHelp();
      return { status: 'error', message: `Unknown subcommand: ${subcommand}` };
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

/**
 * Generate a changelog from git history
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Generation result
 */
async function generateChangelog(args) {
  console.log('Generating changelog...');
  
  try {
    // Extract parameters
    const format = args.format || 'markdown';
    const outputPath = args.output;
    const since = args.since || '';
    const until = args.until || 'HEAD';
    const template = args.template || 'default';
    
    // Get the git log
    const commits = await getGitLog(since, until);
    
    if (commits.length === 0) {
      return { status: 'warning', message: 'No commits found in the specified range' };
    }
    
    console.log(`Found ${commits.length} commits.`);
    
    // Categorize commits by type
    const categorizedCommits = categorizeCommits(commits);
    
    // Generate the changelog content
    let changelogContent;
    if (format === 'json') {
      changelogContent = JSON.stringify({
        generatedAt: new Date().toISOString(),
        range: {
          since: since || 'repository start',
          until: until
        },
        categories: categorizedCommits
      }, null, 2);
    } else {
      changelogContent = await formatChangelog(categorizedCommits, template, since, until);
    }
    
    // Write to file if output path is provided
    if (outputPath) {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write the changelog
      await fs.writeFile(outputPath, changelogContent);
      console.log(`Changelog written to: ${outputPath}`);
    } else {
      // Display the changelog
      console.log('\n' + changelogContent);
    }
    
    return { 
      status: 'success', 
      commitCount: commits.length,
      categoryCount: Object.keys(categorizedCommits).length,
      outputPath: outputPath || null
    };
  } catch (error) {
    return { status: 'error', message: `Changelog generation failed: ${error.message}` };
  }
}

/**
 * Generate GitHub release notes
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Generation result
 */
async function generateReleaseNotes(args) {
  console.log('Generating GitHub release notes...');
  
  try {
    // Extract parameters
    const version = args.version;
    if (!version) {
      return { status: 'error', message: '--version is required for release notes' };
    }
    
    // Get the git log between tags
    let since = args.since;
    const until = args.until || 'HEAD';
    const template = args.template || 'github-release';
    const outputPath = args.output;
    
    // If no since tag is provided, try to find the previous version tag
    if (!since) {
      since = await getPreviousVersionTag(version);
      if (since) {
        console.log(`Using previous version tag: ${since}`);
      } else {
        console.log('No previous version tag found, using all commits');
      }
    }
    
    // Get the git log
    const commits = await getGitLog(since, until);
    
    if (commits.length === 0) {
      return { status: 'warning', message: 'No commits found in the specified range' };
    }
    
    console.log(`Found ${commits.length} commits.`);
    
    // Categorize commits by type
    const categorizedCommits = categorizeCommits(commits);
    
    // Generate the release notes
    const releaseNotes = await formatReleaseNotes(categorizedCommits, template, version, since, until);
    
    // Write to file if output path is provided
    if (outputPath) {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write the release notes
      await fs.writeFile(outputPath, releaseNotes);
      console.log(`Release notes written to: ${outputPath}`);
    } else {
      // Display the release notes
      console.log('\n' + releaseNotes);
    }
    
    return { 
      status: 'success', 
      version,
      commitCount: commits.length,
      categoryCount: Object.keys(categorizedCommits).length,
      outputPath: outputPath || null
    };
  } catch (error) {
    return { status: 'error', message: `Release notes generation failed: ${error.message}` };
  }
}

/**
 * Preview changes since last tag
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Preview result
 */
async function previewChangelog(args) {
  console.log('Previewing changes since last tag...');
  
  try {
    // Get the latest tag
    const latestTag = await getLatestTag();
    
    if (!latestTag) {
      return { status: 'warning', message: 'No tags found in the repository' };
    }
    
    console.log(`Latest tag: ${latestTag}`);
    
    // Get the git log since the latest tag
    const commits = await getGitLog(latestTag, 'HEAD');
    
    if (commits.length === 0) {
      return { status: 'success', message: 'No new commits since the latest tag' };
    }
    
    console.log(`Found ${commits.length} commits since ${latestTag}:`);
    
    // Display commit summary
    const categorizedCommits = categorizeCommits(commits);
    const commitSummary = generateCommitSummary(categorizedCommits);
    
    console.log('\nCommit Summary:');
    console.log(commitSummary);
    
    // Suggest next version based on commit types
    const { version, reason } = suggestNextVersion(latestTag, categorizedCommits);
    
    console.log(`\nSuggested next version: ${version} (${reason})`);
    
    return { 
      status: 'success', 
      latestTag,
      commitCount: commits.length,
      suggestedVersion: version,
      versionReason: reason
    };
  } catch (error) {
    return { status: 'error', message: `Preview failed: ${error.message}` };
  }
}

/**
 * Manage changelog templates
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Management result
 */
async function manageTemplates(args) {
  const templateAction = args.action || 'list';
  
  try {
    // Ensure templates directory exists
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    
    switch (templateAction) {
    case 'list':
      return await listTemplates();
      
    case 'create':
      return await createTemplate(args);
      
    case 'view':
      return await viewTemplate(args);
      
    default:
      return { status: 'error', message: `Unknown template action: ${templateAction}` };
    }
  } catch (error) {
    return { status: 'error', message: `Template management failed: ${error.message}` };
  }
}

/**
 * List available templates
 * @returns {Promise<Object>} List result
 */
async function listTemplates() {
  console.log('Available changelog templates:');
  
  try {
    // Get templates from directory
    const files = await fs.readdir(TEMPLATES_DIR);
    const templates = files.filter(file => file.endsWith('.md') || file.endsWith('.hbs'));
    
    if (templates.length === 0) {
      console.log('No custom templates found.');
      console.log('Built-in templates:');
      console.log('- default');
      console.log('- github-release');
      console.log('- compact');
      
      return { 
        status: 'success', 
        templates: ['default', 'github-release', 'compact']
      };
    }
    
    console.log('\nCustom templates:');
    templates.forEach(template => {
      console.log(`- ${path.basename(template, path.extname(template))}`);
    });
    
    console.log('\nBuilt-in templates:');
    console.log('- default');
    console.log('- github-release');
    console.log('- compact');
    
    return { 
      status: 'success', 
      templates: [
        ...templates.map(t => path.basename(t, path.extname(t))),
        'default',
        'github-release',
        'compact'
      ]
    };
  } catch (error) {
    return { status: 'error', message: `Failed to list templates: ${error.message}` };
  }
}

/**
 * Create a new template
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} Creation result
 */
async function createTemplate(args) {
  if (!args.name) {
    return { status: 'error', message: '--name is required for template creation' };
  }
  
  const name = args.name;
  const type = args.type || 'markdown';
  const templatePath = path.join(TEMPLATES_DIR, `${name}.md`);
  
  try {
    // Check if template already exists
    try {
      await fs.access(templatePath);
      return { status: 'error', message: `Template '${name}' already exists` };
    } catch (error) {
      // Template doesn't exist, we can create it
    }
    
    // Create a starter template
    let templateContent;
    
    if (type === 'markdown') {
      templateContent = `# Changelog

## {{version}}{{#if date}} ({{date}}){{/if}}

{{#each categories}}
### {{title}}

{{#each commits}}
* {{message}} ({{hash}}){{#if author}} - {{author}}{{/if}}
{{/each}}

{{/each}}
`;
    } else if (type === 'github') {
      templateContent = `## What's Changed in {{version}}{{#if date}} ({{date}}){{/if}}

{{#each categories}}
### {{title}}

{{#each commits}}
* {{message}} ({{hash}}){{#if author}} by @{{github}}{{/if}}
{{/each}}

{{/each}}

**Full Changelog**: {{compareUrl}}
`;
    } else {
      return { status: 'error', message: `Unknown template type: ${type}` };
    }
    
    // Write the template file
    await fs.writeFile(templatePath, templateContent);
    
    console.log(`Template '${name}' created successfully.`);
    console.log(`Template path: ${templatePath}`);
    
    return { 
      status: 'success', 
      name,
      path: templatePath
    };
  } catch (error) {
    return { status: 'error', message: `Template creation failed: ${error.message}` };
  }
}

/**
 * View a template
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} View result
 */
async function viewTemplate(args) {
  if (!args.name) {
    return { status: 'error', message: '--name is required for viewing a template' };
  }
  
  const name = args.name;
  let templatePath;
  
  // Check if it's a built-in template
  if (['default', 'github-release', 'compact'].includes(name)) {
    return { 
      status: 'success', 
      message: `'${name}' is a built-in template and cannot be viewed directly.`
    };
  }
  
  templatePath = path.join(TEMPLATES_DIR, `${name}.md`);
  
  try {
    // Try to read the template
    const templateContent = await fs.readFile(templatePath, 'utf8');
    
    console.log(`Template: ${name}`);
    console.log('--------------------');
    console.log(templateContent);
    
    return { 
      status: 'success', 
      name,
      content: templateContent
    };
  } catch (error) {
    return { status: 'error', message: `Template '${name}' not found` };
  }
}

/**
 * Get the git log for a specific range
 * @param {string} since - Starting point (tag, commit hash, etc.)
 * @param {string} until - Ending point (default: HEAD)
 * @returns {Promise<Array>} List of commits
 */
async function getGitLog(since, until = 'HEAD') {
  return new Promise((resolve, reject) => {
    // Construct the git log command
    const gitArgs = ['log', '--pretty=format:%H|%an|%ae|%s|%b', '--no-merges'];
    
    if (since) {
      gitArgs.push(`${since}..${until}`);
    } else {
      gitArgs.push(until);
    }
    
    // Execute the command
    const git = spawn('git', gitArgs);
    let stdout = '';
    let stderr = '';
    
    git.stdout.on('data', data => {
      stdout += data.toString();
    });
    
    git.stderr.on('data', data => {
      stderr += data.toString();
    });
    
    git.on('close', code => {
      if (code !== 0) {
        reject(new Error(`git log failed with code ${code}: ${stderr}`));
        return;
      }
      
      // Parse the git log output
      const commits = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [hash, author, email, subject, body] = line.split('|');
        
        return {
          hash: hash.substring(0, 7),
          author,
          email,
          message: subject,
          body: body || '',
          fullHash: hash
        };
      });
      
      resolve(commits);
    });
  });
}

/**
 * Get the latest tag in the repository
 * @returns {Promise<string|null>} Latest tag or null if none found
 */
async function getLatestTag() {
  return new Promise((resolve, reject) => {
    const git = spawn('git', ['describe', '--tags', '--abbrev=0']);
    let stdout = '';
    let stderr = '';
    
    git.stdout.on('data', data => {
      stdout += data.toString();
    });
    
    git.stderr.on('data', data => {
      stderr += data.toString();
    });
    
    git.on('close', code => {
      if (code !== 0) {
        // No tags found or other error
        resolve(null);
        return;
      }
      
      resolve(stdout.trim());
    });
  });
}

/**
 * Get the previous version tag for a given version
 * @param {string} version - Current version
 * @returns {Promise<string|null>} Previous version tag or null if none found
 */
async function getPreviousVersionTag(version) {
  return new Promise((resolve, reject) => {
    const git = spawn('git', ['tag', '--sort=-v:refname']);
    let stdout = '';
    let stderr = '';
    
    git.stdout.on('data', data => {
      stdout += data.toString();
    });
    
    git.stderr.on('data', data => {
      stderr += data.toString();
    });
    
    git.on('close', code => {
      if (code !== 0) {
        // No tags found or other error
        resolve(null);
        return;
      }
      
      const tags = stdout.trim().split('\n').filter(Boolean);
      
      // Find the current version index
      const currentIndex = tags.findIndex(tag => tag === version || tag === `v${version}`);
      
      if (currentIndex === -1 || currentIndex === tags.length - 1) {
        // Version not found or it's the oldest version
        resolve(null);
        return;
      }
      
      resolve(tags[currentIndex + 1]);
    });
  });
}

/**
 * Categorize commits by type
 * @param {Array} commits - List of commits
 * @returns {Object} Categorized commits
 */
function categorizeCommits(commits) {
  const categories = {};
  
  // Initialize categories
  Object.keys(COMMIT_TYPES).forEach(type => {
    categories[type] = {
      title: COMMIT_TYPES[type].title,
      description: COMMIT_TYPES[type].description,
      order: COMMIT_TYPES[type].order,
      commits: []
    };
  });
  
  // Categorize each commit
  commits.forEach(commit => {
    // Parse the commit message to determine the type
    let type = 'other';
    const match = commit.message.match(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.*\))?:\s*(.+)$/i);
    
    if (match) {
      type = match[1].toLowerCase();
      // Update the commit message to remove the type prefix
      commit.message = match[3];
      commit.scope = match[2] ? match[2].replace(/[\(\)]/g, '') : null;
    }
    
    // Add to the appropriate category
    if (categories[type]) {
      categories[type].commits.push(commit);
    } else {
      categories.other.commits.push(commit);
    }
  });
  
  // Remove empty categories
  Object.keys(categories).forEach(type => {
    if (categories[type].commits.length === 0) {
      delete categories[type];
    }
  });
  
  return categories;
}

/**
 * Format a changelog from categorized commits
 * @param {Object} categorizedCommits - Commits categorized by type
 * @param {string} template - Template name to use
 * @param {string} since - Starting point
 * @param {string} until - Ending point
 * @returns {Promise<string>} Formatted changelog
 */
async function formatChangelog(categorizedCommits, template, since, until) {
  // Get the current date
  const date = new Date().toISOString().split('T')[0];
  
  // Get the package.json version if available
  let version = 'Unreleased';
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    version = packageJson.version;
  } catch (error) {
    // No package.json or unable to read it, use 'Unreleased'
  }
  
  // Create data for the template
  const templateData = {
    version,
    date,
    since,
    until,
    categories: []
  };
  
  // Add categories in the correct order
  Object.keys(categorizedCommits)
    .sort((a, b) => categorizedCommits[a].order - categorizedCommits[b].order)
    .forEach(type => {
      templateData.categories.push({
        type,
        title: categorizedCommits[type].title,
        description: categorizedCommits[type].description,
        commits: categorizedCommits[type].commits
      });
    });
  
  // Use the appropriate template
  let changelog;
  
  if (template === 'default') {
    changelog = formatDefaultChangelog(templateData);
  } else if (template === 'compact') {
    changelog = formatCompactChangelog(templateData);
  } else if (template === 'github-release') {
    changelog = formatGitHubReleaseChangelog(templateData);
  } else {
    // Try to use a custom template
    try {
      const templatePath = path.join(TEMPLATES_DIR, `${template}.md`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      changelog = formatCustomChangelog(templateContent, templateData);
    } catch (error) {
      // Custom template not found, fall back to default
      console.log(`Template '${template}' not found, using default`);
      changelog = formatDefaultChangelog(templateData);
    }
  }
  
  return changelog;
}

/**
 * Format release notes from categorized commits
 * @param {Object} categorizedCommits - Commits categorized by type
 * @param {string} template - Template name to use
 * @param {string} version - Version number
 * @param {string} since - Starting point
 * @param {string} until - Ending point
 * @returns {Promise<string>} Formatted release notes
 */
async function formatReleaseNotes(categorizedCommits, template, version, since, until) {
  // Get the current date
  const date = new Date().toISOString().split('T')[0];
  
  // Get the repository URL
  let repoUrl = '';
  try {
    const remoteUrl = await getGitRemoteUrl();
    repoUrl = remoteUrl
      .replace(/^git@github.com:/, 'https://github.com/')
      .replace(/\.git$/, '');
  } catch (error) {
    // Unable to get repository URL
  }
  
  // Create compare URL
  let compareUrl = '';
  if (repoUrl && since) {
    compareUrl = `${repoUrl}/compare/${since}...${until === 'HEAD' ? version : until}`;
  }
  
  // Create data for the template
  const templateData = {
    version,
    date,
    since,
    until,
    repoUrl,
    compareUrl,
    categories: []
  };
  
  // Add categories in the correct order
  Object.keys(categorizedCommits)
    .sort((a, b) => categorizedCommits[a].order - categorizedCommits[b].order)
    .forEach(type => {
      templateData.categories.push({
        type,
        title: categorizedCommits[type].title,
        description: categorizedCommits[type].description,
        commits: categorizedCommits[type].commits.map(commit => {
          // Add GitHub username if we can derive it
          if (commit.email) {
            commit.github = commit.email.split('@')[0];
          }
          return commit;
        })
      });
    });
  
  // Use the appropriate template
  let releaseNotes;
  
  if (template === 'github-release') {
    releaseNotes = formatGitHubReleaseChangelog(templateData);
  } else if (template === 'default') {
    releaseNotes = formatDefaultChangelog(templateData);
  } else if (template === 'compact') {
    releaseNotes = formatCompactChangelog(templateData);
  } else {
    // Try to use a custom template
    try {
      const templatePath = path.join(TEMPLATES_DIR, `${template}.md`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      releaseNotes = formatCustomChangelog(templateContent, templateData);
    } catch (error) {
      // Custom template not found, fall back to GitHub release template
      console.log(`Template '${template}' not found, using github-release`);
      releaseNotes = formatGitHubReleaseChangelog(templateData);
    }
  }
  
  return releaseNotes;
}

/**
 * Format a default changelog
 * @param {Object} data - Template data
 * @returns {string} Formatted changelog
 */
function formatDefaultChangelog(data) {
  let changelog = `# Changelog\n\n`;
  changelog += `## ${data.version}${data.date ? ` (${data.date})` : ''}\n\n`;
  
  data.categories.forEach(category => {
    changelog += `### ${category.title}\n\n`;
    
    category.commits.forEach(commit => {
      changelog += `* ${commit.message} ([${commit.hash}](${commit.hash}))`;
      
      if (commit.author) {
        changelog += ` - ${commit.author}`;
      }
      
      changelog += '\n';
    });
    
    changelog += '\n';
  });
  
  return changelog;
}

/**
 * Format a compact changelog
 * @param {Object} data - Template data
 * @returns {string} Formatted changelog
 */
function formatCompactChangelog(data) {
  let changelog = `# Changelog\n\n`;
  changelog += `## ${data.version}${data.date ? ` (${data.date})` : ''}\n\n`;
  
  data.categories.forEach(category => {
    changelog += `### ${category.title}\n\n`;
    
    const commitsByScope = {};
    
    // Group commits by scope
    category.commits.forEach(commit => {
      const scope = commit.scope || 'general';
      commitsByScope[scope] = commitsByScope[scope] || [];
      commitsByScope[scope].push(commit);
    });
    
    // Output commits by scope
    Object.keys(commitsByScope).sort().forEach(scope => {
      if (scope !== 'general') {
        changelog += `**${scope}:**\n\n`;
      }
      
      commitsByScope[scope].forEach(commit => {
        changelog += `* ${commit.message} (${commit.hash})\n`;
      });
      
      changelog += '\n';
    });
  });
  
  return changelog;
}

/**
 * Format a GitHub release changelog
 * @param {Object} data - Template data
 * @returns {string} Formatted changelog
 */
function formatGitHubReleaseChangelog(data) {
  let changelog = `## What's Changed in ${data.version}${data.date ? ` (${data.date})` : ''}\n\n`;
  
  data.categories.forEach(category => {
    changelog += `### ${category.title}\n\n`;
    
    category.commits.forEach(commit => {
      changelog += `* ${commit.message} ([${commit.hash}](${commit.hash}))`;
      
      if (commit.github) {
        changelog += ` by @${commit.github}`;
      }
      
      changelog += '\n';
    });
    
    changelog += '\n';
  });
  
  if (data.compareUrl) {
    changelog += `**Full Changelog**: ${data.compareUrl}\n`;
  }
  
  return changelog;
}

/**
 * Format a custom changelog
 * @param {string} template - Template content
 * @param {Object} data - Template data
 * @returns {string} Formatted changelog
 */
function formatCustomChangelog(template, data) {
  // Simple templating system (replace variables in {{placeholder}} format)
  let result = template;
  
  // Replace simple variables
  result = result.replace(/\{\{version\}\}/g, data.version);
  result = result.replace(/\{\{date\}\}/g, data.date);
  result = result.replace(/\{\{since\}\}/g, data.since || '');
  result = result.replace(/\{\{until\}\}/g, data.until || 'HEAD');
  result = result.replace(/\{\{compareUrl\}\}/g, data.compareUrl || '');
  
  // Replace categories
  let categoriesContent = '';
  data.categories.forEach(category => {
    let categoryTemplate = template.match(/\{\{#each categories\}\}([\s\S]*?)\{\{\/each\}\}/);
    if (!categoryTemplate) return;
    
    let categoryContent = categoryTemplate[1];
    categoryContent = categoryContent.replace(/\{\{title\}\}/g, category.title);
    categoryContent = categoryContent.replace(/\{\{description\}\}/g, category.description);
    
    // Replace commits in category
    let commitsContent = '';
    let commitTemplate = categoryContent.match(/\{\{#each commits\}\}([\s\S]*?)\{\{\/each\}\}/);
    
    if (commitTemplate) {
      category.commits.forEach(commit => {
        let commitContent = commitTemplate[1];
        commitContent = commitContent.replace(/\{\{message\}\}/g, commit.message);
        commitContent = commitContent.replace(/\{\{hash\}\}/g, commit.hash);
        commitContent = commitContent.replace(/\{\{author\}\}/g, commit.author || '');
        commitContent = commitContent.replace(/\{\{github\}\}/g, commit.github || '');
        
        // Handle conditionals for author
        const authorCondRegex = /\{\{#if author\}\}([\s\S]*?)\{\{\/if\}\}/;
        const authorCond = commitContent.match(authorCondRegex);
        
        if (authorCond) {
          if (commit.author) {
            commitContent = commitContent.replace(authorCondRegex, authorCond[1]);
          } else {
            commitContent = commitContent.replace(authorCondRegex, '');
          }
        }
        
        commitsContent += commitContent;
      });
      
      categoryContent = categoryContent.replace(/\{\{#each commits\}\}[\s\S]*?\{\{\/each\}\}/g, commitsContent);
    }
    
    categoriesContent += categoryContent;
  });
  
  result = result.replace(/\{\{#each categories\}\}[\s\S]*?\{\{\/each\}\}/g, categoriesContent);
  
  return result;
}

/**
 * Get the git remote URL
 * @returns {Promise<string>} Repository URL
 */
async function getGitRemoteUrl() {
  return new Promise((resolve, reject) => {
    const git = spawn('git', ['config', '--get', 'remote.origin.url']);
    let stdout = '';
    let stderr = '';
    
    git.stdout.on('data', data => {
      stdout += data.toString();
    });
    
    git.stderr.on('data', data => {
      stderr += data.toString();
    });
    
    git.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Failed to get git remote URL: ${stderr}`));
        return;
      }
      
      resolve(stdout.trim());
    });
  });
}

/**
 * Generate a commit summary by category
 * @param {Object} categorizedCommits - Commits categorized by type
 * @returns {string} Commit summary
 */
function generateCommitSummary(categorizedCommits) {
  let summary = '';
  
  Object.keys(categorizedCommits)
    .sort((a, b) => categorizedCommits[a].order - categorizedCommits[b].order)
    .forEach(type => {
      const count = categorizedCommits[type].commits.length;
      summary += `- ${categorizedCommits[type].title}: ${count} commit${count !== 1 ? 's' : ''}\n`;
    });
  
  return summary;
}

/**
 * Suggest next version based on commit types
 * @param {string} currentVersion - Current version
 * @param {Object} categorizedCommits - Commits categorized by type
 * @returns {Object} Suggested version and reason
 */
function suggestNextVersion(currentVersion, categorizedCommits) {
  // Remove 'v' prefix if present
  if (currentVersion && currentVersion.startsWith('v')) {
    currentVersion = currentVersion.substring(1);
  }
  
  // Default to 0.1.0 if no current version
  if (!currentVersion || !currentVersion.match(/^\d+\.\d+\.\d+$/)) {
    return { version: '0.1.0', reason: 'No valid version found, starting with 0.1.0' };
  }
  
  // Parse the current version
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  // Check for breaking changes (major)
  const hasBreakingChanges = Object.keys(categorizedCommits).some(type => {
    return categorizedCommits[type].commits.some(commit => {
      return commit.message.toLowerCase().includes('breaking change') ||
             commit.body.toLowerCase().includes('breaking change');
    });
  });
  
  if (hasBreakingChanges) {
    return { version: `${major + 1}.0.0`, reason: 'Breaking changes detected' };
  }
  
  // Check for features (minor)
  if (categorizedCommits.feat && categorizedCommits.feat.commits.length > 0) {
    return { version: `${major}.${minor + 1}.0`, reason: 'New features added' };
  }
  
  // Default to patch
  return { version: `${major}.${minor}.${patch + 1}`, reason: 'Bug fixes or minor changes' };
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Changelog Command
---------------

Generate changelogs and GitHub release notes from git history.

Usage:
  pulser changelog generate [options]    Generate a changelog
  pulser changelog release [options]     Generate GitHub release notes
  pulser changelog preview [options]     Preview changes since last tag
  pulser changelog templates [options]   Manage changelog templates

Generate Options:
  --since POINT        Starting point (tag, commit hash, etc.)
  --until POINT        Ending point (default: HEAD)
  --format FORMAT      Output format (markdown, json)
  --output PATH        Save output to a file
  --template NAME      Template to use (default, compact, github-release, or custom)

Release Options:
  --version VERSION    Version for the release (required)
  --since POINT        Starting point (tag, commit hash, etc.)
  --until POINT        Ending point (default: HEAD)
  --output PATH        Save output to a file
  --template NAME      Template to use (default: github-release)

Preview Options:
  (No options required, shows changes since the latest tag)

Template Options:
  --action ACTION      Template action (list, create, view)
  --name NAME          Template name (required for create, view)
  --type TYPE          Template type for creation (markdown, github)

Examples:
  pulser changelog generate --since v1.0.0 --output CHANGELOG.md
  pulser changelog release --version 1.1.0 --output release-notes.md
  pulser changelog preview
  pulser changelog templates --action create --name custom --type github
  `);
}

// Export the command
module.exports = {
  command: 'changelog',
  description: 'Generate changelogs and release notes',
  args: [
    { name: 'since', type: 'string', description: 'Starting point (tag, commit hash)' },
    { name: 'until', type: 'string', description: 'Ending point (default: HEAD)' },
    { name: 'format', type: 'string', description: 'Output format (markdown, json)' },
    { name: 'output', type: 'string', description: 'Output file path' },
    { name: 'template', type: 'string', description: 'Template to use' },
    { name: 'version', type: 'string', description: 'Version for release notes' },
    { name: 'action', type: 'string', description: 'Template action (list, create, view)' },
    { name: 'name', type: 'string', description: 'Template name' },
    { name: 'type', type: 'string', description: 'Template type' }
  ],
  handler: handleChangelogCommand
};