import { describe, it, expect, vi, beforeEach } from "vitest";
import { BitbucketProvider } from "./index.js";

// Mock the bitbucket module
vi.mock("bitbucket", () => ({
  Bitbucket: vi.fn().mockImplementation(() => ({
    repositories: {
      get: vi.fn(),
      list: vi.fn(),
    },
    workspaces: {
      list: vi.fn(),
    },
    projects: {
      list: vi.fn(),
      repositories: vi.fn(),
    },
    refs: {
      listBranches: vi.fn(),
      listTags: vi.fn(),
    },
  })),
}));

describe("BitbucketProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create provider with basic auth", () => {
    const provider = new BitbucketProvider({
      auth: { 
        kind: "basic", 
        username: "test-user", 
        password: "test-password" 
      },
    });
    
    expect(provider).toBeInstanceOf(BitbucketProvider);
  });

  it("should create provider without workspace parameter", () => {
    const provider = new BitbucketProvider({
      auth: { 
        kind: "basic", 
        username: "test-user", 
        password: "test-password" 
      },
    });
    
    expect(provider).toBeInstanceOf(BitbucketProvider);
  });

  it("should create provider with OAuth auth", () => {
    const provider = new BitbucketProvider({
      auth: { kind: "oauth", token: "oauth-token" },
    });
    
    expect(provider).toBeInstanceOf(BitbucketProvider);
  });

  it("should create provider with workspace for Bitbucket Cloud", () => {
    const provider = new BitbucketProvider({
      auth: { kind: "basic", username: "user", password: "pass" },
      workspace: "my-workspace",
    });
    
    expect(provider).toBeInstanceOf(BitbucketProvider);
  });

  it("should handle custom base URL for self-hosted", () => {
    const provider = new BitbucketProvider({
      auth: { kind: "basic", username: "user", password: "pass" },
      baseUrl: "https://bitbucket.company.com/api/2.0",
    });
    
    expect(provider).toBeInstanceOf(BitbucketProvider);
  });

  it("should accept provider options", () => {
    const provider = new BitbucketProvider({
      auth: { kind: "basic", username: "user", password: "pass" },
      workspace: "test-workspace",
      requestTimeoutMs: 30000,
      userAgent: "test-agent",
    });
    
    expect(provider.opts.requestTimeoutMs).toBe(30000);
    expect(provider.opts.userAgent).toBe("test-agent");
  });

  it("should handle different auth kinds", () => {
    const basicProvider = new BitbucketProvider({
      auth: { kind: "basic", username: "basic-user", password: "pass" },
    });
    
    const oauthProvider = new BitbucketProvider({
      auth: { kind: "oauth", token: "oauth-token" },
    });
    
    // Both providers should be created successfully
    expect(basicProvider).toBeInstanceOf(BitbucketProvider);
    expect(oauthProvider).toBeInstanceOf(BitbucketProvider);
  });

  describe("Organization methods", () => {
    it("should have getOrganizations method", () => {
      const provider = new BitbucketProvider({
        auth: { kind: "basic", username: "user", password: "pass" },
      });
      
      expect(typeof provider.getOrganizations).toBe("function");
    });

    it("should have getOrganizationRepos method", () => {
      const provider = new BitbucketProvider({
        auth: { kind: "basic", username: "user", password: "pass" },
      });
      
      expect(typeof provider.getOrganizationRepos).toBe("function");
    });
  });
});
