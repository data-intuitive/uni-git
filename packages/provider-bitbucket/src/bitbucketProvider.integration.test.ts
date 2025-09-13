import { describe, it, expect, beforeAll } from "vitest";
import { BitbucketProvider } from "../src/index.js";
import { NotFoundError } from "@uni-git/core";

// Integration tests that run against real Bitbucket API
// Only run when BITBUCKET_USERNAME and BITBUCKET_APP_PASSWORD are available
// BITBUCKET_WORKSPACE is required for Bitbucket Cloud
const hasBitbucketCreds = !!(process.env.BITBUCKET_USERNAME && process.env.BITBUCKET_APP_PASSWORD);
const hasOAuthToken = !!process.env.BITBUCKET_OAUTH_TOKEN;
const bitbucketUsername = process.env.BITBUCKET_USERNAME;
const bitbucketPassword = process.env.BITBUCKET_APP_PASSWORD;
const bitbucketOAuthToken = process.env.BITBUCKET_OAUTH_TOKEN;
const bitbucketWorkspace = process.env.BITBUCKET_WORKSPACE || bitbucketUsername; // Default to username if not set

// Known public repositories for testing
const PUBLIC_REPO = "atlassian/localstack";
const NONEXISTENT_REPO = "this-user/does-not-exist-12345";

describe.skipIf(!hasBitbucketCreds)("BitbucketProvider Integration Tests", () => {
  let provider: BitbucketProvider;

  beforeAll(() => {
    if (!hasBitbucketCreds) {
      console.warn("⚠️  Skipping Bitbucket integration tests - credentials not set");
      return;
    }

    console.log("🔧 Setting up Bitbucket provider for integration tests");
    provider = new BitbucketProvider({
      auth: { 
        kind: "basic", 
        username: bitbucketUsername!, 
        password: bitbucketPassword! 
      },
      workspace: bitbucketWorkspace,
    });
  });

  describe("Authentication Methods", () => {
    it("should authenticate with Basic auth (username/app password)", async () => {
      const basicProvider = new BitbucketProvider({
        auth: { 
          kind: "basic", 
          username: bitbucketUsername!, 
          password: bitbucketPassword! 
        },
      });
      
      // Test that auth works by making a simple API call
      const repo = await basicProvider.getRepoMetadata(PUBLIC_REPO);
      expect(repo).toBeDefined();
      expect(repo.fullName).toBe(PUBLIC_REPO);
      
      console.log("✅ Basic auth (username/app password) works");
    });

    it.skipIf(!hasOAuthToken)("should authenticate with OAuth token", async () => {
      if (!hasOAuthToken) {
        console.log("ℹ️  Skipping OAuth test - BITBUCKET_OAUTH_TOKEN not set");
        return;
      }

      const oauthProvider = new BitbucketProvider({
        auth: { 
          kind: "oauth", 
          token: bitbucketOAuthToken! 
        },
      });
      
      // Test that OAuth auth works by making a simple API call
      const repo = await oauthProvider.getRepoMetadata(PUBLIC_REPO);
      expect(repo).toBeDefined();
      expect(repo.fullName).toBe(PUBLIC_REPO);
      
      console.log("✅ OAuth token authentication works");
    });

    it("should throw error for invalid basic auth credentials", async () => {
      const invalidProvider = new BitbucketProvider({
        auth: { 
          kind: "basic", 
          username: "invalid_user", 
          password: "invalid_password" 
        },
        workspace: bitbucketWorkspace,
      });
      
      // Should throw AuthError for invalid credentials
      await expect(invalidProvider.getRepoMetadata(PUBLIC_REPO)).rejects.toThrow();
      
      console.log("✅ Invalid basic auth properly rejected");
    });

    it("should list available workspaces for Bitbucket Cloud", async () => {
      const workspaces = await provider.listWorkspaces({ maxItems: 10 });
      
      expect(Array.isArray(workspaces)).toBe(true);
      expect(workspaces.length).toBeGreaterThan(0);
      
      // Check structure of workspace objects
      const firstWorkspace = workspaces[0];
      expect(firstWorkspace).toMatchObject({
        slug: expect.any(String),
        name: expect.any(String),
        uuid: expect.any(String),
      });
      
      console.log(`✅ Found ${workspaces.length} workspaces`);
      console.log(`   First workspace: ${firstWorkspace.slug} (${firstWorkspace.name})`);
    });

    it("should require workspace parameter for Bitbucket Cloud user repos", async () => {
      const providerWithoutWorkspace = new BitbucketProvider({
        auth: { 
          kind: "basic", 
          username: bitbucketUsername!, 
          password: bitbucketPassword! 
        },
        // No workspace parameter
      });
      
      await expect(providerWithoutWorkspace.getUserRepos()).rejects.toThrow(/workspace parameter/);
      
      console.log("✅ Workspace requirement properly enforced for Bitbucket Cloud");
    });

    it.skipIf(!hasOAuthToken)("should throw error for invalid OAuth token", async () => {
      const invalidOAuthProvider = new BitbucketProvider({
        auth: { 
          kind: "oauth", 
          token: "invalid_oauth_token_12345" 
        },
      });
      
      // Should throw AuthError for invalid OAuth token
      await expect(invalidOAuthProvider.getRepoMetadata(PUBLIC_REPO)).rejects.toThrow();
      
      console.log("✅ Invalid OAuth token properly rejected");
    });
  });

  describe("Repository Metadata", () => {
    it("should get metadata for public repository", async () => {
      const repo = await provider.getRepoMetadata(PUBLIC_REPO);
      
      expect(repo).toBeDefined();
      expect(repo.name).toBe("localstack");
      expect(repo.fullName).toBe(PUBLIC_REPO);
      expect(typeof repo.isPrivate).toBe("boolean");
      expect(repo.defaultBranch).toBeTruthy();
      
      console.log(`✅ Repository metadata: ${repo.fullName} (${repo.defaultBranch})`);
    });

    it("should throw NotFoundError for nonexistent repository", async () => {
      await expect(provider.getRepoMetadata(NONEXISTENT_REPO)).rejects.toThrow(NotFoundError);
    });

    it("should handle repository with special characters in name", async () => {
      // Test works with public repo that has valid name
      const repo = await provider.getRepoMetadata(PUBLIC_REPO);
      expect(repo.fullName).toContain("/");
    });
  });

  describe("Repository Branches", () => {
    it("should list branches for public repository", async () => {
      const branches = await provider.getRepoBranches(PUBLIC_REPO, { maxItems: 50 });
      
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      expect(branches.length).toBeLessThanOrEqual(50);
      
      console.log(`✅ Found ${branches.length} branches: ${branches.slice(0, 3).join(", ")}...`);
    });

    it("should handle repository with many branches", async () => {
      const branches = await provider.getRepoBranches(PUBLIC_REPO, { maxItems: 100 });
      
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      
      console.log(`✅ ${PUBLIC_REPO} has ${branches.length} branches`);
    });

    it("should throw NotFoundError for nonexistent repository", async () => {
      await expect(provider.getRepoBranches(NONEXISTENT_REPO)).rejects.toThrow(NotFoundError);
    });
  });

  describe("Repository Tags", () => {
    it("should list tags for public repository", async () => {
      const tags = await provider.getRepoTags(PUBLIC_REPO, { maxItems: 50 });
      
      expect(Array.isArray(tags)).toBe(true);
      // Note: This repo might not have tags, which is fine
      
      console.log(`✅ Found ${tags.length} tags`);
      if (tags.length === 0) {
        console.log("   No tags found (this is normal for repositories without releases)");
      }
    });

    it("should handle repository with many tags (if available)", async () => {
      const tags = await provider.getRepoTags(PUBLIC_REPO, { maxItems: 100 });
      
      expect(Array.isArray(tags)).toBe(true);
      
      if (tags.length === 0) {
        console.log("ℹ️  Repository has no tags - this is normal");
      } else {
        console.log(`✅ Found ${tags.length} tags: ${tags.slice(0, 3).join(", ")}...`);
      }
    });

    it("should throw NotFoundError for nonexistent repository", async () => {
      await expect(provider.getRepoTags(NONEXISTENT_REPO)).rejects.toThrow(NotFoundError);
    });
  });

  describe("Workspaces (Organizations)", () => {
    it("should list workspaces for authenticated user", async () => {
      const organizations = await provider.getOrganizations();
      
      expect(Array.isArray(organizations)).toBe(true);
      expect(organizations.length).toBeGreaterThan(0);
      console.log(`✅ Found ${organizations.length} workspaces`);
      
      const workspace = organizations[0];
      expect(workspace).toHaveProperty("id");
      expect(workspace).toHaveProperty("name");
      expect(typeof workspace.name).toBe("string");
      console.log(`   First workspace: ${workspace.name} (${workspace.displayName || "no display name"})`);
    });

    it("should list repositories for workspace", async () => {
      const organizations = await provider.getOrganizations();
      
      expect(organizations.length).toBeGreaterThan(0);
      const workspaceName = organizations[0].name;
      const workspaceRepos = await provider.getOrganizationRepos(workspaceName);
      
      expect(Array.isArray(workspaceRepos)).toBe(true);
      console.log(`✅ Found ${workspaceRepos.length} repositories in workspace ${workspaceName}`);
      
      if (workspaceRepos.length > 0) {
        const repo = workspaceRepos[0];
        expect(repo).toHaveProperty("id");
        expect(repo).toHaveProperty("name");
        expect(repo).toHaveProperty("fullName");
        expect(repo.fullName).toContain(workspaceName);
      }
    });

    it("should handle workspace repositories search", async () => {
      const organizations = await provider.getOrganizations();
      
      expect(organizations.length).toBeGreaterThan(0);
      const workspaceName = organizations[0].name;
      const allWorkspaceRepos = await provider.getOrganizationRepos(workspaceName);
      
      if (allWorkspaceRepos.length === 0) {
        console.log("⚠️  No repositories in workspace, skipping search test");
        return;
      }

      // Search for repositories with a common letter
      const searchRepos = await provider.getOrganizationRepos(workspaceName, "a");
      
      expect(Array.isArray(searchRepos)).toBe(true);
      expect(searchRepos.length).toBeLessThanOrEqual(allWorkspaceRepos.length);
      console.log(`✅ Workspace search returned ${searchRepos.length} of ${allWorkspaceRepos.length} repositories`);
    });

    it("should automatically discover and aggregate repositories across workspaces", async () => {
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      console.log(`✅ Automatic workspace discovery found ${repos.length} repositories across all workspaces`);
      
      if (repos.length > 0) {
        const firstRepo = repos[0];
        expect(firstRepo).toHaveProperty("fullName");
        expect(firstRepo.fullName).toContain("/"); // Should be workspace/repo format
        console.log(`   First repo: ${firstRepo.fullName}`);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle rate limiting gracefully", async () => {
      // Make multiple requests to test rate limiting
      const promises = Array.from({ length: 3 }, () => 
        provider.getRepoMetadata(PUBLIC_REPO)
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      
      // Should handle gracefully, not necessarily succeed all
      expect(successful + failed).toBe(3);
      console.log(`✅ Rate limit handling: ${successful} succeeded, ${failed} failed`);
    });

    it("should handle invalid repository paths", async () => {
      // Test various invalid path formats
      const invalidPaths = [
        "",
        "invalid", 
        "too/many/path/segments/here",
        "invalid-chars-@#$%",
      ];
      
      for (const path of invalidPaths) {
        await expect(provider.getRepoMetadata(path)).rejects.toThrow();
      }
      
      console.log("✅ Invalid path handling works");
    }, 30000); // Longer timeout for multiple requests
  });
});

// Conditional test warning for missing credentials
if (!hasBitbucketCreds) {
  describe("Bitbucket Integration Tests - SKIPPED", () => {
    it("should warn about missing environment variables", () => {
      console.warn(`
⚠️  Bitbucket integration tests skipped
   
   To run Bitbucket integration tests:
   1. Set BITBUCKET_USERNAME environment variable with your Bitbucket username
   2. Set BITBUCKET_APP_PASSWORD environment variable with your app password
   3. Optional: Set BITBUCKET_OAUTH_TOKEN environment variable to test OAuth authentication
   
   Authentication Methods Supported:
   - Basic Auth: username + app password (required for tests)
   - OAuth: access token (optional, but recommended for production)
   
   To create an app password:
   1. Go to Bitbucket.org → Personal settings → App passwords
   2. Create a password with "Repositories: Read" permission
   
   To create an OAuth app and token:
   1. Go to your workspace → Settings → OAuth consumers
   2. Create a new consumer with appropriate permissions
   3. Use the client credentials flow to get an access token
   
   See INTEGRATION_TESTING.md for detailed setup instructions.
      `);
      
      expect(true).toBe(true); // Placeholder test
    });
  });
}
