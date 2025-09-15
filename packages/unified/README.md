# @uni-git/unified

Unified factory for creating Git providers with automatic organization discovery and enhanced convenience features.

This package provides a single entry point for creating GitHub, GitLab, or Bitbucket providers with standardized configuration and automatic organization/workspace support.

## Installation

```bash
npm install @uni-git/unified
# or
yarn add @uni-git/unified
# or  
pnpm add @uni-git/unified
```

**Peer Dependencies (install as needed):**
```bash
# For GitHub support
npm install @uni-git/provider-github @octokit/rest

# For GitLab support  
npm install @uni-git/provider-gitlab @gitbeaker/rest

# For Bitbucket support
npm install @uni-git/provider-bitbucket bitbucket
```

## Usage

### Basic Factory Usage

```typescript
import { createProvider } from '@uni-git/unified';

// GitHub provider
const githubProvider = await createProvider({
  platform: 'github',
  auth: {
    kind: 'token',
    token: process.env.GITHUB_TOKEN
  }
});

// GitLab provider
const gitlabProvider = await createProvider({
  platform: 'gitlab', 
  auth: {
    kind: 'token',
    token: process.env.GITLAB_TOKEN
  }
});

// Bitbucket provider  
const bitbucketProvider = await createProvider({
  platform: 'bitbucket',
  auth: {
    kind: 'basic',
    username: 'your-username',
    password: process.env.BITBUCKET_APP_PASSWORD
  }
});
```

### Organization-Aware Provider

For enhanced organization/workspace management:

```typescript
import { createProviderWithOrganizations } from '@uni-git/unified';

const { provider, organizations } = await createProviderWithOrganizations({
  platform: 'github',
  auth: {
    kind: 'token', 
    token: process.env.GITHUB_TOKEN
  }
});

// Provider is ready to use
const repos = await provider.getUserRepos();

// Organizations are pre-loaded
console.log(`Found ${organizations.length} organizations:`);
organizations.forEach(org => {
  console.log(`- ${org.name} (${org.role})`);
});

// Get repositories for a specific organization
const orgRepos = await provider.getOrganizationRepos(organizations[0].name);
```

### Platform-Specific Configuration

#### GitHub Configuration
```typescript
const provider = await createProvider({
  platform: 'github',
  auth: {
    kind: 'app',
    appId: 12345,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    installationId: 67890
  },
  baseUrl: 'https://github.company.com/api/v3' // Enterprise Server
});
```

#### GitLab Configuration
```typescript
const provider = await createProvider({
  platform: 'gitlab',
  auth: {
    kind: 'oauth',
    token: process.env.GITLAB_OAUTH_TOKEN
  },
  host: 'https://gitlab.company.com' // Self-hosted instance
});
```

#### Bitbucket Configuration
```typescript
const provider = await createProvider({
  platform: 'bitbucket',
  auth: {
    kind: 'oauth',
    token: process.env.BITBUCKET_OAUTH_TOKEN  
  },
  baseUrl: 'https://bitbucket.company.com' // Server/Data Center
});
```

### Dynamic Provider Selection

```typescript
import { createProvider } from '@uni-git/unified';

async function getProviderForRepo(repoUrl: string) {
  let platform: 'github' | 'gitlab' | 'bitbucket';
  
  if (repoUrl.includes('github.com')) {
    platform = 'github';
  } else if (repoUrl.includes('gitlab.com')) {
    platform = 'gitlab';
  } else if (repoUrl.includes('bitbucket.org')) {
    platform = 'bitbucket';
  } else {
    throw new Error('Unsupported platform');
  }

  return await createProvider({
    platform,
    auth: {
      kind: 'token',
      token: process.env[`${platform.toUpperCase()}_TOKEN`]
    }
  });
}
```

### Error Handling

```typescript
import { AuthError, NotFoundError } from '@uni-git/core';

try {
  const provider = await createProvider({
    platform: 'github',
    auth: { kind: 'token', token: 'invalid-token' }
  });
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Invalid authentication credentials');
  } else {
    console.error('Provider creation failed:', error.message);
  }
}
```

## Features

### Unified Interface
- Single factory function for all providers
- Consistent configuration across platforms
- Standardized error handling
- Type-safe provider creation

### Organization Discovery
- Automatic organization/workspace/group enumeration
- Pre-loaded organization metadata
- Role and permission information
- Enhanced repository access patterns

### Platform Abstraction
- Hide platform-specific differences
- Consistent API across GitHub, GitLab, and Bitbucket
- Unified authentication methods
- Cross-platform repository management

### Advanced Configuration
- Custom API endpoints for self-hosted instances
- Timeout and retry configuration
- SSL certificate handling
- Request interceptors and middleware

## Configuration Reference

### Common Configuration Options

```typescript
interface ProviderConfig {
  platform: 'github' | 'gitlab' | 'bitbucket';
  auth: AuthConfig;
  requestTimeoutMs?: number;
  userAgent?: string;
  
  // Platform-specific options
  baseUrl?: string;    // GitHub Enterprise, Bitbucket Server
  host?: string;       // GitLab self-hosted
  workspace?: string;  // Bitbucket Cloud fallback
}
```

### Authentication Types

```typescript
// Token-based (Personal Access Token, Fine-grained token)
auth: {
  kind: 'token',
  token: string
}

// Basic authentication (Bitbucket, GitLab)
auth: {
  kind: 'basic', 
  username: string,
  password: string
}

// OAuth (All platforms)
auth: {
  kind: 'oauth',
  token: string
}

// GitHub App (GitHub only)
auth: {
  kind: 'app',
  appId: number,
  privateKey: string, 
  installationId?: number
}

// Job token (GitLab CI/CD)
auth: {
  kind: 'job',
  token: string
}
```

## Examples

### Multi-Platform Repository Discovery

```typescript
import { createProviderWithOrganizations } from '@uni-git/unified';

async function discoverAllRepositories() {
  const platforms = [
    { platform: 'github' as const, token: process.env.GITHUB_TOKEN },
    { platform: 'gitlab' as const, token: process.env.GITLAB_TOKEN },
    { platform: 'bitbucket' as const, username: 'user', password: process.env.BITBUCKET_APP_PASSWORD }
  ];

  for (const config of platforms) {
    try {
      const auth = config.platform === 'bitbucket' 
        ? { kind: 'basic' as const, username: config.username!, password: config.password! }
        : { kind: 'token' as const, token: config.token! };

      const { provider, organizations } = await createProviderWithOrganizations({
        platform: config.platform,
        auth
      });

      console.log(`\n${config.platform.toUpperCase()} Organizations:`);
      for (const org of organizations) {
        const repos = await provider.getOrganizationRepos(org.name);
        console.log(`- ${org.name}: ${repos.length} repositories`);
      }
    } catch (error) {
      console.error(`Failed to connect to ${config.platform}:`, error.message);
    }
  }
}
```

### Repository Synchronization

```typescript
import { createProvider } from '@uni-git/unified';

async function syncRepositoryMetadata(sourceUrl: string, targetUrl: string) {
  // Create providers for source and target
  const sourceProvider = await createProvider(/* source config */);
  const targetProvider = await createProvider(/* target config */);

  // Get repository metadata from source
  const sourceRepo = await sourceProvider.getRepoMetadata('owner/repo');
  
  // Use metadata to update or create repository on target platform
  console.log(`Syncing: ${sourceRepo.fullName}`);
  console.log(`Description: ${sourceRepo.description}`);
  console.log(`Default branch: ${sourceRepo.defaultBranch}`);
}
```

## Testing

The unified package includes comprehensive tests for factory functionality:

```bash
# Run unit tests
npm test

# Run integration tests (requires credentials)
export GITHUB_TOKEN=your_github_token
export GITLAB_TOKEN=your_gitlab_token  
export BITBUCKET_USERNAME=your_username
export BITBUCKET_APP_PASSWORD=your_app_password
npm run test:integration
```

## Migration Guide

### From Individual Providers

**Before:**
```typescript
import { GitHubProvider } from '@uni-git/provider-github';
import { GitLabProvider } from '@uni-git/provider-gitlab';

const github = new GitHubProvider({ auth: { kind: 'token', token: 'xxx' } });
const gitlab = new GitLabProvider({ auth: { kind: 'token', token: 'yyy' } });
```

**After:**
```typescript
import { createProvider } from '@uni-git/unified';

const github = await createProvider({ 
  platform: 'github', 
  auth: { kind: 'token', token: 'xxx' }
});
const gitlab = await createProvider({
  platform: 'gitlab',
  auth: { kind: 'token', token: 'yyy' }  
});
```

### Benefits of Migration
- Consistent configuration interface
- Automatic organization discovery
- Standardized error handling
- Easier testing and mocking
- Future-proof provider selection

## Related Packages

- [`@uni-git/core`](../core) - Core types and utilities
- [`@uni-git/provider-github`](../provider-github) - GitHub provider implementation
- [`@uni-git/provider-gitlab`](../provider-gitlab) - GitLab provider implementation  
- [`@uni-git/provider-bitbucket`](../provider-bitbucket) - Bitbucket provider implementation

## License

MIT
