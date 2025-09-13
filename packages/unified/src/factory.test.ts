import { describe, it, expect, vi } from "vitest";
import { createProvider, createProviderWithOrganizations } from "./index.js";
import { ConfigurationError } from "@uni-git/core";

// Mock the provider modules
vi.mock("@uni-git/provider-github", () => ({
  GitHubProvider: class MockGitHubProvider {
    constructor(public opts: any) {}
    async getOrganizations() {
      return [
        { id: '1', name: 'test-org', displayName: 'Test Organization' }
      ];
    }
  }
}));

vi.mock("@uni-git/provider-gitlab", () => ({
  GitLabProvider: class MockGitLabProvider {
    constructor(public opts: any) {}
    async getOrganizations() {
      return [
        { id: '2', name: 'test-group', displayName: 'Test Group' }
      ];
    }
  }
}));

vi.mock("@uni-git/provider-bitbucket", () => ({
  BitbucketProvider: class MockBitbucketProvider {
    constructor(public opts: any) {}
    async getOrganizations() {
      return [
        { id: '3', name: 'test-workspace', displayName: 'Test Workspace' }
      ];
    }
  }
}));

describe("createProvider", () => {
  it("should create GitHub provider", async () => {
    const provider = await createProvider({
      type: "github",
      auth: { kind: "token", token: "test-token" }
    });
    
    expect(provider).toBeDefined();
    expect(provider.constructor.name).toBe("MockGitHubProvider");
  });

  it("should create GitLab provider", async () => {
    const provider = await createProvider({
      type: "gitlab",
      auth: { kind: "token", token: "test-token" }
    });
    
    expect(provider).toBeDefined();
    expect(provider.constructor.name).toBe("MockGitLabProvider");
  });

  it("should create Bitbucket provider", async () => {
    const provider = await createProvider({
      type: "bitbucket",
      auth: { kind: "basic", username: "user", password: "pass" }
    });
    
    expect(provider).toBeDefined();
    expect(provider.constructor.name).toBe("MockBitbucketProvider");
  });

  it("should throw for unsupported provider", async () => {
    await expect(() => createProvider({
      // @ts-expect-error - testing invalid provider
      type: "invalid",
      auth: { kind: "token", token: "test" }
    })).rejects.toThrow(ConfigurationError);
  });

  it("should pass options to provider", async () => {
    const provider = await createProvider({
      type: "github",
      auth: { kind: "token", token: "test-token" },
      baseUrl: "https://api.example.com",
      requestTimeoutMs: 5000
    });
    
    expect(provider).toBeDefined();
    expect((provider as any).opts.baseUrl).toBe("https://api.example.com");
    expect((provider as any).opts.requestTimeoutMs).toBe(5000);
  });
});

describe("createProviderWithOrganizations", () => {
  it("should create provider with organizations", async () => {
    const result = await createProviderWithOrganizations({
      type: "github",
      auth: { kind: "token", token: "test-token" }
    });
    
    expect(result.provider).toBeDefined();
    expect(result.provider.constructor.name).toBe("MockGitHubProvider");
    expect(Array.isArray(result.organizations)).toBe(true);
    expect(result.organizations).toHaveLength(1);
    expect(result.organizations[0]).toEqual({
      id: '1',
      name: 'test-org',
      displayName: 'Test Organization'
    });
  });

  it("should handle organization discovery failure gracefully", async () => {
    // Mock provider that throws on getOrganizations
    vi.doMock("@uni-git/provider-gitlab", () => ({
      GitLabProvider: class MockFailingGitLabProvider {
        constructor(public opts: any) {}
        async getOrganizations() {
          throw new Error("Organization discovery failed");
        }
      }
    }));

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await createProviderWithOrganizations({
      type: "gitlab",
      auth: { kind: "token", token: "test-token" }
    });
    
    expect(result.provider).toBeDefined();
    expect(result.organizations).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Could not discover organizations:")
    );

    consoleSpy.mockRestore();
  });
});
