# Node.js Basic Example

This example demonstrates how to use the Uni-Git library to interact with GitHub, GitLab, and Bitbucket using a unified API.

## Features Demonstrated

- **Multi-platform support**: Same code works across GitHub, GitLab, and Bitbucket
- **Repository operations**: List user repos, get repo metadata, branches, and tags
- **Organization support**: Discover and list organization/group/workspace repositories
- **Enhanced organization workflow**: Using `createProviderWithOrganizations` for automatic discovery
- **Error handling**: Graceful handling of authentication and API errors
- **Enterprise support**: Examples for GitHub Enterprise, self-hosted GitLab, and Bitbucket Server

## Setup

### 1. Install Dependencies

From the example directory:

```bash
pnpm install
```

### 2. Set Environment Variables

Create a `.env` file in this directory with your credentials:

```bash
# GitHub (required for GitHub demo)
GITHUB_TOKEN=ghp_your_github_token_here

# GitLab (required for GitLab demo)  
GITLAB_TOKEN=glpat-your_gitlab_token_here

# Bitbucket (required for Bitbucket demo)
BITBUCKET_USERNAME=your_bitbucket_username
BITBUCKET_APP_PASSWORD=your_app_password

# Optional: Enterprise/Self-hosted instances
GITHUB_BASE_URL=https://github.company.com/api/v3
GITLAB_HOST=https://gitlab.company.com
```

### 3. Run the Example

```bash
# Development mode (with TypeScript)
pnpm dev

# Or build and run
pnpm build
pnpm start
```

## What the Example Shows

### Basic Provider Usage

```typescript
import { createProvider } from '@uni-git/unified';

const provider = await createProvider({
  type: 'github',
  auth: { kind: 'token', token: 'your-token' }
});

const repos = await provider.getUserRepos();
```

### Organization-Aware Workflow

```typescript
import { createProviderWithOrganizations } from '@uni-git/unified';

const { provider, organizations } = await createProviderWithOrganizations({
  type: 'github',
  auth: { kind: 'token', token: 'your-token' }
});

// Organizations are pre-loaded and ready to use
for (const org of organizations) {
  const repos = await provider.getOrganizationRepos(org.name);
  console.log(`${org.name}: ${repos.length} repositories`);
}
```

### Cross-Platform Repository Information

The example demonstrates how the same code works across all platforms:

```typescript
// Works identically for GitHub, GitLab, and Bitbucket
const repo = await provider.getRepoMetadata('owner/repository');
console.log(`Name: ${repo.fullName}`);
console.log(`Default branch: ${repo.defaultBranch}`);
console.log(`Clone URL: ${repo.httpUrl}`);
console.log(`Private: ${repo.isPrivate}`);

const branches = await provider.getRepoBranches('owner/repository');
const tags = await provider.getRepoTags('owner/repository');
```

## Authentication Requirements

### GitHub
- **Personal Access Token**: `repo`, `read:org` scopes
- **Fine-grained Token**: Contents (Read), Metadata (Read), Organization permissions (Read)
- **GitHub App**: Contents (Read), Metadata (Read), Members (Read)

### GitLab  
- **Personal Access Token**: `read_api`, `read_user`, `read_repository` scopes
- **OAuth Token**: `read_api`, `read_user`, `read_repository` scopes

### Bitbucket
- **App Password**: Account (Read), Workspaces (Read), Repositories (Read), Projects (Read)
- **OAuth Token**: `account`, `repositories`, `team` scopes

## Expected Output

When run with proper credentials, you'll see output like:

```
🚀 Multi-Provider Git API Library Demo
=======================================

🐙 GitHub Provider Demo
========================
✅ GitHub provider created successfully

📁 Fetching repositories...
Found 15 repositories:
  - username/awesome-project (public)
    A really cool project that does amazing things...
  - username/private-repo (private)

🔍 Repository details for username/awesome-project:
  Default branch: main
  Clone URL (HTTPS): https://github.com/username/awesome-project.git
  Clone URL (SSH): git@github.com:username/awesome-project.git
  Web URL: https://github.com/username/awesome-project
  Branches (3): main, develop, feature-branch
  Tags (2): v1.0.0, v1.1.0

🏢 Organizations and organization repositories:
Found 2 organizations:
  - my-company (My Company Inc.)
    Repositories (5): api-server, frontend-app, docs

🏢 Organization-Aware Provider Demo
====================================
✅ Provider created with pre-loaded organizations
📋 Found 2 organizations:

🏢 Organization: my-company
   Display Name: My Company Inc.
   Role: member
   Description: Our company's main organization
   📁 Repositories (5):
     - api-server (private)
     - frontend-app (public)
     - docs (public)
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your tokens are correct and have the required scopes
   - Check that tokens haven't expired

2. **No Organizations Found**
   - Normal if you're not a member of any organizations
   - Check organization membership visibility settings

3. **Rate Limiting**
   - The example includes built-in pagination limits to avoid rate limits
   - Consider using GitHub Apps for higher rate limits

4. **Network Errors**
   - Verify enterprise/self-hosted URLs are correct
   - Check SSL certificate configuration for self-hosted instances

### Getting Help

- Check the main [README](../../README.md) for more information
- Review the [API Permissions Guide](../../API-PERMISSIONS.md) for detailed permission requirements
- Open an issue if you encounter problems

## Next Steps

After running this example, you might want to:

1. Explore the individual provider packages for advanced features
2. Implement organization discovery in your own applications
3. Add repository search and filtering capabilities
4. Integrate with CI/CD pipelines for repository management
5. Build cross-platform repository migration tools
