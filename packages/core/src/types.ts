/**
 * Common repository information across all Git providers
 */
export interface Repo {
  /** Unique identifier for the repository */
  id: string;
  /** Repository name (without owner/group) */
  name: string;
  /** Full repository name including owner/group (e.g., "owner/repo") */
  fullName: string;
  /** Repository description */
  description?: string;
  /** Default branch name */
  defaultBranch: string;
  /** Whether the repository is private */
  isPrivate: boolean;
  /** Web URL for browsing the repository */
  webUrl?: string;
  /** SSH clone URL */
  sshUrl?: string;
  /** HTTP clone URL */
  httpUrl?: string;
}

/**
 * Common organization/workspace information across all Git providers
 * Represents GitHub organizations, GitLab groups, and Bitbucket workspaces
 */
export interface Organization {
  /** Unique identifier for the organization */
  id: string;
  /** Organization name/slug */
  name: string;
  /** Display name of the organization */
  displayName?: string;
  /** Organization description */
  description?: string;
  /** Web URL for browsing the organization */
  webUrl?: string;
  /** User's role in the organization (e.g., 'member', 'admin', 'owner') */
  role?: string;
}

/**
 * Common options for all providers
 */
export interface ProviderOptions {
  /** Custom base URL for self-hosted instances */
  baseUrl?: string;
  /** User agent string for API requests */
  userAgent?: string;
  /** Request timeout in milliseconds */
  requestTimeoutMs?: number;
}

/**
 * GitHub authentication options
 */
export type GitHubAuth =
  | { kind: "token"; token: string }
  | { kind: "app"; appId: number; privateKey: string; installationId?: number }
  | { kind: "oauth"; token: string };

/**
 * GitLab authentication options
 */
export type GitLabAuth =
  | { kind: "token"; token: string }
  | { kind: "oauth"; token: string }
  | { kind: "job"; token: string };

/**
 * Bitbucket authentication options
 */
export type BitbucketAuth =
  | { kind: "basic"; username: string; password: string }
  | { kind: "oauth"; token: string };

/**
 * Union type for all authentication methods
 */
export type AuthConfig = GitHubAuth | GitLabAuth | BitbucketAuth;

/**
 * Pagination options for list operations
 */
export interface PaginationOptions {
  /** Number of items per page */
  perPage?: number;
  /** Maximum total items to fetch */
  maxItems?: number;
}
