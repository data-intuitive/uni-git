import {
  GitProvider,
  Repo,
  ProviderOptions,
  GitLabAuth,
  AuthError,
  NotFoundError,
  RateLimitError,
  NetworkError,
  PaginationOptions,
  withRetry,
} from "@uni-git/core";

export interface GitLabProviderOptions extends ProviderOptions {
  auth: GitLabAuth;
  host?: string; // GitLab instance URL (default: https://gitlab.com)
}

export class GitLabProvider extends GitProvider {
  private gitlab?: any; // GitLab client type

  constructor(private readonly gl: GitLabProviderOptions) {
    super(gl);
  }

  private async client(): Promise<any> {
    if (this.gitlab) {
      return this.gitlab;
    }

    try {
      const { Gitlab } = await import("@gitbeaker/rest");

      const config: any = {
        host: this.gl.host || this.opts.baseUrl || "https://gitlab.com",
        requestTimeout: this.opts.requestTimeoutMs || 20000,
      };

      // Handle auth variants
      switch (this.gl.auth.kind) {
        case "token":
          config.token = this.gl.auth.token;
          break;
        case "oauth":
          config.oauthToken = this.gl.auth.token;
          break;
        case "job":
          config.jobToken = this.gl.auth.token;
          break;
        default:
          throw new Error(`Unsupported GitLab auth kind: ${(this.gl.auth as any).kind}`);
      }

      this.gitlab = new Gitlab(config);
      return this.gitlab;
    } catch (error) {
      throw new NetworkError("Failed to initialize GitLab client", error);
    }
  }

  async getRepoMetadata(repoFullName: string): Promise<Repo> {
    return withRetry(async () => {
      try {
        const cli = await this.client();
        const project = await cli.Projects.show(repoFullName);

        return {
          id: String(project.id),
          name: project.name,
          fullName: project.path_with_namespace,
          description: project.description ?? undefined,
          defaultBranch: project.default_branch || "main",
          isPrivate: project.visibility !== "public",
          webUrl: project.web_url,
          sshUrl: project.ssh_url_to_repo ?? undefined,
          httpUrl: project.http_url_to_repo ?? undefined,
        };
      } catch (error: unknown) {
        throw mapGitLabError(error);
      }
    });
  }

  async getUserRepos(search?: string, options?: PaginationOptions): Promise<Repo[]> {
    return withRetry(async () => {
      try {
        const cli = await this.client();
        const repos: Repo[] = [];
        let page = 1;
        const perPage = Math.min(options?.perPage || 100, 100);
        const maxItems = options?.maxItems || Infinity;

        while (repos.length < maxItems) {
          const projects = await cli.Projects.all({
            membership: true,
            order_by: "updated_at",
            sort: "desc",
            page,
            per_page: perPage,
            search: search,
          });

          if (!projects.length) {
            break;
          }

          for (const project of projects) {
            if (repos.length >= maxItems) {
              break;
            }

            repos.push({
              id: String(project.id),
              name: project.name,
              fullName: project.path_with_namespace,
              description: project.description ?? undefined,
              defaultBranch: project.default_branch || "main",
              isPrivate: project.visibility !== "public",
              webUrl: project.web_url,
              sshUrl: project.ssh_url_to_repo ?? undefined,
              httpUrl: project.http_url_to_repo ?? undefined,
            });
          }

          page++;
        }

        return repos;
      } catch (error: unknown) {
        throw mapGitLabError(error);
      }
    });
  }

  async getRepoBranches(repoFullName: string, options?: PaginationOptions): Promise<string[]> {
    return withRetry(async () => {
      try {
        const cli = await this.client();
        const branches: string[] = [];
        let page = 1;
        const perPage = Math.min(options?.perPage || 100, 100);
        const maxItems = options?.maxItems || Infinity;

        while (branches.length < maxItems) {
          const branchList = await cli.Branches.all(repoFullName, {
            page,
            per_page: perPage,
          });

          if (!branchList.length) {
            break;
          }

          for (const branch of branchList) {
            if (branches.length >= maxItems) {
              break;
            }
            branches.push(branch.name);
          }

          page++;
        }

        return branches;
      } catch (error: unknown) {
        throw mapGitLabError(error);
      }
    });
  }

  async getRepoTags(repoFullName: string, options?: PaginationOptions): Promise<string[]> {
    return withRetry(async () => {
      try {
        const cli = await this.client();
        const tags: string[] = [];
        let page = 1;
        const perPage = Math.min(options?.perPage || 100, 100);
        const maxItems = options?.maxItems || Infinity;

        while (tags.length < maxItems) {
          const tagList = await cli.Tags.all(repoFullName, {
            page,
            per_page: perPage,
            order_by: "updated",
            sort: "desc",
          });

          if (!tagList.length) {
            break;
          }

          for (const tag of tagList) {
            if (tags.length >= maxItems) {
              break;
            }
            tags.push(tag.name);
          }

          page++;
        }

        return tags;
      } catch (error: unknown) {
        throw mapGitLabError(error);
      }
    });
  }
}

function mapGitLabError(error: unknown): Error {
  if (error && typeof error === "object") {
    // GitLab errors might have different structure
    if ("response" in error) {
      const response = (error as any).response;
      const status = response?.status;
      const message = response?.statusText || "GitLab API error";

      switch (status) {
        case 401:
          return new AuthError("GitLab authentication failed", error);
        case 403:
          return new AuthError("GitLab authorization failed", error);
        case 404:
          return new NotFoundError("Repository not found", error);
        case 429:
          return new RateLimitError(undefined, error);
        case 502:
        case 503:
        case 504:
          return new NetworkError("GitLab service temporarily unavailable", error);
        default:
          if (status >= 500) {
            return new NetworkError(`GitLab server error: ${message}`, error);
          }
          return new NetworkError(`GitLab API error: ${message}`, error);
      }
    }

    if ("status" in error) {
      const status = (error as { status: number }).status;
      const message = (error as { message?: string }).message || "GitLab API error";

      switch (status) {
        case 401:
          return new AuthError("GitLab authentication failed", error);
        case 403:
          return new AuthError("GitLab authorization failed", error);
        case 404:
          return new NotFoundError("Repository not found", error);
        case 429:
          return new RateLimitError(undefined, error);
        default:
          if (status >= 500) {
            return new NetworkError(`GitLab server error: ${message}`, error);
          }
          return new NetworkError(`GitLab API error: ${message}`, error);
      }
    }
  }

  if (error instanceof Error) {
    return new NetworkError(`GitLab request failed: ${error.message}`, error);
  }

  return new NetworkError("Unknown GitLab error", error);
}
