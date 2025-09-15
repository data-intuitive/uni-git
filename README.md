# Uni-Git

A unified TypeScript library for interacting with multiple Git hosting platforms (GitHub, GitLab, Bitbucket) through a consistent API.

## Features

- **Multi-platform support**: GitHub, GitLab, and Bitbucket (Cloud & Server)
- **Unified API**: Consistent interface across all platforms
- **Organization-aware**: Automatic discovery of organizations, groups, and workspaces
- **TypeScript**: Full type safety and excellent IDE support
- **Modular**: Use only the providers you need
- **Multiple auth methods**: Support for various authentication mechanisms per platform
- **Enterprise ready**: Support for GitHub Enterprise, self-hosted GitLab, and Bitbucket Server

## Quick Start

### Install the unified package

```bash
npm install @uni-git/unified

# Install peer dependencies for the platforms you need
npm install @octokit/rest          # For GitHub
npm install @gitbeaker/rest        # For GitLab  
npm install bitbucket              # For Bitbucket
```

### Create a provider

```typescript
import { createProvider } from '@uni-git/unified';

const provider = await createProvider({
  platform: 'github',
  auth: {
    kind: 'token',
    token: 'your-github-token'
  }
});

// Now use the same API regardless of platform
const repos = await provider.getUserRepos();
const repoInfo = await provider.getRepoMetadata('owner/repo');
```

### Organization discovery

```typescript
import { createProviderWithOrganizations } from '@uni-git/unified';

const { provider, organizations } = await createProviderWithOrganizations({
  platform: 'github',
  auth: { kind: 'token', token: 'your-token' }
});

// Access pre-discovered organizations
console.log(`Found ${organizations.length} organizations`);
for (const org of organizations) {
  const repos = await provider.getOrganizationRepos(org.name);
  console.log(`${org.name}: ${repos.length} repositories`);
}
```

## Packages

This repository contains multiple packages:

| Package | Description | Version |
|---------|-------------|---------|
| **[@uni-git/core](./packages/core)** | Core types, interfaces, and utilities | ![npm](https://img.shields.io/npm/v/@uni-git/core) |
| **[@uni-git/provider-github](./packages/provider-github)** | GitHub provider with Enterprise support | ![npm](https://img.shields.io/npm/v/@uni-git/provider-github) |
| **[@uni-git/provider-gitlab](./packages/provider-gitlab)** | GitLab provider with self-hosted support | ![npm](https://img.shields.io/npm/v/@uni-git/provider-gitlab) |
| **[@uni-git/provider-bitbucket](./packages/provider-bitbucket)** | Bitbucket provider (Cloud & Server/Data Center) | ![npm](https://img.shields.io/npm/v/@uni-git/provider-bitbucket) |
| **[@uni-git/unified](./packages/unified)** | Factory for creating providers with convenience features | ![npm](https://img.shields.io/npm/v/@uni-git/unified) |

## Platform Support

| Feature | GitHub | GitLab | Bitbucket |
|---------|--------|--------|-----------|
| **Public Cloud** | ✅ GitHub.com | ✅ GitLab.com | ✅ Bitbucket Cloud |
| **Self-hosted** | ✅ Enterprise Server | ✅ Self-hosted | ✅ Server/Data Center |
| **Organizations** | Organizations | Groups/Subgroups | Workspaces (Cloud only) |
| **Authentication** | PAT, Fine-grained PAT, GitHub Apps | PAT, OAuth, Job tokens | App passwords, OAuth, Basic auth |
| **Enterprise features** | Full support | Full support | Full support |

## Authentication

Each platform supports multiple authentication methods with proper permission requirements:

### GitHub
```typescript
// Personal Access Token (classic)
auth: { kind: 'token', token: 'ghp_...' }

// Fine-grained Personal Access Token  
auth: { kind: 'token', token: 'github_pat_...' }

// GitHub App
auth: { 
  kind: 'app', 
  appId: 12345, 
  privateKey: '-----BEGIN RSA PRIVATE KEY-----...',
  installationId: 67890 
}
```

### GitLab
```typescript
// Personal Access Token
auth: { kind: 'token', token: 'glpat-...' }

// OAuth token
auth: { kind: 'oauth', token: 'oauth-token' }

// Job token (CI/CD)
auth: { kind: 'job', token: process.env.CI_JOB_TOKEN }
```

### Bitbucket
```typescript
// App password (recommended for Cloud)
auth: { 
  kind: 'basic', 
  username: 'your-username', 
  password: 'app-password' 
}

// OAuth token
auth: { kind: 'oauth', token: 'oauth-access-token' }
```

For detailed permission requirements, see our [API Permissions Guide](./API-PERMISSIONS.md).

## Self-hosted / Enterprise Support

### GitHub Enterprise Server
```typescript
const provider = await createProvider({
  platform: 'github',
  auth: { kind: 'token', token: 'your-token' },
  baseUrl: 'https://github.company.com/api/v3'
});
```

### Self-hosted GitLab
```typescript
const provider = await createProvider({
  platform: 'gitlab',
  auth: { kind: 'token', token: 'your-token' },
  host: 'https://gitlab.company.com'
});
```

### Bitbucket Server/Data Center
```typescript
const provider = await createProvider({
  platform: 'bitbucket',
  auth: { kind: 'basic', username: 'user', password: 'pass' },
  baseUrl: 'https://bitbucket.company.com'
});
```

## Examples

### Multi-platform repository discovery
```typescript
import { createProviderWithOrganizations } from '@uni-git/unified';

const platforms = ['github', 'gitlab', 'bitbucket'] as const;

for (const platform of platforms) {
  const { provider, organizations } = await createProviderWithOrganizations({
    platform,
    auth: { /* platform-specific auth */ }
  });
  
  console.log(`${platform}: ${organizations.length} organizations`);
  for (const org of organizations) {
    const repos = await provider.getOrganizationRepos(org.name);
    console.log(`  ${org.name}: ${repos.length} repos`);
  }
}
```

### Cross-platform repository migration
```typescript
// Source: GitHub
const source = await createProvider({
  platform: 'github',
  auth: { kind: 'token', token: process.env.GITHUB_TOKEN }
});

// Target: GitLab
const target = await createProvider({
  platform: 'gitlab', 
  auth: { kind: 'token', token: process.env.GITLAB_TOKEN }
});

// Get repository info from GitHub
const repo = await source.getRepoMetadata('owner/repository');
console.log(`Migrating: ${repo.fullName}`);
console.log(`Description: ${repo.description}`);
console.log(`Clone URL: ${repo.cloneUrls.https}`);
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (required for workspace management)

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run unit tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Integration Testing

Integration tests require real API credentials:

```bash
# Set up environment variables
export GITHUB_TOKEN=your_github_token
export GITLAB_TOKEN=your_gitlab_token
export BITBUCKET_USERNAME=your_username
export BITBUCKET_APP_PASSWORD=your_app_password

# Run all integration tests
pnpm test:integration

# Run specific provider tests
pnpm test:integration:github
pnpm test:integration:gitlab  
pnpm test:integration:bitbucket
```

### Project Structure

```
packages/
├── core/                 # Base types, errors, utilities
├── provider-github/      # GitHub implementation
├── provider-gitlab/      # GitLab implementation  
├── provider-bitbucket/   # Bitbucket implementation
└── unified/              # Factory and convenience functions

examples/
└── node-basic/           # Usage examples

scripts/
└── integration-test.sh   # Integration test runner
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT - see [LICENSE](./LICENSE) file for details.
