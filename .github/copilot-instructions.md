# Copilot Instructions for AI Coding Agents

## Project Overview
- **Unified TypeScript Git API**: Modular library providing a consistent interface for GitHub, GitLab, and Bitbucket.
- **Architecture**: 
  - `packages/core`: Base types, errors, utilities
  - `packages/provider-github`, `provider-gitlab`, `provider-bitbucket`: Provider-specific implementations
  - `packages/unified`: Factory for dynamic provider creation
  - `examples/node-basic`: Usage examples

## Key Workflows
- **Install dependencies**: Use `pnpm install` (pnpm is required)
- **Build all packages**: `pnpm build`
- **Run unit tests**: `pnpm test` (uses mocks)
- **Type checking**: `pnpm typecheck`
- **Linting**: `pnpm lint`
- **Integration tests**:
  - All: `pnpm test:integration` or `./scripts/integration-test.sh`
  - Provider-specific: `pnpm test:integration:github|gitlab|bitbucket`
  - Requires environment variables for credentials (see README)

## Patterns & Conventions
- **Provider API**: All providers implement the same interface:
  - Repository access: `getRepoMetadata`, `getUserRepos`, `getRepoBranches`, `getRepoTags`
  - Organization access: `getOrganizations`, `getOrganizationRepos`
- **Organization Model**: Unified interface for GitHub organizations, GitLab groups, and Bitbucket workspaces
- **Error Handling**: Use error classes from `core/src/errors.ts` (`AuthError`, `NotFoundError`, etc.)
- **Authentication**: Multiple methods per provider; see README for env vars and config examples
- **Pagination**: Controlled via options (`perPage`, `maxItems`)
- **Modularity**: Only import/install needed providers
- **TypeScript-first**: Strict types, no implicit any

## Integration Points
- **External dependencies**: Each provider uses its own API client (`@octokit/rest`, `@gitbeaker/rest`, `bitbucket`)
- **Self-hosted support**: Custom `baseUrl`/`host` for enterprise instances
- **Cross-package communication**: Providers use shared types/utilities from `core`
- **Bitbucket workspace handling**: Constructor `workspace` parameter is now optional; use `getOrganizations()` to discover available workspaces

## Examples
- See `examples/node-basic/src/index.ts` for usage patterns
- Provider instantiation and factory usage shown in README
- Organization-aware workflow: `getOrganizations()` → `getOrganizationRepos(orgName)`

## Tips for AI Agents
- Always use the unified API for cross-provider features
- Reference `core/src/errors.ts` for error handling logic
- For integration tests, ensure required env vars are set or tests will be skipped
- When adding new providers, follow the structure of existing provider packages
- Use organization methods to discover and access repositories across workspaces/groups
- For Bitbucket, consider making workspace parameter optional to allow discovery via `getOrganizations()`
- Use strict TypeScript types and match the modular architecture

---

If any section is unclear or missing details, please request clarification or provide feedback for improvement.
