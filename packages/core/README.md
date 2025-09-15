# @uni-git/core

Core types, interfaces, and utilities for the Uni-Git unified Git API library.

This package provides the foundational components used by all Git provider implementations, including:

- **Common interfaces** (`Repo`, `Organization`, `GitProvider`)
- **Authentication types** for GitHub, GitLab, and Bitbucket
- **Error classes** (`AuthError`, `NotFoundError`, `NetworkError`, etc.)
- **Utility functions** for retry logic and error mapping
- **TypeScript types** for pagination, filtering, and provider options

## Installation

```bash
npm install @uni-git/core
# or
yarn add @uni-git/core
# or
pnpm add @uni-git/core
```

## Usage

This package is typically used as a dependency by provider packages and not directly by end users. However, you can import types and utilities:

```typescript
import { 
  GitProvider, 
  Repo, 
  Organization,
  AuthError,
  NotFoundError,
  PaginationOptions 
} from '@uni-git/core';

// Extend the base GitProvider class
class MyCustomProvider extends GitProvider {
  // Implementation details...
}

// Use common types
function processRepos(repos: Repo[]) {
  repos.forEach(repo => {
    console.log(`${repo.fullName}: ${repo.description}`);
  });
}

// Handle errors
try {
  const repos = await provider.getUserRepos();
  processRepos(repos);
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Authentication failed');
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found');
  }
}
```

## Key Types

### `GitProvider`
Abstract base class that all provider implementations extend.

```typescript
abstract class GitProvider {
  abstract getRepoMetadata(repoFullName: string): Promise<Repo>;
  abstract getUserRepos(options?: RepoListOptions): Promise<Repo[]>;
  abstract getRepoBranches(repoFullName: string, options?: PaginationOptions): Promise<string[]>;
  abstract getRepoTags(repoFullName: string, options?: PaginationOptions): Promise<string[]>;
  abstract getOrganizations(options?: PaginationOptions): Promise<Organization[]>;
  abstract getOrganizationRepos(organizationName: string, searchTerm?: string, options?: RepoListOptions): Promise<Repo[]>;
}
```

### `Repo`
Unified repository information across all Git providers.

```typescript
interface Repo {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  defaultBranch: string;
  isPrivate: boolean;
  webUrl?: string;
  sshUrl?: string;
  httpUrl?: string;
}
```

### `Organization`
Unified organization/workspace information (GitHub orgs, GitLab groups, Bitbucket workspaces).

```typescript
interface Organization {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  webUrl?: string;
  role?: string;
}
```

## Error Classes

- **`AuthError`** - Authentication failures (invalid credentials, insufficient permissions)
- **`NotFoundError`** - Resource not found or inaccessible
- **`NetworkError`** - Network-related issues (timeouts, connectivity)
- **`RateLimitError`** - API rate limiting
- **`ConfigurationError`** - Invalid configuration or setup

## Authentication Types

### GitHub
```typescript
type GitHubAuth = 
  | { kind: "token"; token: string }
  | { kind: "app"; appId: number; privateKey: string; installationId?: number };
```

### GitLab  
```typescript
type GitLabAuth =
  | { kind: "token"; token: string }
  | { kind: "oauth"; token: string };
```

### Bitbucket
```typescript
type BitbucketAuth =
  | { kind: "basic"; username: string; password: string }
  | { kind: "oauth"; token: string };
```

## Related Packages

- [`@uni-git/provider-github`](../provider-github) - GitHub provider implementation
- [`@uni-git/provider-gitlab`](../provider-gitlab) - GitLab provider implementation  
- [`@uni-git/provider-bitbucket`](../provider-bitbucket) - Bitbucket provider implementation
- [`@uni-git/unified`](../unified) - Unified factory for creating providers

## License

MIT
