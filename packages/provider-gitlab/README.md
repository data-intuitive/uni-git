# @uni-git/provider-gitlab

GitLab provider for the Uni-Git unified Git API library.

This package provides a complete GitLab API implementation supporting GitLab.com and self-hosted GitLab instances, with multiple authentication methods including personal access tokens, OAuth tokens, and job tokens.

## Installation

```bash
npm install @uni-git/provider-gitlab
# or
yarn add @uni-git/provider-gitlab
# or
pnpm add @uni-git/provider-gitlab
```

**Peer Dependencies:**
- `@gitbeaker/rest` - GitLab REST API client

```bash
npm install @gitbeaker/rest
```

## Usage

### Basic Setup

```typescript
import { GitLabProvider } from '@uni-git/provider-gitlab';

// Personal Access Token
const provider = new GitLabProvider({
  auth: {
    kind: "token",
    token: process.env.GITLAB_TOKEN
  }
});

// Self-hosted GitLab
const selfHostedProvider = new GitLabProvider({
  auth: {
    kind: "token",
    token: process.env.GITLAB_TOKEN
  },
  host: "https://gitlab.company.com"
});
```

### Authentication Methods

#### Personal Access Token
```typescript
const provider = new GitLabProvider({
  auth: {
    kind: "token",
    token: "glpat-xxxxxxxxxxxxxxxxxxxx"
  }
});
```

**Required Scopes:**
- `read_api` - Read access to the API
- `read_user` - Read user information
- `read_repository` - Read repository information

#### OAuth Access Token
```typescript
const provider = new GitLabProvider({
  auth: {
    kind: "oauth",
    token: "oauth-access-token"
  }
});
```

**Required OAuth Scopes:**
- `read_api` - Read access to the API
- `read_user` - Read user information
- `read_repository` - Read repository information

#### Job Token (CI/CD)
```typescript
const provider = new GitLabProvider({
  auth: {
    kind: "job",
    token: process.env.CI_JOB_TOKEN
  }
});
```

**Note:** Job tokens have limited scope to the current project and related resources.

### API Methods

#### Repository Operations
```typescript
// Get repository metadata
const repo = await provider.getRepoMetadata("group/project");
console.log(repo.fullName, repo.defaultBranch, repo.isPrivate);

// List user repositories
const repos = await provider.getUserRepos({
  perPage: 50,
  maxItems: 200
});

// Get repository branches
const branches = await provider.getRepoBranches("group/project");

// Get repository tags
const tags = await provider.getRepoTags("group/project");
```

#### Group Operations
```typescript
// List user's groups (includes subgroups)
const groups = await provider.getOrganizations();

// List group projects
const groupProjects = await provider.getOrganizationRepos("gitlab-org");

// Search group projects
const searchResults = await provider.getOrganizationRepos(
  "gitlab-org",
  "kubernetes",
  { maxItems: 10 }
);
```

### Advanced Configuration

```typescript
const provider = new GitLabProvider({
  auth: { kind: "token", token: process.env.GITLAB_TOKEN },
  host: "https://gitlab.com", // Custom GitLab instance
  requestTimeoutMs: 15000, // Request timeout
  rejectUnauthorized: true // SSL certificate validation
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
    console.error('Project or group not found');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Try again later.`);
  }
}
```

## Features

### Group Support
- Multi-level group hierarchy support
- Subgroup automatic discovery
- Role-based access (guest, reporter, developer, maintainer, owner)
- Enhanced search across group projects

### Repository Access
- Public, internal, and private project support
- Comprehensive metadata extraction
- Branch and tag enumeration
- Clone URL generation (HTTPS/SSH)
- GitLab-specific features (merge requests, issues)

### Authentication Flexibility
- Multiple authentication methods
- Self-hosted GitLab instance support
- CI/CD job token integration
- OAuth flow support

### Performance Optimizations
- Intelligent pagination
- Request retry logic
- Rate limit awareness
- Concurrent request handling

## GitLab Self-Hosted

For self-hosted GitLab instances:

```typescript
const provider = new GitLabProvider({
  auth: { kind: "token", token: process.env.GITLAB_TOKEN },
  host: "https://gitlab.company.com"
});
```

**Additional Considerations:**
- Verify SSL certificates are properly configured
- API versions may differ between GitLab.com and self-hosted instances
- Rate limits may be configured differently
- Some features may be disabled or configured differently

## GitLab.com vs Self-Hosted

| Feature | GitLab.com | Self-Hosted |
|---------|------------|-------------|
| Authentication | All methods | All methods |
| API Access | Full API | Depends on version |
| Rate Limits | Standard limits | Admin configured |
| SSL | Always HTTPS | Configurable |
| Groups | Unlimited depth | Unlimited depth |

## Troubleshooting

### Common Issues

**401 Unauthorized Errors:**
- Check token validity and expiration
- Verify required scopes are granted
- Ensure token has access to the specific project/group

**403 Forbidden Errors:**
- Check project/group visibility settings
- Verify user has appropriate role in group
- Ensure token has sufficient permissions

**404 Not Found Errors:**
- Project may be private without access
- Group name may be incorrect
- Resource may have been moved or deleted

### Testing

Run integration tests with your GitLab credentials:

```bash
export GITLAB_TOKEN=your_token_here
npm test
```

For self-hosted GitLab:
```bash
export GITLAB_TOKEN=your_token_here
export GITLAB_HOST=https://gitlab.company.com
npm test
```

For OAuth testing:
```bash
export GITLAB_OAUTH_TOKEN=your_oauth_token
npm test
```

## GitLab API Specifics

### Group Hierarchy
GitLab groups can be nested multiple levels deep. The provider automatically handles:
- Parent group discovery
- Subgroup enumeration
- Cross-group project search

### Project Visibility Levels
- **Private**: Only group/project members
- **Internal**: All authenticated users (GitLab.com) or instance users (self-hosted)
- **Public**: Everyone, including unauthenticated users

### Namespace Handling
GitLab uses namespaces for both users and groups:
- User namespace: `username/project`
- Group namespace: `group/project` or `group/subgroup/project`

## Related Packages

- [`@uni-git/core`](../core) - Core types and utilities
- [`@uni-git/unified`](../unified) - Unified factory for creating providers
- [`@uni-git/provider-github`](../provider-github) - GitHub provider
- [`@uni-git/provider-bitbucket`](../provider-bitbucket) - Bitbucket provider

## License

MIT
