# @uni-git/provider-github

GitHub provider for the Uni-Git unified Git API library.

This package provides a complete GitHub API implementation supporting GitHub.com and GitHub Enterprise Server, with multiple authentication methods including personal access tokens, fine-grained tokens, and GitHub Apps.

## Installation

```bash
npm install @uni-git/provider-github
# or
yarn add @uni-git/provider-github
# or
pnpm add @uni-git/provider-github
```

**Peer Dependencies:**
- `@octokit/rest` - GitHub REST API client
- `@octokit/auth-app` - GitHub App authentication (if using App auth)

```bash
npm install @octokit/rest @octokit/auth-app
```

## Usage

### Basic Setup

```typescript
import { GitHubProvider } from '@uni-git/provider-github';

// Personal Access Token
const provider = new GitHubProvider({
  auth: {
    kind: "token",
    token: process.env.GITHUB_TOKEN
  }
});

// GitHub Enterprise Server
const enterpriseProvider = new GitHubProvider({
  auth: {
    kind: "token", 
    token: process.env.GITHUB_TOKEN
  },
  baseUrl: "https://github.company.com/api/v3"
});
```

### Authentication Methods

#### Personal Access Token (Classic)
```typescript
const provider = new GitHubProvider({
  auth: {
    kind: "token",
    token: "ghp_xxxxxxxxxxxxxxxxxxxx"
  }
});
```

**Required Scopes:**
- `repo` - Repository access (includes private repos)
- `read:org` - Organization membership access

#### Fine-Grained Personal Access Token
```typescript
const provider = new GitHubProvider({
  auth: {
    kind: "token",
    token: "github_pat_xxxxxxxxxxxxxxxxxxxx"
  }
});
```

**Required Permissions:**
- **Repository permissions:** Contents (Read), Metadata (Read), Pull requests (Read)
- **Account permissions:** Organization permissions (Read)

#### GitHub App
```typescript
const provider = new GitHubProvider({
  auth: {
    kind: "app",
    appId: 12345,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    installationId: 67890 // Optional - auto-detected if not provided
  }
});
```

**Required App Permissions:**
- **Repository permissions:** Contents (Read), Metadata (Read), Pull requests (Read)
- **Organization permissions:** Members (Read)

### API Methods

#### Repository Operations
```typescript
// Get repository metadata
const repo = await provider.getRepoMetadata("owner/repository");
console.log(repo.fullName, repo.defaultBranch, repo.isPrivate);

// List user repositories
const repos = await provider.getUserRepos({
  perPage: 50,
  maxItems: 200
});

// Get repository branches
const branches = await provider.getRepoBranches("owner/repository");

// Get repository tags
const tags = await provider.getRepoTags("owner/repository");
```

#### Organization Operations
```typescript
// List user's organizations
const organizations = await provider.getOrganizations();

// List organization repositories
const orgRepos = await provider.getOrganizationRepos("github");

// Search organization repositories
const searchResults = await provider.getOrganizationRepos(
  "github", 
  "typescript",
  { maxItems: 10 }
);
```

### Advanced Configuration

```typescript
const provider = new GitHubProvider({
  auth: { kind: "token", token: process.env.GITHUB_TOKEN },
  baseUrl: "https://api.github.com", // Custom API URL
  userAgent: "MyApp/1.0.0", // Custom user agent
  requestTimeoutMs: 10000 // Request timeout
});
```

### Error Handling

```typescript
import { AuthError, NotFoundError, RateLimitError } from '@uni-git/core';

try {
  const repos = await provider.getUserRepos();
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Authentication failed - check your token and scopes');
  } else if (error instanceof NotFoundError) {
    console.error('Repository or organization not found');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Reset at: ${error.resetTime}`);
  }
}
```

## Features

### Organization Support
- Automatic organization discovery
- Role-based access (member, admin, owner)
- Enhanced search with repository descriptions
- Membership visibility handling

### Repository Access
- Public and private repository support
- Comprehensive metadata extraction
- Branch and tag enumeration
- Clone URL generation (HTTPS/SSH)

### Authentication Flexibility
- Multiple authentication methods
- Automatic token validation
- GitHub Enterprise Server support
- GitHub App installation handling

### Performance Optimizations
- Intelligent pagination
- Request retry logic
- Rate limit awareness
- Concurrent request batching

## GitHub Enterprise Server

For GitHub Enterprise Server instances:

```typescript
const provider = new GitHubProvider({
  auth: { kind: "token", token: process.env.GHE_TOKEN },
  baseUrl: "https://github.company.com/api/v3"
});
```

**Additional Considerations:**
- Verify SSL certificates are properly configured
- Some API features may differ between GitHub.com and Enterprise Server versions
- Rate limits may be configured differently

## Troubleshooting

### Common Issues

**403 Forbidden Errors:**
- Check token scopes/permissions
- Verify organization membership visibility
- Ensure repository access permissions

**404 Not Found Errors:**
- Repository may be private without access
- Organization name may be incorrect
- Resource may have been deleted or renamed

**Rate Limiting:**
- Use pagination options to reduce API calls
- Implement proper retry logic
- Consider GitHub App for higher rate limits

### Testing

Run integration tests with your GitHub credentials:

```bash
export GITHUB_TOKEN=your_token_here
npm test
```

For GitHub App testing:
```bash
export GITHUB_APP_ID=your_app_id
export GITHUB_APP_PRIVATE_KEY=your_private_key
export GITHUB_APP_INSTALLATION_ID=installation_id
npm test
```

## Related Packages

- [`@uni-git/core`](../core) - Core types and utilities
- [`@uni-git/unified`](../unified) - Unified factory for creating providers
- [`@uni-git/provider-gitlab`](../provider-gitlab) - GitLab provider
- [`@uni-git/provider-bitbucket`](../provider-bitbucket) - Bitbucket provider

## License

MIT
