import { GitProvider, GitHubAuth, GitLabAuth, BitbucketAuth, ProviderOptions, ConfigurationError, Organization } from "@uni-git/core";

export type ProviderType = "github" | "gitlab" | "bitbucket";

export type UnifiedProviderConfig =
  | {
      type: "github";
      auth: GitHubAuth;
      baseUrl?: string;
    } & ProviderOptions
  | {
      type: "gitlab";
      auth: GitLabAuth;
      host?: string;
    } & ProviderOptions
  | {
      type: "bitbucket";
      auth: BitbucketAuth;
      workspace?: string; // Required for Bitbucket Cloud, optional for self-hosted
    } & ProviderOptions;

/**
 * Factory function to create a provider instance based on configuration
 */
export async function createProvider(config: UnifiedProviderConfig): Promise<GitProvider> {
  switch (config.type) {
    case "github": {
      try {
        const { GitHubProvider } = await import("@uni-git/provider-github");
        const options: any = {
          auth: config.auth,
        };
        if (config.baseUrl) options.baseUrl = config.baseUrl;
        if (config.userAgent) options.userAgent = config.userAgent;
        if (config.requestTimeoutMs) options.requestTimeoutMs = config.requestTimeoutMs;
        
        return new GitHubProvider(options);
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "MODULE_NOT_FOUND") {
          throw new ConfigurationError(
            "GitHub provider not available. Install @uni-git/provider-github and its peer dependencies (@octokit/rest, @octokit/auth-app).",
            error
          );
        }
        throw error;
      }
    }

    case "gitlab": {
      try {
        const { GitLabProvider } = await import("@uni-git/provider-gitlab");
        const options: any = {
          auth: config.auth,
        };
        if (config.host) options.host = config.host;
        if (config.baseUrl) options.baseUrl = config.baseUrl;
        if (config.userAgent) options.userAgent = config.userAgent;
        if (config.requestTimeoutMs) options.requestTimeoutMs = config.requestTimeoutMs;
        
        return new GitLabProvider(options);
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "MODULE_NOT_FOUND") {
          throw new ConfigurationError(
            "GitLab provider not available. Install @uni-git/provider-gitlab and its peer dependencies (@gitbeaker/rest).",
            error
          );
        }
        throw error;
      }
    }

    case "bitbucket": {
      try {
        const { BitbucketProvider } = await import("@uni-git/provider-bitbucket");
        const options: any = {
          auth: config.auth,
        };
        if (config.workspace) options.workspace = config.workspace;
        if (config.baseUrl) options.baseUrl = config.baseUrl;
        if (config.userAgent) options.userAgent = config.userAgent;
        if (config.requestTimeoutMs) options.requestTimeoutMs = config.requestTimeoutMs;
        
        return new BitbucketProvider(options);
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "MODULE_NOT_FOUND") {
          throw new ConfigurationError(
            "Bitbucket provider not available. Install @uni-git/provider-bitbucket and its peer dependencies (bitbucket).",
            error
          );
        }
        throw error;
      }
    }

    default:
      throw new ConfigurationError(`Unsupported provider type: ${(config as any).type}`);
  }
}

/**
 * Convenience function to create a provider and automatically discover available organizations/workspaces
 * Returns both the provider and a list of discovered organizations
 */
export async function createProviderWithOrganizations(config: UnifiedProviderConfig): Promise<{
  provider: GitProvider;
  organizations: Organization[];
}> {
  const provider = await createProvider(config);
  
  try {
    const organizations = await provider.getOrganizations();
    return { provider, organizations };
  } catch (error) {
    // If organization discovery fails, return provider with empty organizations
    console.warn(`Warning: Could not discover organizations: ${error instanceof Error ? error.message : String(error)}`);
    return { provider, organizations: [] };
  }
}
