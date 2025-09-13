# Scout Analytics Dashboard - Bootstrap Guide 🚀

This bootstrap system allows you to quickly set up the Scout Analytics Dashboard by pulling code from multiple repositories and automatically configuring the project.

## 📋 Prerequisites

Before running the bootstrap script, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Git**
- **Python 3** (for dependency resolution)
- **Docker** and **Docker Compose** (for local services)
- **yq** - YAML processor (`brew install yq` on macOS)
- **jq** - JSON processor (`brew install jq` on macOS)

## 🎯 Quick Start

1. **Clone this bootstrap repository:**
   ```bash
   git clone <your-bootstrap-repo>
   cd scout-analytics-bootstrap
   ```

2. **Make scripts executable:**
   ```bash
   chmod +x bootstrap-scout-analytics.sh
   chmod +x scripts/*.sh
   chmod +x scripts/*.py
   ```

3. **Run the main bootstrap script:**
   ```bash
   ./bootstrap-scout-analytics.sh
   ```

4. **Follow the post-bootstrap steps:**
   ```bash
   cd scout-analytics-dashboard
   docker-compose up -d        # Start local services
   ./scripts/setup-database.sh # Setup database
   npm install                 # Install dependencies
   npm run dev                # Start development servers
   ```

## 📁 Project Structure

After bootstrapping, your project will have this structure:

```
scout-analytics-dashboard/
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Page components
│   │   ├── stores/       # State management
│   │   ├── services/     # API services
│   │   └── hooks/        # Custom hooks
│   └── public/           # Static assets
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   └── database/     # Database config
│   └── tests/           # Backend tests
├── infrastructure/       # Cloud infrastructure
│   ├── azure/           # Azure configs
│   ├── docker/          # Docker configs
│   └── kubernetes/      # K8s manifests
├── scripts/             # Utility scripts
├── docs/               # Documentation
└── data/               # Sample data
```

## 🔧 Configuration

### Bootstrap Configuration (`bootstrap-config.yaml`)

The bootstrap configuration file defines:

- **Repository sources**: Where to pull code from
- **Module mappings**: Which parts of repositories to use
- **Dependencies**: How to resolve version conflicts
- **Environment setup**: Default configurations

Example configuration:

```yaml
repositories:
  - name: shadcn-ui
    url: https://github.com/shadcn-ui/ui.git
    branch: main
    modules:
      - src: apps/www/components/ui
        dest: frontend/src/components/ui
```

### Environment Variables

The bootstrap creates a `.env` file with all necessary variables:

- Database connections
- Azure service credentials
- Authentication secrets
- Feature flags

**Important:** Update the `.env` file with your actual credentials before running the application.

## 🛠️ Individual Bootstrap Scripts

You can run specific bootstrap scripts independently:

### Frontend Bootstrap
```bash
./scripts/bootstrap-frontend.sh [frontend-dir] [config-file]
```

### Backend Bootstrap
```bash
./scripts/bootstrap-backend.sh [backend-dir] [config-file]
```

### Dependency Resolution
```bash
python3 scripts/resolve-dependencies.py . -o package.json
```

### Environment Setup
```bash
./scripts/setup-environment.sh . development
```

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x bootstrap-scout-analytics.sh
   chmod +x scripts/*.sh
   ```

2. **Missing Dependencies**
   - Install Node.js 18+: `nvm install 18`
   - Install yq: `brew install yq` (macOS) or `apt-get install yq` (Linux)
   - Install Python 3: `brew install python3` (macOS)

3. **Git Authentication Issues**
   - Configure SSH keys for private repositories
   - Or use HTTPS with personal access tokens

4. **Port Conflicts**
   - Frontend runs on port 3000
   - Backend API runs on port 3001
   - PostgreSQL runs on port 5432
   - Redis runs on port 6379

### Logs and Reports

- **Bootstrap Log**: Check `bootstrap-YYYYMMDD_HHMMSS.log`
- **Bootstrap Report**: See `BOOTSTRAP_REPORT.md` in project directory
- **Dependency Report**: Check `DEPENDENCY_RESOLUTION_REPORT.md`

## 🔄 Updating the Project

To update the project with latest changes from source repositories:

1. Update `bootstrap-config.yaml` with new versions/branches
2. Run the bootstrap script again
3. Resolve any conflicts manually
4. Run dependency resolution script

## 🤝 Contributing

To add new repositories or modules:

1. Edit `bootstrap-config.yaml`
2. Add repository configuration
3. Define module mappings
4. Test the bootstrap process

## 📚 Additional Resources

- [Scout Analytics Documentation](./docs/README.md)
- [API Documentation](./docs/api/README.md)
- [Deployment Guide](./docs/deployment/README.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🆘 Support

For issues or questions:

1. Check the troubleshooting section
2. Review bootstrap logs
3. Contact the engineering team
4. Create an issue in the repository

---

**Happy Coding!** 🎉

Built with ❤️ by the TBWA Engineering Team