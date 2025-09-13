import {
  GitProvider,
  Repo,
  Organization,
  ProviderOptions,
  BitbucketAuth,
  AuthError,
  NotFoundError,
  RateLimitError,
  NetworkError,
  PaginationOptions,
  withRetry,
} from "@uni-git/core";

export interface BitbucketProviderOptions extends ProviderOptions {
  auth: BitbucketAuth;
  workspace?: string; // Required for Bitbucket Cloud, not used for self-hosted
  // For Bitbucket Cloud: workspace is required for repository access
  // For Self-hosted: workspace is ignored, uses projects instead
}

export class BitbucketProvider extends GitProvider {
  private bitbucket?: any; // bitbucket client type not easily importable

  constructor(private readonly bb: BitbucketProviderOptions) {
    super(bb);
  }

  /**
   * Check if this is Bitbucket Cloud (SaaS) vs self-hosted
   */
  private isBitbucketCloud(): boolean {
    const baseUrl = this.opts.baseUrl || "https://api.bitbucket.org/2.0";
    return baseUrl.includes("bitbucket.org");
  }

  /**
   * List available workspaces for Bitbucket Cloud
   * Only works with Bitbucket Cloud, not self-hosted
   */
  async listWorkspaces(options?: PaginationOptions): Promise<Array<{ slug: string; name: string; uuid: string }>> {
    if (!this.isBitbucketCloud()) {
      throw new Error("listWorkspaces() is only available for Bitbucket Cloud, not self-hosted instances");
    }

    return withRetry(async () => {
      try {
        const client = await this.client();
        const workspaces: Array<{ slug: string; name: string; uuid: string }> = [];
        let page = 1;
        const pagelen = Math.min(options?.perPage || 50, 100);
        const maxItems = options?.maxItems || Infinity;

        while (workspaces.length < maxItems) {
          const { data } = await client.workspaces.getWorkspaces({
            role: "member",
            page,
            pagelen,
          });

          if (!data.values || data.values.length === 0) {
            break;
          }

          for (const workspace of data.values) {
            if (workspaces.length >= maxItems) {
              break;
            }

            workspaces.push({
              slug: workspace.slug,
              name: workspace.name,
              uuid: workspace.uuid,
            });
          }

          if (!data.next) {
            break;
          }
          page++;
        }

        return workspaces;
      } catch (error: unknown) {
        throw mapBitbucketError(error);
      }
    });
  }

  private async client(): Promise<any> {
    if (this.bitbucket) {
      return this.bitbucket;
    }

    try {
      const { Bitbucket } = await import("bitbucket");

      const config: any = {
        baseUrl: this.opts.baseUrl || "https://api.bitbucket.org/2.0",
        notice: false, // Disable notices
      };

      // Handle auth variants
      if (this.bb.auth.kind === "basic") {
        config.auth = {
          username: this.bb.auth.username,
          password: this.bb.auth.password,
        };
      } else if (this.bb.auth.kind === "oauth") {
        config.auth = {
          token: this.bb.auth.token,
        };
      } else {
        throw new Error(`Unsupported Bitbucket auth kind: ${(this.bb.auth as any).kind}`);
      }

      this.bitbucket = new Bitbucket(config);
      return this.bitbucket;
    } catch (error) {
      throw new NetworkError("Failed to initialize Bitbucket client", error);
    }
  }

  async getRepoMetadata(repoFullName: string): Promise<Repo> {
    return withRetry(async () => {
      try {
        const [workspace, repoSlug] = repoFullName.split("/");
        if (!workspace || !repoSlug) {
          throw new Error(`Invalid repository name: ${repoFullName}`);
        }

        const client = await this.client();
        const { data } = await client.repositories.get({
          workspace,
          repo_slug: repoSlug,
        });

        return {
          id: data.uuid,
          name: data.name,
          fullName: data.full_name,
          description: data.description ?? undefined,
          defaultBranch: data.mainbranch?.name || "main",
          isPrivate: data.is_private ?? false,
          webUrl: data.links?.html?.href,
          sshUrl: data.links?.clone?.find((link: any) => link.name === "ssh")?.href,
          httpUrl: data.links?.clone?.find((link: any) => link.name === "https")?.href,
        };
      } catch (error: unknown) {
        throw mapBitbucketError(error);
      }
    });
  }

  async getUserRepos(search?: string, options?: PaginationOptions): Promise<Repo[]> {
    return withRetry(async () => {
      try {
        if (this.isBitbucketCloud()) {
          // Bitbucket Cloud: requires workspace-scoped access
          if (!this.bb.workspace) {
            throw new Error(
              "Bitbucket Cloud requires a workspace parameter. " +
              "Use listWorkspaces() to discover available workspaces, then provide one in the constructor."
            );
          }

          // For cloud, get repos from the specified workspace
          return this.getOrganizationRepos(this.bb.workspace, search, options);
        } else {
          // Self-hosted Bitbucket: use global repository listing (similar to GitHub)
          const client = await this.client();
          const repos: Repo[] = [];
          let page = 1;
          const pagelen = Math.min(options?.perPage || 50, 100);
          const maxItems = options?.maxItems || Infinity;

          while (repos.length < maxItems) {
            // For self-hosted, use global repo listing
            const { data } = await client.repositories.list({
              role: "member",
              sort: "-updated_on",
              page,
              pagelen,
              q: search ? `name~"${search}"` : undefined,
            });

            if (!data.values || data.values.length === 0) {
              break;
            }

            for (const repo of data.values) {
              if (repos.length >= maxItems) {
                break;
              }

              repos.push({
                id: repo.uuid,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description ?? undefined,
                defaultBranch: repo.mainbranch?.name || "main",
                isPrivate: repo.is_private ?? false,
                webUrl: repo.links?.html?.href,
                sshUrl: repo.links?.clone?.find((link: any) => link.name === "ssh")?.href,
                httpUrl: repo.links?.clone?.find((link: any) => link.name === "https")?.href,
              });
            }

            if (!data.next) {
              break;
            }
            page++;
          }

          return repos;
        }
      } catch (error: unknown) {
        throw mapBitbucketError(error);
      }
    });
  }

  async getOrganizations(options?: PaginationOptions): Promise<Organization[]> {
    return withRetry(async () => {
      try {
        const client = await this.client();
        const organizations: Organization[] = [];
        let page = 1;
        const pagelen = Math.min(options?.perPage || 50, 100);
        const maxItems = options?.maxItems || Infinity;

        if (this.isBitbucketCloud()) {
          // Bitbucket Cloud: list workspaces
          while (organizations.length < maxItems) {
            const { data } = await client.workspaces.getWorkspaces({
              role: "member",
              page,
              pagelen,
            });

            if (!data.values || data.values.length === 0) {
              break;
            }

            for (const workspace of data.values) {
              if (organizations.length >= maxItems) {
                break;
              }

              organizations.push({
                id: workspace.uuid,
                name: workspace.slug,
                displayName: workspace.name,
                webUrl: workspace.links?.html?.href,
                role: "member", // Bitbucket doesn't provide granular role info easily
              });
            }

            if (!data.next) {
              break;
            }
            page++;
          }
        } else {
          // Self-hosted Bitbucket: list projects (similar to GitHub organizations)
          while (organizations.length < maxItems) {
            try {
              const { data } = await client.projects.list({
                page,
                pagelen,
              });

              if (!data.values || data.values.length === 0) {
                break;
              }

              for (const project of data.values) {
                if (organizations.length >= maxItems) {
                  break;
                }

                organizations.push({
                  id: project.uuid,
                  name: project.key,
                  displayName: project.name,
                  description: project.description,
                  webUrl: project.links?.html?.href,
                  role: "member", // Self-hosted doesn't provide detailed role info in this API
                });
              }

              if (!data.next) {
                break;
              }
              page++;
            } catch (error) {
              // If projects API is not available, return empty array
              // Some self-hosted instances might not have projects enabled
              console.warn("Projects API not available on this Bitbucket instance");
              break;
            }
          }
        }

        return organizations;
      } catch (error: unknown) {
        throw mapBitbucketError(error);
      }
    });
  }

  async getOrganizationRepos(
    organizationName: string,
    search?: string,
    options?: PaginationOptions
  ): Promise<Repo[]> {
    return withRetry(async () => {
      try {
        const client = await this.client();
        const repos: Repo[] = [];
        let page = 1;
        const pagelen = Math.min(options?.perPage || 50, 100);
        const maxItems = options?.maxItems || Infinity;

        if (this.isBitbucketCloud()) {
          // Bitbucket Cloud: workspace-scoped repositories
          while (repos.length < maxItems) {
            const { data } = await client.repositories.list({
              workspace: organizationName,
              role: "member",
              sort: "-updated_on",
              page,
              pagelen,
              q: search ? `name~"${search}"` : undefined,
            });

            if (!data.values || data.values.length === 0) {
              break;
            }

            for (const repo of data.values) {
              if (repos.length >= maxItems) {
                break;
              }

              repos.push({
                id: repo.uuid,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description ?? undefined,
                defaultBranch: repo.mainbranch?.name || "main",
                isPrivate: repo.is_private ?? false,
                webUrl: repo.links?.html?.href,
                sshUrl: repo.links?.clone?.find((link: any) => link.name === "ssh")?.href,
                httpUrl: repo.links?.clone?.find((link: any) => link.name === "https")?.href,
              });
            }

            if (!data.next) {
              break;
            }
            page++;
          }
        } else {
          // Self-hosted Bitbucket: project-scoped repositories
          while (repos.length < maxItems) {
            try {
              const { data } = await client.projects.repositories({
                project: organizationName,
                page,
                pagelen,
                q: search ? `name~"${search}"` : undefined,
              });

              if (!data.values || data.values.length === 0) {
                break;
              }

              for (const repo of data.values) {
                if (repos.length >= maxItems) {
                  break;
                }

                repos.push({
                  id: repo.uuid || repo.id,
                  name: repo.name,
                  fullName: repo.full_name || `${organizationName}/${repo.name}`,
                  description: repo.description ?? undefined,
                  defaultBranch: repo.mainbranch?.name || "main",
                  isPrivate: repo.is_private ?? false,
                  webUrl: repo.links?.html?.href,
                  sshUrl: repo.links?.clone?.find((link: any) => link.name === "ssh")?.href,
                  httpUrl: repo.links?.clone?.find((link: any) => link.name === "https")?.href,
                });
              }

              if (!data.next) {
                break;
              }
              page++;
            } catch (error) {
              // If project repos API is not available, throw a more helpful error
              throw new Error(`Cannot access repositories for project '${organizationName}'. This might be a Bitbucket Cloud workspace or the project might not exist.`);
            }
          }
        }

        return repos;
      } catch (error: unknown) {
        throw mapBitbucketError(error);
      }
    });
  }

  async getRepoBranches(repoFullName: string, options?: PaginationOptions): Promise<string[]> {
    return withRetry(async () => {
      try {
        const [workspace, repoSlug] = repoFullName.split("/");
        if (!workspace || !repoSlug) {
          throw new Error(`Invalid repository name: ${repoFullName}`);
        }

        const client = await this.client();
        const branches: string[] = [];
        let page = 1;
        const pagelen = Math.min(options?.perPage || 50, 100);
        const maxItems = options?.maxItems || Infinity;

        while (branches.length < maxItems) {
          const { data } = await client.refs.listBranches({
            workspace,
            repo_slug: repoSlug,
            page,
            pagelen,
          });

          if (!data.values || data.values.length === 0) {
            break;
          }

          for (const branch of data.values) {
            if (branches.length >= maxItems) {
              break;
            }
            branches.push(branch.name);
          }

          if (!data.next) {
            break;
          }
          page++;
        }

        return branches;
      } catch (error: unknown) {
        throw mapBitbucketError(error);
      }
    });
  }

  async getRepoTags(repoFullName: string, options?: PaginationOptions): Promise<string[]> {
    return withRetry(async () => {
      try {
        const [workspace, repoSlug] = repoFullName.split("/");
        if (!workspace || !repoSlug) {
          throw new Error(`Invalid repository name: ${repoFullName}`);
        }

        const client = await this.client();
        const tags: string[] = [];
        let page = 1;
        const pagelen = Math.min(options?.perPage || 50, 100);
        const maxItems = options?.maxItems || Infinity;

        while (tags.length < maxItems) {
          const { data } = await client.refs.listTags({
            workspace,
            repo_slug: repoSlug,
            page,
            pagelen,
            sort: "-target.date",
          });

          if (!data.values || data.values.length === 0) {
            break;
          }

          for (const tag of data.values) {
            if (tags.length >= maxItems) {
              break;
            }
            tags.push(tag.name);
          }

          if (!data.next) {
            break;
          }
          page++;
        }

        return tags;
      } catch (error: unknown) {
        throw mapBitbucketError(error);
      }
    });
  }
}

function mapBitbucketError(error: unknown): Error {
  if (error && typeof error === "object") {
    if ("status" in error) {
      const status = (error as { status: number }).status;
      const message = (error as { message?: string }).message || "Bitbucket API error";

      switch (status) {
        case 401:
          return new AuthError("Bitbucket authentication failed", error);
        case 403:
          return new AuthError("Bitbucket authorization failed", error);
        case 404:
          return new NotFoundError("Repository not found", error);
        case 429:
          return new RateLimitError(undefined, error);
        case 502:
        case 503:
        case 504:
          return new NetworkError("Bitbucket service temporarily unavailable", error);
        default:
          if (status >= 500) {
            return new NetworkError(`Bitbucket server error: ${message}`, error);
          }
          return new NetworkError(`Bitbucket API error: ${message}`, error);
      }
    }

    // Handle response wrapper structure
    if ("response" in error) {
      const response = (error as any).response;
      const status = response?.status;
      const message = response?.statusText || "Bitbucket API error";

      switch (status) {
        case 401:
          return new AuthError("Bitbucket authentication failed", error);
        case 403:
          return new AuthError("Bitbucket authorization failed", error);
        case 404:
          return new NotFoundError("Repository not found", error);
        case 429:
          return new RateLimitError(undefined, error);
        default:
          if (status >= 500) {
            return new NetworkError(`Bitbucket server error: ${message}`, error);
          }
          return new NetworkError(`Bitbucket API error: ${message}`, error);
      }
    }
  }

  if (error instanceof Error) {
    return new NetworkError(`Bitbucket request failed: ${error.message}`, error);
  }

  return new NetworkError("Unknown Bitbucket error", error);
}
