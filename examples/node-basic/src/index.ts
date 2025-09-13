import "dotenv/config";
import { createProvider } from "@uni-git/unified";

async function demonstrateGitHubProvider() {
  if (!process.env.GITHUB_TOKEN) {
    console.log("🔶 Skipping GitHub demo - GITHUB_TOKEN not provided");
    return;
  }

  console.log("\n🐙 GitHub Provider Demo");
  console.log("========================");

  try {
    const config: any = {
      type: "github",
      auth: { kind: "token", token: process.env.GITHUB_TOKEN },
    };
    
    if (process.env.GITHUB_BASE_URL) {
      config.baseUrl = process.env.GITHUB_BASE_URL;
    }
    
    const provider = await createProvider(config);

    console.log("✅ GitHub provider created successfully");

    // Get user repositories
    console.log("\n📁 Fetching repositories...");
    const repos = await provider.getUserRepos(undefined, { maxItems: 5 });
    console.log(`Found ${repos.length} repositories:`);
    
    for (const repo of repos.slice(0, 3)) {
      console.log(`  - ${repo.fullName} (${repo.isPrivate ? "private" : "public"})`);
      if (repo.description) {
        console.log(`    ${repo.description.slice(0, 80)}${repo.description.length > 80 ? "..." : ""}`);
      }
    }

    // Get repository details for the first repo
    if (repos.length > 0 && repos[0]) {
      const repo = repos[0];
      console.log(`\n🔍 Repository details for ${repo.fullName}:`);
      
      const repoDetails = await provider.getRepoMetadata(repo.fullName);
      console.log(`  Default branch: ${repoDetails.defaultBranch}`);
      console.log(`  Clone URL: ${repoDetails.httpUrl}`);

      // Get branches
      const branches = await provider.getRepoBranches(repo.fullName, { maxItems: 5 });
      console.log(`  Branches (${branches.length}): ${branches.join(", ")}`);

      // Get tags
      const tags = await provider.getRepoTags(repo.fullName, { maxItems: 5 });
      if (tags.length > 0) {
        console.log(`  Tags (${tags.length}): ${tags.join(", ")}`);
      } else {
        console.log("  No tags found");
      }
    }

    // Demonstrate organization functionality
    console.log("\n🏢 Organizations and organization repositories:");
    try {
      const orgs = await provider.getOrganizations({ maxItems: 3 });
      console.log(`Found ${orgs.length} organizations:`);
      
      for (const org of orgs) {
        console.log(`  - ${org.name} (${org.displayName || "no display name"})`);
        
        // Get repositories for this organization
        try {
          const orgRepos = await provider.getOrganizationRepos(org.name, undefined, { maxItems: 3 });
          console.log(`    Repositories (${orgRepos.length}): ${orgRepos.map(r => r.name).join(", ")}`);
        } catch (error) {
          console.log(`    ⚠️  Could not fetch repositories: ${error instanceof Error ? error.message : error}`);
        }
      }
      
      if (orgs.length === 0) {
        console.log("  No organizations found (user may not be a member of any orgs)");
      }
    } catch (error) {
      console.log(`  ⚠️  Could not fetch organizations: ${error instanceof Error ? error.message : error}`);
    }
  } catch (error) {
    console.error("❌ GitHub demo failed:", error instanceof Error ? error.message : error);
  }
}

async function demonstrateGitLabProvider() {
  if (!process.env.GITLAB_TOKEN) {
    console.log("🔶 Skipping GitLab demo - GITLAB_TOKEN not provided");
    return;
  }

  console.log("\n🦊 GitLab Provider Demo");
  console.log("========================");

  try {
    const config: any = {
      type: "gitlab",
      auth: { kind: "token", token: process.env.GITLAB_TOKEN },
      host: process.env.GITLAB_HOST || "https://gitlab.com", // For self-hosted GitLab
    };
    
    const provider = await createProvider(config);

    console.log("✅ GitLab provider created successfully");

    // Get user repositories
    console.log("\n📁 Fetching repositories...");
    const repos = await provider.getUserRepos(undefined, { maxItems: 5 });
    console.log(`Found ${repos.length} repositories:`);
    
    for (const repo of repos.slice(0, 3)) {
      console.log(`  - ${repo.fullName} (${repo.isPrivate ? "private" : "public"})`);
      if (repo.description) {
        console.log(`    ${repo.description.slice(0, 80)}${repo.description.length > 80 ? "..." : ""}`);
      }
    }

    // Get repository details for the first repo
    if (repos.length > 0 && repos[0]) {
      const repo = repos[0];
      console.log(`\n🔍 Repository details for ${repo.fullName}:`);
      
      const branches = await provider.getRepoBranches(repo.fullName, { maxItems: 5 });
      console.log(`  Branches (${branches.length}): ${branches.join(", ")}`);

      const tags = await provider.getRepoTags(repo.fullName, { maxItems: 5 });
      if (tags.length > 0) {
        console.log(`  Tags (${tags.length}): ${tags.join(", ")}`);
      } else {
        console.log("  No tags found");
      }
    }

    // Demonstrate groups (organizations) functionality
    console.log("\n🏢 Groups and group projects:");
    try {
      const groups = await provider.getOrganizations({ maxItems: 3 });
      console.log(`Found ${groups.length} groups:`);
      
      for (const group of groups) {
        console.log(`  - ${group.name} (${group.displayName || "no display name"})`);
        
        // Get projects for this group
        try {
          const groupProjects = await provider.getOrganizationRepos(group.name, undefined, { maxItems: 3 });
          console.log(`    Projects (${groupProjects.length}): ${groupProjects.map(r => r.name).join(", ")}`);
        } catch (error) {
          console.log(`    ⚠️  Could not fetch projects: ${error instanceof Error ? error.message : error}`);
        }
      }
      
      if (groups.length === 0) {
        console.log("  No groups found (user may not be a member of any groups)");
      }
    } catch (error) {
      console.log(`  ⚠️  Could not fetch groups: ${error instanceof Error ? error.message : error}`);
    }
  } catch (error) {
    console.error("❌ GitLab demo failed:", error instanceof Error ? error.message : error);
  }
}

async function demonstrateBitbucketProvider() {
  if (!process.env.BITBUCKET_USERNAME || !process.env.BITBUCKET_APP_PASSWORD) {
    console.log("🔶 Skipping Bitbucket demo - BITBUCKET_USERNAME or BITBUCKET_APP_PASSWORD not provided");
    return;
  }

  console.log("\n🪣 Bitbucket Provider Demo");
  console.log("===========================");

  try {
    const provider = await createProvider({
      type: "bitbucket",
      auth: { 
        kind: "basic", 
        username: process.env.BITBUCKET_USERNAME || "",
        password: process.env.BITBUCKET_APP_PASSWORD || ""
      },
    });

    console.log("✅ Bitbucket provider created successfully");

    // Get user repositories
    console.log("\n📁 Fetching repositories...");
    const repos = await provider.getUserRepos(undefined, { maxItems: 5 });
    console.log(`Found ${repos.length} repositories:`);
    
    for (const repo of repos.slice(0, 3)) {
      console.log(`  - ${repo.fullName} (${repo.isPrivate ? "private" : "public"})`);
      if (repo.description) {
        console.log(`    ${repo.description.slice(0, 80)}${repo.description.length > 80 ? "..." : ""}`);
      }
    }

    // Get repository details for the first repo
    if (repos.length > 0 && repos[0]) {
      const repo = repos[0];
      console.log(`\n🔍 Repository details for ${repo.fullName}:`);
      
      const branches = await provider.getRepoBranches(repo.fullName, { maxItems: 5 });
      console.log(`  Branches (${branches.length}): ${branches.join(", ")}`);

      const tags = await provider.getRepoTags(repo.fullName, { maxItems: 5 });
      if (tags.length > 0) {
        console.log(`  Tags (${tags.length}): ${tags.join(", ")}`);
      } else {
        console.log("  No tags found");
      }
    }

    // Demonstrate workspaces (organizations) functionality
    console.log("\n🏢 Workspaces and workspace repositories:");
    try {
      const workspaces = await provider.getOrganizations({ maxItems: 3 });
      console.log(`Found ${workspaces.length} workspaces:`);
      
      for (const workspace of workspaces) {
        console.log(`  - ${workspace.name} (${workspace.displayName || "no display name"})`);
        
        // Get repositories for this workspace
        try {
          const workspaceRepos = await provider.getOrganizationRepos(workspace.name, undefined, { maxItems: 3 });
          console.log(`    Repositories (${workspaceRepos.length}): ${workspaceRepos.map(r => r.name).join(", ")}`);
        } catch (error) {
          console.log(`    ⚠️  Could not fetch repositories: ${error instanceof Error ? error.message : error}`);
        }
      }
      
      if (workspaces.length === 0) {
        console.log("  No workspaces found");
      }
    } catch (error) {
      console.log(`  ⚠️  Could not fetch workspaces: ${error instanceof Error ? error.message : error}`);
    }
  } catch (error) {
    console.error("❌ Bitbucket demo failed:", error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log("🚀 Multi-Provider Git API Library Demo");
  console.log("=======================================");
  console.log("\nThis demo showcases the unified interface across GitHub, GitLab, and Bitbucket.");
  console.log("Set the following environment variables to enable each provider:");
  console.log("  - GITHUB_TOKEN (GitHub Personal Access Token)");
  console.log("  - GITLAB_TOKEN (GitLab Personal Access Token)");
  console.log("  - BITBUCKET_USERNAME + BITBUCKET_APP_PASSWORD (Bitbucket credentials)");
  console.log("\nOptional environment variables:");
  console.log("  - GITHUB_BASE_URL (for GitHub Enterprise)");
  console.log("  - GITLAB_HOST (for self-hosted GitLab)");

  await demonstrateGitHubProvider();
  await demonstrateGitLabProvider();
  await demonstrateBitbucketProvider();

  console.log("\n✨ Demo completed!");
  console.log("\nNote: The same interface (getRepoMetadata, getUserRepos, getRepoBranches, getRepoTags)");
  console.log("works consistently across all providers, hiding the complexity of different APIs.");
}

main().catch(console.error);
