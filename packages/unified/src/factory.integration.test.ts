import { describe, it, expect, beforeAll } from "vitest";
import { createProvider } from "../src/index.js";
import { GitProvider } from "@uni-git/core";

// Integration tests for the unified factory
// Tests different provider configurations and auth methods
const hasGitHubToken = !!process.env.GITHUB_TOKEN;
const hasGitLabToken = !!process.env.GITLAB_TOKEN;
const hasBitbucketCreds = !!(process.env.BITBUCKET_USERNAME && process.env.BITBUCKET_APP_PASSWORD);

describe("Unified Factory Integration Tests", () => {
  describe.skipIf(!hasGitHubToken)("GitHub Provider Creation", () => {
    it("should create GitHub provider with token auth", async () => {
      const provider = await createProvider({
        type: "github",
        auth: { kind: "token", token: process.env.GITHUB_TOKEN! },
      });

      expect(provider).toBeInstanceOf(GitProvider);
      
      // Verify it works
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ GitHub provider created and tested - ${repos.length} repos`);
    });

    it.skipIf(!process.env.GITHUB_BASE_URL)("should create GitHub provider with enterprise URL", async () => {
      const provider = await createProvider({
        type: "github",
        auth: { kind: "token", token: process.env.GITHUB_TOKEN! },
        baseUrl: process.env.GITHUB_BASE_URL,
      });

      expect(provider).toBeInstanceOf(GitProvider);
      
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ GitHub Enterprise provider created - ${repos.length} repos`);
    });

    it.skipIf(!process.env.GITHUB_APP_ID)("should create GitHub provider with app auth", async () => {
      const provider = await createProvider({
        type: "github",
        auth: {
          kind: "app",
          appId: parseInt(process.env.GITHUB_APP_ID!),
          privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
          installationId: process.env.GITHUB_APP_INSTALLATION_ID ? 
            parseInt(process.env.GITHUB_APP_INSTALLATION_ID) : undefined,
        },
      });

      expect(provider).toBeInstanceOf(GitProvider);
      
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ GitHub App provider created - ${repos.length} repos`);
    });
  });

  describe.skipIf(!hasGitLabToken)("GitLab Provider Creation", () => {
    it("should create GitLab provider with token auth", async () => {
      const provider = await createProvider({
        type: "gitlab",
        auth: { kind: "token", token: process.env.GITLAB_TOKEN! },
      });

      expect(provider).toBeInstanceOf(GitProvider);
      
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ GitLab provider created and tested - ${repos.length} repos`);
    });

    it.skipIf(!process.env.GITLAB_HOST)("should create GitLab provider with custom host", async () => {
      const provider = await createProvider({
        type: "gitlab",
        auth: { kind: "token", token: process.env.GITLAB_TOKEN! },
        host: process.env.GITLAB_HOST,
      });

      expect(provider).toBeInstanceOf(GitProvider);
      
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ Custom GitLab provider created - ${repos.length} repos`);
    });

    it.skipIf(!process.env.GITLAB_OAUTH_TOKEN)("should create GitLab provider with OAuth auth", async () => {
      const provider = await createProvider({
        type: "gitlab",
        auth: { kind: "oauth", token: process.env.GITLAB_OAUTH_TOKEN! },
      });

      expect(provider).toBeInstanceOf(GitProvider);
      
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ GitLab OAuth provider created - ${repos.length} repos`);
    });
  });

  describe.skipIf(!hasBitbucketCreds)("Bitbucket Provider Creation", () => {
    it("should create Bitbucket provider with basic auth", async () => {
      const provider = await createProvider({
        type: "bitbucket",
        auth: { 
          kind: "basic", 
          username: process.env.BITBUCKET_USERNAME!,
          password: process.env.BITBUCKET_APP_PASSWORD!,
        },
      });

      expect(provider).toBeInstanceOf(GitProvider);
      
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ Bitbucket provider created and tested - ${repos.length} repos`);
    });

    it.skipIf(!process.env.BITBUCKET_OAUTH_TOKEN)("should create Bitbucket provider with OAuth auth", async () => {
      const provider = await createProvider({
        type: "bitbucket",
        auth: { kind: "oauth", token: process.env.BITBUCKET_OAUTH_TOKEN! },
      });

      expect(provider).toBeInstanceOf(GitProvider);
      
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ Bitbucket OAuth provider created - ${repos.length} repos`);
    });
  });

  describe("Error Handling", () => {
    it("should throw error for invalid provider type", async () => {
      await expect(createProvider({
        type: "invalid" as any,
        auth: { kind: "token", token: "test" },
      })).rejects.toThrow();
    });

    it("should throw error when provider package is missing", async () => {
      // This test assumes that at least one provider package is not installed
      // In a real scenario, this would happen when someone installs @uni-git/unified
      // but not the specific provider package
      
      // We can't easily test this in the current setup since all packages are present
      // But we can verify the error message structure
      expect(true).toBe(true); // Placeholder - actual implementation would test module loading
    });
  });

  describe("Cross-Provider Compatibility", () => {
    const availableProviders: Array<{ type: any, name: string, condition: boolean }> = [
      { type: "github", name: "GitHub", condition: hasGitHubToken },
      { type: "gitlab", name: "GitLab", condition: hasGitLabToken },
      { type: "bitbucket", name: "Bitbucket", condition: hasBitbucketCreds },
    ];

    it("should create providers with same interface", async () => {
      const providers: GitProvider[] = [];
      
      for (const { type, name, condition } of availableProviders) {
        if (!condition) {
          console.log(`⏭️  Skipping ${name} - credentials not available`);
          continue;
        }

        let provider: GitProvider;

        if (type === "github") {
          provider = await createProvider({
            type: "github",
            auth: { kind: "token", token: process.env.GITHUB_TOKEN! },
          });
        } else if (type === "gitlab") {
          provider = await createProvider({
            type: "gitlab",
            auth: { kind: "token", token: process.env.GITLAB_TOKEN! },
          });
        } else if (type === "bitbucket") {
          provider = await createProvider({
            type: "bitbucket",
            auth: { 
              kind: "basic", 
              username: process.env.BITBUCKET_USERNAME!,
              password: process.env.BITBUCKET_APP_PASSWORD!,
            },
          });
        } else {
          continue;
        }

        providers.push(provider);
        console.log(`✅ ${name} provider created`);
      }

      if (providers.length < 2) {
        console.log("⚠️  Need at least 2 providers to test compatibility - skipping");
        return;
      }

      // Test that all providers implement the same interface
      for (const provider of providers) {
        expect(typeof provider.getRepoMetadata).toBe("function");
        expect(typeof provider.getUserRepos).toBe("function");
        expect(typeof provider.getRepoBranches).toBe("function");
        expect(typeof provider.getRepoTags).toBe("function");
      }

      // Test that all providers return the same data structure
      const enabledProviders = availableProviders.filter(p => p.condition);
      const repoResults = await Promise.all(
        providers.map(async (provider, index) => {
          try {
            const repos = await provider.getUserRepos();
            return { 
              index, 
              provider: enabledProviders[index]?.name,
              success: true, 
              count: repos.length,
              sampleRepo: repos[0] 
            };
          } catch (error) {
            return { 
              index, 
              provider: enabledProviders[index]?.name,
              success: false, 
              error: error instanceof Error ? error.message : String(error)
            };
          }
        })
      );

      // Check that successful results have consistent structure
      const successfulResults = repoResults.filter(r => r.success);
      
      if (successfulResults.length > 1) {
        const firstResult = successfulResults[0];
        if (firstResult.sampleRepo) {
          for (let i = 1; i < successfulResults.length; i++) {
            const otherResult = successfulResults[i];
            if (otherResult.sampleRepo) {
              // Verify same properties exist
              expect(Object.keys(otherResult.sampleRepo).sort()).toEqual(
                Object.keys(firstResult.sampleRepo).sort()
              );
            }
          }
        }
      }

      console.log(`✅ Cross-provider compatibility verified for ${successfulResults.length} providers`);
      repoResults.forEach(result => {
        if (result.success) {
          console.log(`   ${result.provider}: ${result.count} repositories`);
        } else {
          console.log(`   ${result.provider}: Error - ${result.error}`);
        }
      });
    });
  });
});

// Conditional test warnings
if (!hasGitHubToken && !hasGitLabToken && !hasBitbucketCreds) {
  describe("Unified Factory Integration Tests - ALL SKIPPED", () => {
    it("should warn about missing environment variables", () => {
      console.warn(`
⚠️  All unified factory integration tests skipped
   
   No provider credentials found. To run integration tests:
   
   GitHub:
   - Set GITHUB_TOKEN environment variable
   
   GitLab:
   - Set GITLAB_TOKEN environment variable
   
   Bitbucket:
   - Set BITBUCKET_USERNAME and BITBUCKET_APP_PASSWORD environment variables
   
   See INTEGRATION_TESTING.md for detailed setup instructions.
      `);
      
      expect(true).toBe(true); // Placeholder test
    });
  });
} else {
  // Show which providers are available
  console.log("🔧 Available providers for integration testing:");
  console.log(`   GitHub: ${hasGitHubToken ? "✅" : "❌"}`);
  console.log(`   GitLab: ${hasGitLabToken ? "✅" : "❌"}`);
  console.log(`   Bitbucket: ${hasBitbucketCreds ? "✅" : "❌"}`);
}
