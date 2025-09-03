import { describe, it, expect, vi } from "vitest";
import { createProvider } from "./index.js";
import { ConfigurationError } from "@uni-git/core";

// Mock the provider modules
vi.mock("@uni-git/provider-github", () => ({
  GitHubProvider: class MockGitHubProvider {
    constructor(public opts: any) {}
  }
}));

vi.mock("@uni-git/provider-gitlab", () => ({
  GitLabProvider: class MockGitLabProvider {
    constructor(public opts: any) {}
  }
}));

vi.mock("@uni-git/provider-bitbucket", () => ({
  BitbucketProvider: class MockBitbucketProvider {
    constructor(public opts: any) {}
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
