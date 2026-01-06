# Scripts Directory

This directory contains one-time migration scripts and utility scripts for database maintenance.

## Important Notes

⚠️ **These scripts should NOT be deployed to production servers.**

These are administrative tools meant to be run manually by developers or administrators for specific maintenance tasks.

## Available Scripts

### fix-usernames.js

A one-time migration script to generate usernames for users who don't have one.

**Usage:**
1. Log in to the app as an admin
2. Open your browser's developer console
3. Copy and paste the contents of `fix-usernames.js` into the console
4. Press Enter to execute

The script will call the `/api/admin/fix-usernames` endpoint and display the results.

**When to use:**
- After adding the username feature to existing users who signed up before usernames were implemented
- Generally only needed once during initial deployment

## Security

These scripts are safe to commit to version control as they don't contain any secrets or credentials. However:

- They should be excluded from production deployments
- They require admin authentication to execute
- They interact with the database through API endpoints that have proper admin verification

## Adding New Scripts

When adding new maintenance scripts:

1. Document them in this README
2. Ensure they require proper authentication
3. Add clear usage instructions
4. Mark them clearly if they're one-time use only

