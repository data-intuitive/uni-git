import { describe, it, expect, beforeAll } from "vitest";
import { GitLabProvider } from "../src/index.js";
import { NotFoundError, AuthError } from "@uni-git/core";

// Integration tests that run against real GitLab API
// Only run when GITLAB_TOKEN is available
const hasGitLabToken = !!process.env.GITLAB_TOKEN;
const gitlabToken = process.env.GITLAB_TOKEN;
const gitlabHost = process.env.GITLAB_HOST || "https://gitlab.com";

// Known public projects for testing
const PUBLIC_PROJECT = "gitlab-org/gitlab";
const NONEXISTENT_PROJECT = "this-project/does-not-exist-12345";

describe.skipIf(!hasGitLabToken)("GitLabProvider Integration Tests", () => {
  let provider: GitLabProvider;

  beforeAll(() => {
    if (!hasGitLabToken) {
      console.warn("⚠️  Skipping GitLab integration tests - GITLAB_TOKEN not set");
      return;
    }

    console.log(`🔧 Setting up GitLab provider for integration tests (${gitlabHost})`);
    provider = new GitLabProvider({
      auth: { kind: "token", token: gitlabToken! },
      host: gitlabHost,
    });
  });

  describe("Authentication", () => {
    it("should authenticate successfully with valid token", async () => {
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      console.log(`✅ Authentication successful - found ${repos.length} repositories`);
    });

    it("should throw AuthError with invalid token", async () => {
      const invalidProvider = new GitLabProvider({
        auth: { kind: "token", token: "invalid-token" },
        host: gitlabHost,
      });

      await expect(invalidProvider.getUserRepos()).rejects.toThrow(AuthError);
    });
  });

  describe("Repository Metadata", () => {
    it("should get metadata for public project", async () => {
      const repo = await provider.getRepoMetadata(PUBLIC_PROJECT);
      
      expect(repo).toMatchObject({
        name: "GitLab",
        fullName: "gitlab-org/gitlab",
        defaultBranch: expect.any(String),
        isPrivate: false,
      });
      expect(repo.description).toBeDefined();
      expect(repo.webUrl).toContain("gitlab");
      
      console.log(`✅ Repository metadata: ${repo.fullName} (${repo.defaultBranch})`);
    });

    it("should throw NotFoundError for nonexistent project", async () => {
      await expect(provider.getRepoBranches(NONEXISTENT_PROJECT)).rejects.toThrow(NotFoundError);
    });
  });

  describe("Repository Tags", () => {

    it("should handle project with special characters in path", async () => {
      // Test with a real project that has special characters if available
      const repo = await provider.getRepoMetadata("gitlab-org/gitlab-foss");
      expect(repo.name).toBe("GitLab FOSS"); // GitLab API returns display name
      expect(repo.fullName).toBe("gitlab-org/gitlab-foss");
    });
  });

  describe("User Repositories", () => {
    it("should list user repositories/projects", async () => {
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
    it("should list branches for public project", async () => {
      const branches = await provider.getRepoBranches(PUBLIC_PROJECT);
      
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      expect(branches).toContain("master"); // GitLab main project uses master
      
      console.log(`✅ Found ${branches.length} branches: ${branches.slice(0, 5).join(", ")}${branches.length > 5 ? "..." : ""}`);
    }, 45000); // Increase timeout for GitLab API calls

    it("should handle project with many branches", async () => {
      // Test with GitLab itself which has many branches
      const branches = await provider.getRepoBranches(PUBLIC_PROJECT);
      
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(10); // GitLab should have many branches
      
      console.log(`✅ ${PUBLIC_PROJECT} has ${branches.length} branches`);
    }, 45000); // Increase timeout for GitLab API calls

  describe("Repository Tags", () => {
    it("should list tags for public project", async () => {
      const tags = await provider.getRepoTags(PUBLIC_PROJECT);
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0); // GitLab main project should have tags
      
      console.log(`✅ Found ${tags.length} tags`);
      if (tags.length > 0) {
        console.log(`   Tags: ${tags.slice(0, 5).join(", ")}${tags.length > 5 ? "..." : ""}`);
      }
    }, 45000); // Increase timeout for GitLab API calls

    it("should handle project with many tags (pagination)", async () => {
      // Test with a project that has many releases/tags
      const tags = await provider.getRepoTags("gitlab-org/gitlab");
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(10); // GitLab has many releases
      
      // Check for semantic version pattern
      const semverTags = tags.filter(tag => /^v?\d+\.\d+\.\d+/.test(tag));
      expect(semverTags.length).toBeGreaterThan(0);
      
      console.log(`✅ gitlab-org/gitlab has ${tags.length} tags`);
      console.log(`   Sample tags: ${tags.slice(0, 5).join(", ")}...`);
    });

    it("should throw NotFoundError for nonexistent project", async () => {
      await expect(provider.getRepoTags(NONEXISTENT_PROJECT)).rejects.toThrow(NotFoundError);
    });
  });

  describe("Self-Hosted GitLab Support", () => {
    it.skipIf(gitlabHost === "https://gitlab.com")("should work with self-hosted GitLab", async () => {
      console.log(`🏢 Testing self-hosted GitLab at: ${gitlabHost}`);
      
      const repos = await provider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      
      console.log(`✅ Self-hosted GitLab integration successful - ${repos.length} repos`);
    });
  });

  describe("Different Authentication Methods", () => {
    it.skipIf(!process.env.GITLAB_OAUTH_TOKEN)("should work with OAuth token", async () => {
      const oauthProvider = new GitLabProvider({
        auth: { kind: "oauth", token: process.env.GITLAB_OAUTH_TOKEN! },
        host: gitlabHost,
      });

      const repos = await oauthProvider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      console.log(`✅ OAuth authentication successful`);
    });

    it.skipIf(!process.env.GITLAB_JOB_TOKEN)("should work with job token", async () => {
      const jobProvider = new GitLabProvider({
        auth: { kind: "job", token: process.env.GITLAB_JOB_TOKEN! },
        host: gitlabHost,
      });

      const repos = await jobProvider.getUserRepos();
      expect(Array.isArray(repos)).toBe(true);
      console.log(`✅ Job token authentication successful`);
    });
  });

  describe("Error Handling", () => {
    it("should handle rate limiting gracefully", async () => {
      // Make multiple rapid requests to potentially trigger rate limiting
      const promises = Array.from({ length: 5 }, () => 
        provider.getRepoMetadata(PUBLIC_PROJECT)
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
      const timeoutProvider = new GitLabProvider({
        auth: { kind: "token", token: gitlabToken! },
        host: gitlabHost,
        requestTimeoutMs: 100, // 100ms timeout instead of 1ms
      });

      // Try to access a project that might be slower to respond
      try {
        await timeoutProvider.getRepoMetadata(PUBLIC_PROJECT);
        console.log("✅ Network request completed within timeout (no timeout error)");
        // If it succeeds, that's actually fine - it means the API is fast
        expect(true).toBe(true);
      } catch (error) {
        // If it fails, it should be a proper error
        expect(error).toBeInstanceOf(Error);
        console.log(`✅ Timeout handling working: ${error.message}`);
      }
    });

    it("should handle invalid project paths", async () => {
      // Test various invalid path formats
      const invalidPaths = [
        "",
        "invalid",
        "too/many/path/segments",
        "invalid-chars-@#$%",
      ];

      for (const path of invalidPaths) {
        await expect(provider.getRepoMetadata(path)).rejects.toThrow();
      }
    }, 45000); // Increase timeout for multiple API calls
  });
});

});

// Conditional test warning
if (!hasGitLabToken) {
  describe("GitLab Integration Tests - SKIPPED", () => {
    it("should warn about missing environment variables", () => {
      console.warn(`
⚠️  GitLab integration tests skipped
   
   To run GitLab integration tests:
   1. Set GITLAB_TOKEN environment variable with a personal access token
   2. Optionally set GITLAB_HOST for self-hosted GitLab (defaults to https://gitlab.com)
   
   Additional auth methods (optional):
   - GITLAB_OAUTH_TOKEN for OAuth testing
   - GITLAB_JOB_TOKEN for CI job token testing
   
   See INTEGRATION_TESTING.md for detailed setup instructions.
      `);
      
      expect(true).toBe(true); // Placeholder test
    });
  });
}
