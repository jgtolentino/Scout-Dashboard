# 🚀 Migration Guide: PoC to Production

This guide provides step-by-step instructions for migrating the PoC to your main repository.

## 📋 Pre-Migration Checklist

- [ ] PoC is working locally (`npm run dev`)
- [ ] All core features are implemented
- [ ] Team has reviewed and approved the PoC
- [ ] You have admin access to the main repository
- [ ] Azure deployment token is available

## 🔧 Migration Scripts

We've provided automated scripts to handle the migration:

### 1. **migrate-to-production.sh**

Main migration script that:

- Creates a backup of your current code
- Cleans the repository (preserving .git)
- Copies all PoC files
- Updates configurations
- Commits the changes

```bash
cd pulser-poc/scripts
./migrate-to-production.sh
```

### 2. **rollback-migration.sh**

Emergency rollback if something goes wrong:

```bash
./rollback-migration.sh
```

### 3. **post-migration-setup.sh**

Sets up production environment after migration:

```bash
cd ../../  # Back to main repo
./scripts/post-migration-setup.sh
```

### 4. **verify-production.sh**

Verifies everything is working:

```bash
./scripts/verify-production.sh
# Or with your production URL:
./scripts/verify-production.sh https://your-app.azurestaticapps.net
```

## 📝 Manual Migration Steps

If you prefer manual migration:

### Step 1: Backup Current Repository

```bash
cd your-main-repo
git checkout -b legacy-backup-$(date +%Y%m%d)
git push origin legacy-backup-$(date +%Y%m%d)
```

### Step 2: Clean Repository

```bash
git checkout main
find . -mindepth 1 -maxdepth 1 ! -name '.git*' -exec rm -rf {} +
```

### Step 3: Copy PoC Files

```bash
cp -r path/to/pulser-poc/* .
cp -r path/to/pulser-poc/.github .
cp path/to/pulser-poc/.gitignore .
cp path/to/pulser-poc/.prettierrc.json .
cp path/to/pulser-poc/.eslintrc.json .
```

### Step 4: Commit Migration

```bash
git add -A
git commit -m "feat: migrate to clean monorepo structure"
git push origin main
```

## 🔐 Post-Migration Setup

### 1. GitHub Secrets

Add these in Settings → Secrets → Actions:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `AZURE_OPENAI_KEY` (if using)
- `AZURE_OPENAI_ENDPOINT` (if using)

### 2. Branch Protection

Settings → Branches → Add rule for `main`:

- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date

### 3. Update CI/CD

The GitHub Action should trigger automatically on push.

### 4. Team Notification

Send this to your team:

```
🎉 Repository Migration Complete!

We've migrated to a clean monorepo structure with:
- React + TypeScript frontend
- Azure Functions API
- Automated CI/CD
- Full linting and formatting

To get started:
1. git pull origin main
2. npm install
3. npm run dev

Docs: README.md
```

## 🚨 Troubleshooting

### Build Fails

```bash
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf api/node_modules api/package-lock.json
npm install
```

### Port Conflicts

```bash
kill -9 $(lsof -ti:5173)  # Frontend
kill -9 $(lsof -ti:7071)  # API
```

### Git Issues

```bash
git fetch --all
git reset --hard origin/main
```

## 📊 Success Criteria

- [ ] CI/CD pipeline is green
- [ ] Production site loads
- [ ] API endpoints respond
- [ ] Team can clone and run locally
- [ ] No references to old structure

## 🎯 Next Steps After Migration

1. **Phase 2**: Add more API endpoints
2. **Phase 3**: Implement authentication
3. **Phase 4**: Add comprehensive testing
4. **Phase 5**: Performance optimization

## 💡 Tips

- Run migration during low-traffic hours
- Have the rollback script ready
- Test locally before pushing
- Keep the legacy backup for 30 days
- Document any custom changes

## 📞 Need Help?

If you encounter issues:

1. Check the migration log
2. Try the rollback script
3. Review this guide
4. Check GitHub Actions logs

---

Remember: The migration scripts automate 90% of the work, but always verify the results!
