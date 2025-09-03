import {
  GitProvider,
  Repo,
  ProviderOptions,
  GitHubAuth,
  AuthError,
  NotFoundError,
  RateLimitError,
  NetworkError,
  PaginationOptions,
  withRetry,
} from "@uni-git/core";

export interface GitHubProviderOptions extends ProviderOptions {
  auth: GitHubAuth;
  baseUrl?: string; // GitHub Enterprise: https://ghe.example/api/v3
}

export class GitHubProvider extends GitProvider {
  private octokit?: import("@octokit/rest").Octokit;

  constructor(private readonly gh: GitHubProviderOptions) {
    super(gh);
  }

  private async client(): Promise<import("@octokit/rest").Octokit> {
    if (this.octokit) {
      return this.octokit;
    }

    try {
      const { Octokit } = await import("@octokit/rest");

      // Handle auth variants
      if (this.gh.auth.kind === "app") {
        const { createAppAuth } = await import("@octokit/auth-app");
        const config: any = {
          authStrategy: createAppAuth,
          auth: {
            appId: this.gh.auth.appId,
            privateKey: this.gh.auth.privateKey,
            installationId: this.gh.auth.installationId,
          },
          request: {
            timeout: this.opts.requestTimeoutMs || 20000,
          },
          userAgent: this.opts.userAgent || "@uni-git/provider-github",
        };
        if (this.gh.baseUrl) {
          config.baseUrl = this.gh.baseUrl;
        }
        this.octokit = new Octokit(config);
      } else {
        // token or oauth token are both bearer
        const config: any = {
          auth: this.gh.auth.token,
          request: {
            timeout: this.opts.requestTimeoutMs || 20000,
          },
          userAgent: this.opts.userAgent || "@uni-git/provider-github",
        };
        if (this.gh.baseUrl) {
          config.baseUrl = this.gh.baseUrl;
        }
        this.octokit = new Octokit(config);
      }

      return this.octokit;
    } catch (error) {
      throw new NetworkError("Failed to initialize GitHub client", error);
    }
  }

  async getRepoMetadata(repoFullName: string): Promise<Repo> {
    return withRetry(async () => {
      try {
        const [owner, repo] = repoFullName.split("/");
        if (!owner || !repo) {
          throw new Error(`Invalid repository name: ${repoFullName}`);
        }

        const cli = await this.client();
        const { data } = await cli.repos.get({ owner, repo });

        return {
          id: String(data.id),
          name: data.name,
          fullName: data.full_name,
          ...(data.description ? { description: data.description } : {}),
          defaultBranch: data.default_branch,
          isPrivate: Boolean(data.private),
          webUrl: data.html_url,
          ...(data.ssh_url ? { sshUrl: data.ssh_url } : {}),
          ...(data.clone_url ? { httpUrl: data.clone_url } : {}),
        };
      } catch (error: unknown) {
        throw mapGitHubError(error);
      }
    });
  }

  async getUserRepos(search?: string, options?: PaginationOptions): Promise<Repo[]> {
    return withRetry(async () => {
      try {
        const cli = await this.client();
        const repos: Repo[] = [];
        const perPage = Math.min(options?.perPage || 100, 100);
        const maxItems = options?.maxItems || Infinity;

        for await (const response of cli.paginate.iterator(cli.repos.listForAuthenticatedUser, {
          per_page: perPage,
          visibility: "all",
          sort: "updated",
          direction: "desc",
        })) {
          for (const r of response.data) {
            if (repos.length >= maxItems) {
              return repos;
            }

            if (!search || r.full_name.includes(search) || r.name.includes(search)) {
              repos.push({
                id: String(r.id),
                name: r.name,
                fullName: r.full_name,
                ...(r.description ? { description: r.description } : {}),
                defaultBranch: r.default_branch,
                isPrivate: Boolean(r.private),
                webUrl: r.html_url,
                ...(r.ssh_url ? { sshUrl: r.ssh_url } : {}),
                ...(r.clone_url ? { httpUrl: r.clone_url } : {}),
              });
            }
          }
        }

        return repos;
      } catch (error: unknown) {
        throw mapGitHubError(error);
      }
    });
  }

  async getRepoBranches(repoFullName: string, options?: PaginationOptions): Promise<string[]> {
    return withRetry(async () => {
      try {
        const [owner, repo] = repoFullName.split("/");
        if (!owner || !repo) {
          throw new Error(`Invalid repository name: ${repoFullName}`);
        }

        const cli = await this.client();
        const branches: string[] = [];
        const perPage = Math.min(options?.perPage || 100, 100);
        const maxItems = options?.maxItems || Infinity;

        for await (const response of cli.paginate.iterator(cli.repos.listBranches, {
          owner,
          repo,
          per_page: perPage,
        })) {
          for (const branch of response.data) {
            if (branches.length >= maxItems) {
              return branches;
            }
            branches.push(branch.name);
          }
        }

        return branches;
      } catch (error: unknown) {
        throw mapGitHubError(error);
      }
    });
  }

  async getRepoTags(repoFullName: string, options?: PaginationOptions): Promise<string[]> {
    return withRetry(async () => {
      try {
        const [owner, repo] = repoFullName.split("/");
        if (!owner || !repo) {
          throw new Error(`Invalid repository name: ${repoFullName}`);
        }

        const cli = await this.client();
        const tags: string[] = [];
        const perPage = Math.min(options?.perPage || 100, 100);
        const maxItems = options?.maxItems || Infinity;

        for await (const response of cli.paginate.iterator(cli.repos.listTags, {
          owner,
          repo,
          per_page: perPage,
        })) {
          for (const tag of response.data) {
            if (tags.length >= maxItems) {
              return tags;
            }
            tags.push(tag.name);
          }
        }

        return tags;
      } catch (error: unknown) {
        throw mapGitHubError(error);
      }
    });
  }
}

function mapGitHubError(error: unknown): Error {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    const message = (error as { message?: string }).message || "GitHub API error";

    switch (status) {
      case 401:
        return new AuthError("GitHub authentication failed", error);
      case 403:
        return new AuthError("GitHub authorization failed", error);
      case 404:
        return new NotFoundError("Repository not found", error);
      case 429:
        return new RateLimitError(undefined, error);
      case 502:
      case 503:
      case 504:
        return new NetworkError("GitHub service temporarily unavailable", error);
      default:
        if (status >= 500) {
          return new NetworkError(`GitHub server error: ${message}`, error);
        }
        return new NetworkError(`GitHub API error: ${message}`, error);
    }
  }

  if (error instanceof Error) {
    return new NetworkError(`GitHub request failed: ${error.message}`, error);
  }

  return new NetworkError("Unknown GitHub error", error);
}
