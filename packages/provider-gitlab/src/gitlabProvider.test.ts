import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitLabProvider } from "./index.js";

// Mock the @gitbeaker/rest module
vi.mock("@gitbeaker/rest", () => ({
  Gitlab: vi.fn().mockImplementation(() => ({
    Projects: {
      show: vi.fn(),
      all: vi.fn(),
    },
    Branches: {
      all: vi.fn(),
    },
    Tags: {
      all: vi.fn(),
    },
  })),
}));

describe("GitLabProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create provider with token auth", () => {
    const provider = new GitLabProvider({
      auth: { kind: "token", token: "test-token" },
    });
    
    expect(provider).toBeInstanceOf(GitLabProvider);
  });

  it("should create provider with OAuth auth", () => {
    const provider = new GitLabProvider({
      auth: { kind: "oauth", token: "oauth-token" },
    });
    
    expect(provider).toBeInstanceOf(GitLabProvider);
  });

  it("should create provider with job token auth", () => {
    const provider = new GitLabProvider({
      auth: { kind: "job", token: "job-token" },
    });
    
    expect(provider).toBeInstanceOf(GitLabProvider);
  });

  it("should handle self-hosted GitLab", () => {
    const provider = new GitLabProvider({
      auth: { kind: "token", token: "test-token" },
      host: "https://gitlab.company.com",
    });
    
    expect(provider).toBeInstanceOf(GitLabProvider);
  });

  it("should accept provider options", () => {
    const provider = new GitLabProvider({
      auth: { kind: "token", token: "test-token" },
      requestTimeoutMs: 30000,
      userAgent: "test-agent",
    });
    
    expect(provider.opts.requestTimeoutMs).toBe(30000);
    expect(provider.opts.userAgent).toBe("test-agent");
  });
});
