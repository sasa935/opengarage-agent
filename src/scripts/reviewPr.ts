import { createDeepSeekProviderFromEnv } from "../llm/deepseek.js";

type GitHubPullRequest = {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  head: {
    sha: string;
    ref: string;
  };
  base: {
    ref: string;
  };
  draft: boolean;
};

type IssueComment = {
  id: number;
  body?: string;
  user?: {
    type?: string;
  };
};

const REVIEW_MARKER = "<!-- opengarage-ai-review -->";
const MAX_DIFF_CHARS = 45000;

async function main(): Promise<void> {
  const repo = requiredEnv("GITHUB_REPOSITORY");
  const token = requiredEnv("GITHUB_TOKEN");
  const prNumber = Number.parseInt(requiredEnv("PR_NUMBER"), 10);

  if (!Number.isFinite(prNumber)) {
    throw new Error("PR_NUMBER must be a number.");
  }

  const pullRequest = await githubRequest<GitHubPullRequest>(repo, token, `/pulls/${prNumber}`);
  if (pullRequest.draft) {
    await upsertReviewComment(repo, token, prNumber, [
      REVIEW_MARKER,
      "## OpenGarage AI Review",
      "",
      "Skipping review while this PR is still a draft. Mark it ready for review to trigger a full AI pass."
    ].join("\n"));
    return;
  }

  const diff = await githubRequestText(repo, token, `/pulls/${prNumber}`, "application/vnd.github.v3.diff");
  const truncatedDiff = truncateDiff(diff, MAX_DIFF_CHARS);
  const provider = createDeepSeekProviderFromEnv();

  const completion = await provider.complete([
    {
      role: "system",
      content: [
        "You are OpenGarage AI Reviewer, a senior software reviewer for an open-source automotive diagnostic agent.",
        "Review the pull request diff and intent.",
        "Prioritize correctness, security, data/privacy safety, CI risk, tests, and maintainability.",
        "Do not nitpick formatting. Do not invent files that are not in the diff.",
        "If you find issues, include severity labels like P0, P1, P2, or P3 and cite file paths.",
        "If no blocking issues are found, say that clearly and list remaining risks or test gaps.",
        "Return concise Markdown."
      ].join(" ")
    },
    {
      role: "user",
      content: [
        `Repository: ${repo}`,
        `PR: #${pullRequest.number} ${pullRequest.title}`,
        `URL: ${pullRequest.html_url}`,
        `Base: ${pullRequest.base.ref}`,
        `Head: ${pullRequest.head.ref} ${pullRequest.head.sha}`,
        "",
        "PR body:",
        pullRequest.body ?? "(none)",
        "",
        truncatedDiff.wasTruncated
          ? `Diff was truncated to ${MAX_DIFF_CHARS} characters. Review the visible diff and call out truncation risk.`
          : "Diff:",
        truncatedDiff.text
      ].join("\n")
    }
  ], {
    temperature: 0.1,
    maxTokens: 1600
  });

  const body = [
    REVIEW_MARKER,
    "## OpenGarage AI Review",
    "",
    `Model: ${completion.provider}/${completion.model}`,
    "",
    completion.content.trim(),
    "",
    "---",
    "",
    "This review is generated automatically from the PR diff. It is a maintainer aid, not a merge approval."
  ].join("\n");

  await upsertReviewComment(repo, token, prNumber, body);
}

async function upsertReviewComment(repo: string, token: string, prNumber: number, body: string): Promise<void> {
  const comments = await githubRequest<IssueComment[]>(repo, token, `/issues/${prNumber}/comments?per_page=100`);
  const previous = comments.find((comment) => comment.body?.includes(REVIEW_MARKER));

  if (previous) {
    await githubRequest(repo, token, `/issues/comments/${previous.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body })
    });
    return;
  }

  await githubRequest(repo, token, `/issues/${prNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body })
  });
}

async function githubRequest<T>(
  repo: string,
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed with ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

async function githubRequestText(repo: string, token: string, path: string, accept: string): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    headers: {
      Accept: accept,
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub diff request failed with ${response.status}: ${await response.text()}`);
  }

  return response.text();
}

function truncateDiff(diff: string, maxChars: number): { text: string; wasTruncated: boolean } {
  if (diff.length <= maxChars) {
    return { text: diff, wasTruncated: false };
  }

  return {
    text: `${diff.slice(0, maxChars)}\n\n[diff truncated]\n`,
    wasTruncated: true
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
