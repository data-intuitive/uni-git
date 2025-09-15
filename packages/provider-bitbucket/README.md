# @uni-git/provider-bitbucket

Bitbucket provider for the Uni-Git unified Git API library.

This package provides a complete Bitbucket API implementation supporting both Bitbucket Cloud (bitbucket.org) and Bitbucket Server/Data Center (self-hosted), with automatic detection and workspace handling.

## Installation

```bash
npm install @uni-git/provider-bitbucket
# or
yarn add @uni-git/provider-bitbucket
# or
pnpm add @uni-git/provider-bitbucket
```

**Peer Dependencies:**
- `bitbucket` - Bitbucket REST API client

```bash
npm install bitbucket
```

## Usage

### Basic Setup

```typescript
import { BitbucketProvider } from '@uni-git/provider-bitbucket';

// Bitbucket Cloud with App Password
const provider = new BitbucketProvider({
  auth: {
    kind: "basic",
    username: "your-username",
    password: process.env.BITBUCKET_APP_PASSWORD
  }
});

// Bitbucket Server/Data Center
const serverProvider = new BitbucketProvider({
  auth: {
    kind: "basic",
    username: "your-username", 
    password: process.env.BITBUCKET_PASSWORD
  },
  baseUrl: "https://bitbucket.company.com"
});
```

### Authentication Methods

#### App Password (Bitbucket Cloud)
```typescript
const provider = new BitbucketProvider({
  auth: {
    kind: "basic",
    username: "your-username",
    password: "app-password" // Generated from Bitbucket settings
  }
});
```

**Required App Password Permissions:**
- **Account**: Read
- **Workspaces**: Read  
- **Repositories**: Read
- **Projects**: Read

#### Username & Password (Server/Data Center)
```typescript
const provider = new BitbucketProvider({
  auth: {
    kind: "basic",
    username: "your-username",
    password: "your-password"
  },
  baseUrl: "https://bitbucket.company.com"
});
```

#### OAuth Access Token
```typescript
const provider = new BitbucketProvider({
  auth: {
    kind: "oauth",
    token: "oauth-access-token"
  }
});
```

**Required OAuth Scopes:**
- `account` - Read account information
- `repositories` - Read repository information  
- `team` - Read workspace/team information

### Cloud vs Server Detection

The provider automatically detects whether you're connecting to Bitbucket Cloud or Server:

```typescript
// Bitbucket Cloud - workspace concept applies
const cloudProvider = new BitbucketProvider({
  auth: { kind: "basic", username: "user", password: "pass" }
  // No baseUrl = Cloud, workspaces will be discovered automatically
});

// Bitbucket Server - no workspace concept
const serverProvider = new BitbucketProvider({
  auth: { kind: "basic", username: "user", password: "pass" },
  baseUrl: "https://bitbucket.company.com"
  // baseUrl provided = Server, no workspace required
});
```

### API Methods

#### Repository Operations
```typescript
// Get repository metadata
const repo = await provider.getRepoMetadata("workspace/repository");
console.log(repo.fullName, repo.defaultBranch, repo.isPrivate);

// List user repositories
const repos = await provider.getUserRepos({
  perPage: 50,
  maxItems: 200
});

// Get repository branches
const branches = await provider.getRepoBranches("workspace/repository");

// Get repository tags  
const tags = await provider.getRepoTags("workspace/repository");
```

#### Workspace Operations (Cloud Only)
```typescript
// List user's workspaces (Bitbucket Cloud only)
const workspaces = await provider.getOrganizations();

// List workspace repositories
const workspaceRepos = await provider.getOrganizationRepos("my-workspace");

// Search workspace repositories
const searchResults = await provider.getOrganizationRepos(
  "atlassian",
  "javascript", 
  { maxItems: 10 }
);
```

### Advanced Configuration

```typescript
const provider = new BitbucketProvider({
  auth: { kind: "basic", username: "user", password: "pass" },
  baseUrl: "https://bitbucket.company.com/rest/api/1.0", // Server API URL
  requestTimeoutMs: 10000, // Request timeout
  notice: false, // Disable SDK notices
  strictSSL: true // SSL certificate validation
});
```

### Error Handling

```typescript
import { AuthError, NotFoundError, RateLimitError } from '@uni-git/core';

try {
  const repos = await provider.getUserRepos();
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Authentication failed - check credentials and permissions');
  } else if (error instanceof NotFoundError) {
    console.error('Repository or workspace not found');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Reset at: ${error.resetTime}`);
  }
}
```

## Features

### Workspace Support (Cloud)
- Automatic workspace discovery
- Role-based access (member, collaborator, admin, owner)
- Project and repository enumeration
- Enhanced search capabilities

### Server/Data Center Support
- No workspace concept - direct repository access
- Project-based organization
- Enterprise authentication
- Custom API endpoints

### Repository Access
- Public and private repository support
- Comprehensive metadata extraction
- Branch and tag enumeration
- Clone URL generation (HTTPS/SSH)
- Bitbucket-specific features (pull requests, pipelines)

### Authentication Flexibility
- Multiple authentication methods
- Automatic Cloud vs Server detection
- App password support for enhanced security
- OAuth flow support

### Performance Optimizations
- Intelligent pagination
- Request retry logic  
- Rate limit awareness
- Concurrent request handling

## Bitbucket Cloud vs Server/Data Center

| Feature | Bitbucket Cloud | Bitbucket Server/Data Center |
|---------|-----------------|------------------------------|
| Workspaces | ✅ Required | ❌ Not supported |
| Projects | ✅ Within workspaces | ✅ Top-level organization |
| Authentication | App passwords, OAuth | Username/password, OAuth |
| API Endpoint | `api.bitbucket.org` | Custom server URL |
| Rate Limits | Standard limits | Admin configured |

### Bitbucket Cloud Specifics

**Workspace Model:**
- All repositories belong to a workspace
- Users can be members of multiple workspaces
- Each workspace can contain multiple projects
- Repository full name: `workspace/repository`

**App Passwords:**
- More secure than account passwords
- Granular permission control
- Can be revoked independently
- Recommended for API access

### Bitbucket Server/Data Center Specifics

**Project Model:**
- Repositories organized under projects
- No workspace concept
- Repository full name: `project/repository` or `~user/repository`
- Personal repositories use `~username` prefix

**Authentication:**
- Username/password authentication
- LDAP/Active Directory integration
- OAuth apps (if configured)
- Personal access tokens (newer versions)

## Troubleshooting

### Common Issues

**401 Unauthorized Errors:**
- Check app password permissions (Cloud)
- Verify username/password (Server)
- Ensure token hasn't expired (OAuth)

**403 Forbidden Errors:**
- Check workspace membership (Cloud)
- Verify repository permissions
- Ensure user has access to project (Server)

**404 Not Found Errors:**
- Repository may be private without access
- Workspace/project name may be incorrect
- Check if using correct Cloud vs Server endpoint

### Workspace Discovery Issues (Cloud)
If workspace discovery fails:

```typescript
// Manually specify workspace during construction (fallback)
const provider = new BitbucketProvider({
  auth: { kind: "basic", username: "user", password: "pass" },
  workspace: "fallback-workspace" // Optional fallback
});
```

### Testing

Run integration tests with your Bitbucket credentials:

**Bitbucket Cloud:**
```bash
export BITBUCKET_USERNAME=your_username
export BITBUCKET_APP_PASSWORD=your_app_password
npm test
```

**Bitbucket Server:**
```bash
export BITBUCKET_USERNAME=your_username  
export BITBUCKET_PASSWORD=your_password
export BITBUCKET_BASE_URL=https://bitbucket.company.com
npm test
```

**OAuth:**
```bash
export BITBUCKET_OAUTH_TOKEN=your_oauth_token
npm test
```

## Migration from Other Providers

### From GitHub
- Replace organizations with workspaces (Cloud) or projects (Server)
- Update repository identifiers to include workspace/project
- Adjust authentication method (app passwords recommended)

### From GitLab  
- Replace groups with workspaces (Cloud) or projects (Server)
- Update repository identifiers format
- Consider workspace membership vs group membership differences

## Related Packages

- [`@uni-git/core`](../core) - Core types and utilities
- [`@uni-git/unified`](../unified) - Unified factory for creating providers
- [`@uni-git/provider-github`](../provider-github) - GitHub provider
- [`@uni-git/provider-gitlab`](../provider-gitlab) - GitLab provider

## License

MIT
