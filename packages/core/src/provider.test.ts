import { describe, it, expect } from "vitest";
import { GitProvider, Repo, PaginationOptions, ProviderOptions } from "../src/index.js";

class TestProvider extends GitProvider {
  constructor(opts: ProviderOptions = {}) {
    super(opts);
  }

  async getRepoMetadata(repoFullName: string): Promise<Repo> {
    return {
      id: "1",
      name: repoFullName.split("/")[1] || "test",
      fullName: repoFullName,
      defaultBranch: "main",
      isPrivate: false,
    };
  }

  async getUserRepos(search?: string): Promise<Repo[]> {
    return [
      {
        id: "1",
        name: "repo1",
        fullName: "user/repo1",
        defaultBranch: "main",
        isPrivate: false,
      },
    ].filter((repo) => !search || repo.name.includes(search));
  }

  async getRepoBranches(repoFullName: string): Promise<string[]> {
    return ["main", "develop"];
  }

  async getRepoTags(repoFullName: string): Promise<string[]> {
    return ["v1.0.0", "v1.1.0"];
  }
}

describe("GitProvider", () => {
  it("should be instantiable with options", () => {
    const provider = new TestProvider({ baseUrl: "https://api.example.com" });
    expect(provider.opts.baseUrl).toBe("https://api.example.com");
  });

  it("should implement getRepoMetadata", async () => {
    const provider = new TestProvider();
    const repo = await provider.getRepoMetadata("owner/repo");
    
    expect(repo).toEqual({
      id: "1",
      name: "repo",
      fullName: "owner/repo",
      defaultBranch: "main",
      isPrivate: false,
    });
  });

  it("should implement getUserRepos", async () => {
    const provider = new TestProvider();
    const repos = await provider.getUserRepos();
    
    expect(repos).toHaveLength(1);
    expect(repos[0]?.name).toBe("repo1");
  });

  it("should implement getUserRepos with search", async () => {
    const provider = new TestProvider();
    const repos = await provider.getUserRepos("repo1");
    
    expect(repos).toHaveLength(1);
    expect(repos[0]?.name).toBe("repo1");
  });

  it("should implement getRepoBranches", async () => {
    const provider = new TestProvider();
    const branches = await provider.getRepoBranches("owner/repo");
    
    expect(branches).toEqual(["main", "develop"]);
  });

  it("should implement getRepoTags", async () => {
    const provider = new TestProvider();
    const tags = await provider.getRepoTags("owner/repo");
    
    expect(tags).toEqual(["v1.0.0", "v1.1.0"]);
  });
});
