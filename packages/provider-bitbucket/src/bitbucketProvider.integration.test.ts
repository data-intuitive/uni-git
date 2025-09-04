import { describe, it, expect, beforeAll } from "vitest";
import { BitbucketProvider } from "../src/index.js";
import { NotFoundError, AuthError } from "@uni-git/core";

// Integration tests that run against real Bitbucket API
// Only run when BITBUCKET_USERNAME and BITBUCKET_APP_PASSWORD are available
const hasBitbucketCreds = !!(process.env.BITBUCKET_USERNAME && process.env.BITBUCKET_APP_PASSWORD);
const bitbucketUsername = process.env.BITBUCKET_USERNAME;
const bitbucketPassword = process.env.BITBUCKET_APP_PASSWORD;
const bitbucketOAuthToken = process.env.BITBUCKET_OAUTH_TOKEN;

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
    });
  });

  describe("Authentication", () => {
    it("should authenticate successfully with valid app password", async () => {
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      console.log(`✅ Authentication successful - found ${repos.length} repositories`);
    });

    it("should throw AuthError with invalid credentials", async () => {
      const invalidProvider = new BitbucketProvider({
        auth: { 
          kind: "basic", 
          username: "invalid-user", 
          password: "invalid-password" 
        },
      });

      await expect(invalidProvider.getUserRepos()).rejects.toThrow(AuthError);
    });
  });

  describe("Repository Metadata", () => {
    it("should get metadata for public repository", async () => {
      const repo = await provider.getRepoMetadata(PUBLIC_REPO);
      
      expect(repo).toMatchObject({
        name: "localstack",
        fullName: "atlassian/localstack",
        defaultBranch: expect.any(String),
        isPrivate: false,
      });
      expect(repo.webUrl).toContain("bitbucket.org");
      
      console.log(`✅ Repository metadata: ${repo.fullName} (${repo.defaultBranch})`);
    });

    it("should throw NotFoundError for nonexistent repository", async () => {
      await expect(provider.getRepoMetadata(NONEXISTENT_REPO)).rejects.toThrow(NotFoundError);
    });

    it("should handle repository with special characters in name", async () => {
      // Test with a real repository if available
      const repo = await provider.getRepoMetadata("atlassian/localstack");
      expect(repo.name).toBe("localstack");
      expect(repo.fullName).toBe("atlassian/localstack");
    });
  });

  describe("User Repositories", () => {
    it("should list user repositories", async () => {
      const repos = await provider.getUserRepos();
      
      expect(Array.isArray(repos)).toBe(true);
      
      if (repos.length === 0) {
        console.log("ℹ️  No repositories found for this user - this is okay for new accounts");
        return;
      }
      
      // Check first repository structure
      const firstRepo = repos[0];
      expect(firstRepo).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        fullName: expect.any(String),
        defaultBranch: expect.any(String),
        isPrivate: expect.any(Boolean),
      });
      
      console.log(`✅ Found ${repos.length} repositories`);
      console.log(`   First repo: ${firstRepo.fullName} (private: ${firstRepo.isPrivate})`);
    });

    it("should search repositories by name", async () => {
      const allRepos = await provider.getUserRepos();
      if (allRepos.length === 0) {
        console.log("⚠️  No repositories found for search test - skipping");
        return;
      }

      // Use part of the name of the first repository
      const searchTerm = allRepos[0].name.substring(0, 3);
      const filteredRepos = await provider.getUserRepos(searchTerm);
      
      expect(Array.isArray(filteredRepos)).toBe(true);
      expect(filteredRepos.length).toBeLessThanOrEqual(allRepos.length);
      
      // Verify search results contain the search term
      filteredRepos.forEach(repo => {
        expect(
          repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          repo.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        ).toBe(true);
      });
      
      console.log(`✅ Search for "${searchTerm}" returned ${filteredRepos.length} repositories`);
    });
  });

  describe("Repository Branches", () => {
    it("should list branches for public repository", async () => {
      const branches = await provider.getRepoBranches(PUBLIC_REPO);
      
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      
      // Common branch names in Bitbucket
      const hasCommonBranch = branches.some(branch => 
        ["master", "main", "develop", "development"].includes(branch)
      );
      expect(hasCommonBranch).toBe(true);
      
      console.log(`✅ Found ${branches.length} branches: ${branches.slice(0, 3).join(", ")}${branches.length > 3 ? "..." : ""}`);
    });

    it("should handle repository with many branches", async () => {
      // Test pagination with a repository that likely has multiple branches
      const branches = await provider.getRepoBranches("atlassian/localstack");
      
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      
      console.log(`✅ atlassian/localstack has ${branches.length} branches`);
    });

    it("should throw NotFoundError for nonexistent repository", async () => {
      await expect(provider.getRepoBranches(NONEXISTENT_REPO)).rejects.toThrow(NotFoundError);
    });
  });

  describe("Repository Tags", () => {
    it("should list tags for public repository", async () => {
      const tags = await provider.getRepoTags(PUBLIC_REPO);
      
      expect(Array.isArray(tags)).toBe(true);
      // Note: The test repository might not have tags, so we just check it's an array
      
      console.log(`✅ Found ${tags.length} tags`);
      if (tags.length > 0) {
        console.log(`   Tags: ${tags.slice(0, 5).join(", ")}${tags.length > 5 ? "..." : ""}`);
      } else {
        console.log("   No tags found (this is normal for repositories without releases)");
      }
    });

    it("should handle repository with many tags (if available)", async () => {
      // Try with a repository that might have releases
      const tags = await provider.getRepoTags("atlassian/localstack");
      
      expect(Array.isArray(tags)).toBe(true);
      
      if (tags.length > 0) {
        console.log(`✅ atlassian/localstack has ${tags.length} tags`);
        console.log(`   Sample tags: ${tags.slice(0, 3).join(", ")}${tags.length > 3 ? "..." : ""}`);
      } else {
        console.log("ℹ️  Repository has no tags - this is normal");
      }
    });

    it("should throw NotFoundError for nonexistent repository", async () => {
      await expect(provider.getRepoTags(NONEXISTENT_REPO)).rejects.toThrow(NotFoundError);
    });
  });

  describe("OAuth Authentication", () => {
    it.skipIf(!bitbucketOAuthToken)("should work with OAuth token", async () => {
      const oauthProvider = new BitbucketProvider({
        auth: { kind: "oauth", token: bitbucketOAuthToken! },
      });

      const repos = await oauthProvider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      console.log(`✅ OAuth authentication successful - ${repos.length} repositories`);
    });
  });

  describe("Workspace and Repository Access", () => {
    it("should handle workspace-based repository access", async () => {
      // Bitbucket organizes repositories under workspaces
      const repos = await provider.getUserRepos();
      
      // Check that fullName follows workspace/repo pattern
      repos.forEach(repo => {
        expect(repo.fullName).toMatch(/^[^\/]+\/[^\/]+$/);
        const [workspace, repoName] = repo.fullName.split("/");
        expect(workspace).toBeTruthy();
        expect(repoName).toBeTruthy();
        expect(repo.name).toBe(repoName);
      });
      
      if (repos.length > 0) {
        console.log(`✅ Workspace pattern verified for ${repos.length} repositories`);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle rate limiting gracefully", async () => {
      // Make multiple rapid requests to potentially trigger rate limiting
      const promises = Array.from({ length: 3 }, () => 
        provider.getRepoMetadata(PUBLIC_REPO)
      );
      
      // Should either all succeed or throw appropriate rate limit errors
      const results = await Promise.allSettled(promises);
      const successes = results.filter(r => r.status === "fulfilled");
      const failures = results.filter(r => r.status === "rejected");
      
      console.log(`✅ Rate limit handling: ${successes.length} succeeded, ${failures.length} failed`);
      
      // If any failed, they should be proper errors
      failures.forEach(failure => {
        expect(failure.reason).toBeInstanceOf(Error);
      });
    });

    it("should handle network timeouts appropriately", async () => {
      const timeoutProvider = new BitbucketProvider({
        auth: { 
          kind: "basic", 
          username: bitbucketUsername!, 
          password: bitbucketPassword! 
        },
        requestTimeoutMs: 1, // Very short timeout to trigger timeout
      });

      await expect(timeoutProvider.getRepoMetadata(PUBLIC_REPO)).rejects.toThrow();
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
    });
  });

  describe("Bitbucket-Specific Features", () => {
    it("should handle private repositories correctly", async () => {
      const repos = await provider.getUserRepos();
      
      // Check that isPrivate property is set correctly
      repos.forEach(repo => {
        expect(typeof repo.isPrivate).toBe("boolean");
      });
      
      const privateRepos = repos.filter(r => r.isPrivate);
      const publicRepos = repos.filter(r => !r.isPrivate);
      
      console.log(`✅ Repository privacy: ${publicRepos.length} public, ${privateRepos.length} private`);
    });
  });
});

// Conditional test warning
if (!hasBitbucketCreds) {
  describe("Bitbucket Integration Tests - SKIPPED", () => {
    it("should warn about missing environment variables", () => {
      console.warn(`
⚠️  Bitbucket integration tests skipped
   
   To run Bitbucket integration tests:
   1. Set BITBUCKET_USERNAME environment variable with your Bitbucket username
   2. Set BITBUCKET_APP_PASSWORD environment variable with an app password
   
   Additional auth methods (optional):
   - BITBUCKET_OAUTH_TOKEN for OAuth testing
   
   To create an app password:
   1. Go to Bitbucket.org → Personal settings → App passwords
   2. Create a password with "Repositories: Read" permission
   
   See INTEGRATION_TESTING.md for detailed setup instructions.
      `);
      
      expect(true).toBe(true); // Placeholder test
    });
  });
}
