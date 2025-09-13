# Unified TypeScript Git API Library

[![CI](https://github.com/data-intuitive/git-providers/workflows/CI/badge.svg)](https://github.com/data-intuitive/git-providers/actions)
[![npm version](https://badge.fury.io/js/%40uni-git%2Fcore.svg)](https://badge.fury.io/js/%40uni-git%2Fcore)

A modular, TypeScript-first library that provides a unified interface for working with multiple Git hosting providers including GitHub, GitLab, and Bitbucket.

## 🎯 Features

- **Unified Interface**: Same API across GitHub, GitLab, and Bitbucket
- **TypeScript First**: Full type safety with strict TypeScript
- **Modular Architecture**: Install only the providers you need
- **Multiple Auth Methods**: Support for tokens, OAuth, GitHub Apps, etc.
- **Self-Hosted Support**: Works with GitHub Enterprise, GitLab self-managed, Bitbucket Server
- **Robust Error Handling**: Consistent error types across providers
- **Built-in Retries**: Automatic retry with exponential backoff

## 🚀 Quick Start

### Basic Usage with Factory

```typescript
import { createProvider } from "@uni-git/unified";

const provider = await createProvider({
  type: "github",
  auth: { kind: "token", token: process.env.GITHUB_TOKEN! },
});

// Works the same across all providers
const repos = await provider.getUserRepos();
const branches = await provider.getRepoBranches("owner/repo");
const tags = await provider.getRepoTags("owner/repo");
const repoInfo = await provider.getRepoMetadata("owner/repo");

// Organization/workspace support
const organizations = await provider.getOrganizations();
const orgRepos = await provider.getOrganizationRepos("my-org");
```

### Organization-Aware Workflow

```typescript
// Discover available organizations/groups/workspaces
const orgs = await provider.getOrganizations();
console.log(`Found ${orgs.length} organizations`);

// List repositories in a specific organization
const orgRepos = await provider.getOrganizationRepos("my-organization");

// Search within organization repositories
const searchResults = await provider.getOrganizationRepos("my-org", "frontend");
```

### Direct Provider Usage

```typescript
import { GitHubProvider } from "@uni-git/provider-github";

const github = new GitHubProvider({
  auth: { kind: "token", token: process.env.GITHUB_TOKEN! },
});

const repos = await github.getUserRepos("my-project");
```

## 📦 Installation

### Core Package (Required)

```bash
npm install @uni-git/core
```

### Providers (Install as needed)

**GitHub:**
```bash
npm install @uni-git/provider-github @octokit/rest @octokit/auth-app
```

**GitLab:**
```bash
npm install @uni-git/provider-gitlab @gitbeaker/rest
```

**Bitbucket:**
```bash
npm install @uni-git/provider-bitbucket bitbucket
```

**Unified Interface (Optional):**
```bash
npm install @uni-git/unified
```

## 🔧 Provider-Specific Configuration

### GitHub

```typescript
import { GitHubProvider } from "@uni-git/provider-github";

// Personal Access Token
const github = new GitHubProvider({
  auth: { kind: "token", token: "ghp_..." },
});

// GitHub App
const githubApp = new GitHubProvider({
  auth: {
    kind: "app",
    appId: 12345,
    privateKey: "-----BEGIN RSA PRIVATE KEY-----\n...",
    installationId: 67890,
  },
});

// GitHub Enterprise
const githubEnterprise = new GitHubProvider({
  auth: { kind: "token", token: "ghp_..." },
  baseUrl: "https://github.company.com/api/v3",
});
```

### GitLab

```typescript
import { GitLabProvider } from "@uni-git/provider-gitlab";

// Personal Access Token
const gitlab = new GitLabProvider({
  auth: { kind: "token", token: "glpat-..." },
});

// OAuth Token
const gitlabOAuth = new GitLabProvider({
  auth: { kind: "oauth", token: "oauth_token" },
});

// Self-hosted GitLab
const gitlabSelfHosted = new GitLabProvider({
  auth: { kind: "token", token: "glpat-..." },
  host: "https://gitlab.company.com",
});
```

### Bitbucket

```typescript
import { BitbucketProvider } from "@uni-git/provider-bitbucket";

// Bitbucket Cloud (SaaS) - requires workspace parameter
const bitbucketCloud = new BitbucketProvider({
  auth: {
    kind: "basic",
    username: "your-username",
    password: "app-password", // NOT your account password
  },
  workspace: "my-workspace", // Required for Bitbucket Cloud
});

// OAuth Token for Bitbucket Cloud
const bitbucketCloudOAuth = new BitbucketProvider({
  auth: { kind: "oauth", token: "oauth_token" },
  workspace: "my-workspace", // Required for Bitbucket Cloud
});

// Self-hosted Bitbucket (no workspace concept)
const bitbucketSelfHosted = new BitbucketProvider({
  auth: {
    kind: "basic",
    username: "your-username",
    password: "your-password",
  },
  baseUrl: "https://bitbucket.company.com/api/2.0",
  // No workspace parameter needed for self-hosted
});

// Discover available workspaces (Bitbucket Cloud only)
const workspaces = await bitbucketCloud.listWorkspaces();
console.log("Available workspaces:", workspaces);

// Get repos from the specified workspace (Cloud) or all repos (self-hosted)
const repos = await bitbucketCloud.getUserRepos();

// Organization/workspace methods work for both Cloud and self-hosted
const organizations = await bitbucketCloud.getOrganizations(); // Workspaces for Cloud, Projects for self-hosted
const orgRepos = await bitbucketCloud.getOrganizationRepos("workspace-or-project-name");
```

## 📚 API Reference

All providers implement the same interface:

### Repository Access

#### `getRepoMetadata(repoFullName: string): Promise<Repo>`

Get detailed metadata for a specific repository.

```typescript
const repo = await provider.getRepoMetadata("owner/repository");
console.log(repo.name, repo.defaultBranch, repo.isPrivate);
```

#### `getUserRepos(search?: string, options?: PaginationOptions): Promise<Repo[]>`

Get repositories for the authenticated user.

```typescript
const repos = await provider.getUserRepos("my-project", { maxItems: 10 });
```

#### `getRepoBranches(repoFullName: string, options?: PaginationOptions): Promise<string[]>`

Get branch names for a repository.

```typescript
const branches = await provider.getRepoBranches("owner/repo", { maxItems: 50 });
```

#### `getRepoTags(repoFullName: string, options?: PaginationOptions): Promise<string[]>`

Get tag names for a repository.

```typescript
const tags = await provider.getRepoTags("owner/repo");
```

### Organization/Workspace Access

#### `getOrganizations(options?: PaginationOptions): Promise<Organization[]>`

Get organizations, groups, or workspaces the authenticated user has access to.

```typescript
const orgs = await provider.getOrganizations();
console.log(`Found ${orgs.length} organizations`);
orgs.forEach(org => console.log(`- ${org.name}: ${org.displayName}`));
```

#### `getOrganizationRepos(organizationName: string, search?: string, options?: PaginationOptions): Promise<Repo[]>`

Get repositories within a specific organization/group/workspace.

```typescript
// List all repositories in an organization
const orgRepos = await provider.getOrganizationRepos("my-organization");

// Search for specific repositories
const frontendRepos = await provider.getOrganizationRepos("my-org", "frontend");
```

## 🏗️ Architecture

The library follows a modular architecture:

```
@uni-git/core           # Base interfaces, types, and utilities
├── @uni-git/provider-github     # GitHub implementation  
├── @uni-git/provider-gitlab     # GitLab implementation
├── @uni-git/provider-bitbucket  # Bitbucket implementation
└── @uni-git/unified            # Factory for provider creation
```

### Benefits of This Design

- **No Vendor Lock-in**: Switch providers easily
- **Small Bundle Size**: Only install what you use
- **Consistent API**: Same methods across all providers
- **Future-Proof**: Easy to add new providers

## 🔐 Authentication

The library supports multiple authentication methods for each provider:

| Provider | Token | OAuth | App Auth | Basic Auth |
|----------|-------|-------|----------|------------|
| GitHub   | ✅ PAT | ✅    | ✅ GitHub App | ❌        |
| GitLab   | ✅ PAT | ✅    | ✅ Job Token | ❌        |
| Bitbucket| ❌    | ✅    | ❌           | ✅ App Password |

## ⚠️ Error Handling

The library provides consistent error types across all providers:

```typescript
import { 
  AuthError, 
  NotFoundError, 
  RateLimitError, 
  NetworkError 
} from "@uni-git/core";

try {
  const repo = await provider.getRepoMetadata("owner/nonexistent");
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log("Repository not found");
  } else if (error instanceof AuthError) {
    console.log("Authentication failed");
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited until ${error.resetAt}`);
  }
}
```

## 🔄 Pagination

Control pagination with options:

```typescript
const repos = await provider.getUserRepos("search-term", {
  perPage: 50,     // Items per API call (max varies by provider)
  maxItems: 200,   // Total items to fetch across all pages
});
```

## 🧪 Development

### Setup

```bash
git clone https://github.com/data-intuitive/git-providers.git
cd git-providers
pnpm install
```

### Build & Test

```bash
# Build all packages
pnpm build

# Run unit tests (always run, use mocks)
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Integration Testing

We provide comprehensive integration tests that verify real API functionality. These tests are **automatically skipped** when credentials are not available.

#### Quick Setup (Recommended Order)

1. **GitHub** (Simplest - 2 minutes):
   ```bash
   export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   pnpm test:integration:github
   ```

2. **GitLab** (Simple - 5 minutes):
   ```bash
   export GITLAB_TOKEN="glpat-xxxxxxxxxxxxxxxxxxxx" 
   pnpm test:integration:gitlab
   ```

3. **Bitbucket** (Medium - 10 minutes):
   ```bash
   export BITBUCKET_USERNAME="your-username"
   export BITBUCKET_APP_PASSWORD="ATBBxxxxxxxxxxxxxxxxxx"
   export BITBUCKET_WORKSPACE="your-workspace"  # Required for Bitbucket Cloud
   pnpm test:integration:bitbucket
   ```

#### All Integration Tests

```bash
# Run all available integration tests
pnpm test:integration

# Or use the comprehensive script
./scripts/integration-test.sh
```

#### Advanced Authentication Testing

```bash
# GitHub App authentication
export GITHUB_APP_ID="123456"
export GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
export GITHUB_APP_INSTALLATION_ID="12345678" # optional

# Self-hosted instances
export GITHUB_BASE_URL="https://github.company.com/api/v3"
export GITLAB_HOST="https://gitlab.company.com"

# OAuth tokens
export GITLAB_OAUTH_TOKEN="oauth_token_here"
export BITBUCKET_OAUTH_TOKEN="oauth_token_here"
```

#### What Integration Tests Cover

- ✅ **Authentication**: All auth methods (tokens, OAuth, GitHub Apps)
- ✅ **API Functionality**: Repository metadata, user repos, branches, tags
- ✅ **Error Handling**: 404s, auth failures, rate limiting
- ✅ **Self-Hosted**: GitHub Enterprise, GitLab self-managed
- ✅ **Pagination**: Large result sets
- ✅ **Cross-Provider**: Consistent interface verification

### Run Example

```bash
cd examples/node-basic
cp .env.example .env
# Edit .env with your tokens
pnpm dev
```

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for details about changes in each version.
