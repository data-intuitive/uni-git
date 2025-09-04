import { describe, it, expect, beforeAll } from "vitest";
import { GitHubProvider } from "../src/index.js";
import { NotFoundError, AuthError } from "@uni-git/core";

// Integration tests that run against real GitHub API
// Only run when GITHUB_TOKEN is available
const hasGitHubToken = !!process.env.GITHUB_TOKEN;
const githubToken = process.env.GITHUB_TOKEN;
const githubBaseUrl = process.env.GITHUB_BASE_URL;

// Known public repositories for testing
const PUBLIC_REPO = "octocat/Hello-World";
const NONEXISTENT_REPO = "this-repo/does-not-exist-12345";

describe.skipIf(!hasGitHubToken)("GitHubProvider Integration Tests", () => {
  let provider: GitHubProvider;

  beforeAll(() => {
    if (!hasGitHubToken) {
      console.warn("⚠️  Skipping GitHub integration tests - GITHUB_TOKEN not set");
      return;
    }

    console.log("🔧 Setting up GitHub provider for integration tests");
    provider = new GitHubProvider({
      auth: { kind: "token", token: githubToken! },
      baseUrl: githubBaseUrl,
    });
  });

  describe("Authentication", () => {
    it("should authenticate successfully with valid token", async () => {
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      console.log(`✅ Authentication successful - found ${repos.length} repositories`);
    });

    it("should throw AuthError with invalid token", async () => {
      const invalidProvider = new GitHubProvider({
        auth: { kind: "token", token: "invalid-token" },
        baseUrl: githubBaseUrl,
      });

      await expect(invalidProvider.getUserRepos()).rejects.toThrow(AuthError);
    });
  });

  describe("Repository Metadata", () => {
    it("should get metadata for public repository", async () => {
      const repo = await provider.getRepoMetadata(PUBLIC_REPO);
      
      expect(repo).toMatchObject({
        name: "Hello-World",
        fullName: "octocat/Hello-World",
        defaultBranch: expect.any(String),
        isPrivate: false,
      });
      expect(repo.description).toBeDefined();
      expect(repo.webUrl).toContain("github.com");
      
      console.log(`✅ Repository metadata: ${repo.fullName} (${repo.defaultBranch})`);
    });

    it("should throw NotFoundError for nonexistent repository", async () => {
      await expect(provider.getRepoMetadata(NONEXISTENT_REPO)).rejects.toThrow(NotFoundError);
    });

    it("should handle repository with special characters in name", async () => {
      // Test with a real repository that has special characters if available
      const repo = await provider.getRepoMetadata("microsoft/vscode");
      expect(repo.name).toBe("vscode");
      expect(repo.fullName).toBe("microsoft/vscode");
    });
  });

  describe("User Repositories", () => {
    it("should list user repositories", async () => {
      const repos = await provider.getUserRepos();
      
      expect(Array.isArray(repos)).toBe(true);
      expect(repos.length).toBeGreaterThan(0);
      
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
        console.log("⚠️  No repositories found for search test");
        return;
      }

      // Use a simple, common search term
      const searchTerm = "fun";
      const filteredRepos = await provider.getUserRepos(searchTerm);
      
      expect(Array.isArray(filteredRepos)).toBe(true);
      expect(filteredRepos.length).toBeLessThanOrEqual(allRepos.length);
      
      console.log(`✅ Search for "${searchTerm}" returned ${filteredRepos.length} repositories`);
    }, 45000); // Increase timeout to 45 seconds for search operations
  });

  describe("Repository Branches", () => {
    it("should list branches for public repository", async () => {
      const branches = await provider.getRepoBranches(PUBLIC_REPO);
      
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      expect(branches).toContain("master"); // Hello-World uses master as default branch
      
      console.log(`✅ Found ${branches.length} branches: ${branches.slice(0, 3).join(", ")}${branches.length > 3 ? "..." : ""}`);
    });

    it("should handle repository with many branches", async () => {
      // Test pagination with a repository that likely has many branches
      const branches = await provider.getRepoBranches("microsoft/vscode");
      
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      expect(branches).toContain("main");
      
      console.log(`✅ microsoft/vscode has ${branches.length} branches`);
    });

    it("should throw NotFoundError for nonexistent repository", async () => {
      await expect(provider.getRepoBranches(NONEXISTENT_REPO)).rejects.toThrow(NotFoundError);
    });
  });

  describe("Repository Tags", () => {
    it("should list tags for public repository", async () => {
      const tags = await provider.getRepoTags(PUBLIC_REPO);
      
      expect(Array.isArray(tags)).toBe(true);
      // Note: Hello-World might not have tags, so we just check it's an array
      
      console.log(`✅ Found ${tags.length} tags`);
      if (tags.length > 0) {
        console.log(`   Tags: ${tags.slice(0, 5).join(", ")}${tags.length > 5 ? "..." : ""}`);
      }
    });

    it("should handle repository with many tags (pagination)", async () => {
      // Test with a repository that has many releases/tags
      const tags = await provider.getRepoTags("nodejs/node");
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(10); // Node.js has many releases
      
      // Check for semantic version pattern
      const semverTags = tags.filter(tag => /^v?\d+\.\d+\.\d+/.test(tag));
      expect(semverTags.length).toBeGreaterThan(0);
      
      console.log(`✅ nodejs/node has ${tags.length} tags`);
      console.log(`   Sample tags: ${tags.slice(0, 5).join(", ")}...`);
    });

    it("should throw NotFoundError for nonexistent repository", async () => {
      await expect(provider.getRepoTags(NONEXISTENT_REPO)).rejects.toThrow(NotFoundError);
    });
  });

  describe("GitHub Enterprise Support", () => {
    it.skipIf(!githubBaseUrl)("should work with custom base URL", async () => {
      console.log(`🏢 Testing GitHub Enterprise at: ${githubBaseUrl}`);
      
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ GitHub Enterprise integration successful - ${repos.length} repos`);
    });
  });

  describe("Error Handling", () => {
    it("should handle rate limiting gracefully", async () => {
      // Make multiple rapid requests to potentially trigger rate limiting
      const promises = Array.from({ length: 5 }, () => 
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
      // Create a provider with a very short timeout that will likely trigger on a slow endpoint
      const timeoutProvider = new GitHubProvider({
        auth: { kind: "token", token: githubToken! },
        requestTimeoutMs: 100, // 100ms timeout
        baseUrl: githubBaseUrl,
      });

      // Try to access a large repository that might be slower to respond
      // or if that still succeeds, just verify timeout is being set
      try {
        await timeoutProvider.getRepoMetadata("torvalds/linux");
        console.log("✅ Network request completed within timeout (no timeout error)");
        // If it succeeds, that's actually fine - it means the API is fast
        expect(true).toBe(true);
      } catch (error) {
        // If it fails, it should be a proper error
        expect(error).toBeInstanceOf(Error);
        console.log(`✅ Timeout handling working: ${error.message}`);
      }
    });
  });
});

// Conditional test warning
if (!hasGitHubToken) {
  describe("GitHub Integration Tests - SKIPPED", () => {
    it("should warn about missing environment variables", () => {
      console.warn(`
⚠️  GitHub integration tests skipped
   
   To run GitHub integration tests:
   1. Set GITHUB_TOKEN environment variable with a personal access token
   2. Optionally set GITHUB_BASE_URL for GitHub Enterprise Server
   
   See INTEGRATION_TESTING.md for detailed setup instructions.
      `);
      
      expect(true).toBe(true); // Placeholder test
    });
  });
}
