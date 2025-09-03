import { Repo, ProviderOptions, PaginationOptions } from "./types.js";

/**
 * Abstract base class for all Git providers
 * Defines the common interface that all provider implementations must follow
 */
export abstract class GitProvider {
  constructor(public readonly opts: ProviderOptions) {}

  /**
   * Get metadata for a specific repository
   * @param repoFullName Full repository name (e.g., "owner/repo")
   * @returns Promise resolving to repository metadata
   */
  abstract getRepoMetadata(repoFullName: string): Promise<Repo>;

  /**
   * Get repositories for the authenticated user
   * @param search Optional search term to filter repositories
   * @param options Optional pagination options
   * @returns Promise resolving to array of repositories
   */
  abstract getUserRepos(search?: string, options?: PaginationOptions): Promise<Repo[]>;

  /**
   * Get branch names for a repository
   * @param repoFullName Full repository name (e.g., "owner/repo")
   * @param options Optional pagination options
   * @returns Promise resolving to array of branch names
   */
  abstract getRepoBranches(repoFullName: string, options?: PaginationOptions): Promise<string[]>;

  /**
   * Get tag names for a repository
   * @param repoFullName Full repository name (e.g., "owner/repo")
   * @param options Optional pagination options
   * @returns Promise resolving to array of tag names
   */
  abstract getRepoTags(repoFullName: string, options?: PaginationOptions): Promise<string[]>;
}
