import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubProvider } from "./index.js";
import { AuthError, NotFoundError } from "@uni-git/core";

// Mock the @octokit/rest module
vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      get: vi.fn(),
      listForAuthenticatedUser: vi.fn(),
      listForOrg: vi.fn(),
      listBranches: vi.fn(),
      listTags: vi.fn(),
    },
    orgs: {
      listForAuthenticatedUser: vi.fn(),
    },
    paginate: {
      iterator: vi.fn(),
    },
  })),
}));

describe("GitHubProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create provider with token auth", () => {
    const provider = new GitHubProvider({
      auth: { kind: "token", token: "test-token" },
    });
    
    expect(provider).toBeInstanceOf(GitHubProvider);
  });

  it("should create provider with GitHub App auth", () => {
    const provider = new GitHubProvider({
      auth: {
        kind: "app",
        appId: 12345,
        privateKey: "test-key",
        installationId: 67890,
      },
    });
    
    expect(provider).toBeInstanceOf(GitHubProvider);
  });

  it("should handle GitHub Enterprise base URL", () => {
    const provider = new GitHubProvider({
      auth: { kind: "token", token: "test-token" },
      baseUrl: "https://github.enterprise.com/api/v3",
    });
    
    expect(provider).toBeInstanceOf(GitHubProvider);
  });

  it("should accept provider options", () => {
    const provider = new GitHubProvider({
      auth: { kind: "token", token: "test-token" },
      requestTimeoutMs: 30000,
      userAgent: "test-agent",
    });
    
    expect(provider.opts.requestTimeoutMs).toBe(30000);
    expect(provider.opts.userAgent).toBe("test-agent");
  });

  describe("Organization methods", () => {
    it("should have getOrganizations method", () => {
      const provider = new GitHubProvider({
        auth: { kind: "token", token: "test-token" },
      });
      
      expect(typeof provider.getOrganizations).toBe("function");
    });

    it("should have getOrganizationRepos method", () => {
      const provider = new GitHubProvider({
        auth: { kind: "token", token: "test-token" },
      });
      
      expect(typeof provider.getOrganizationRepos).toBe("function");
    });
  });
});
