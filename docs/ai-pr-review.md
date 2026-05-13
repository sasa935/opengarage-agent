# AI PR Review

OpenGarage Agent supports two review paths:

1. Repository-native AI review through GitHub Actions and DeepSeek.
2. Official Codex GitHub review through your ChatGPT/Codex account.

## Built-In Reviewer

The `AI PR Review` workflow runs on pull requests, including draft PRs, and posts or updates one PR comment with a review summary.

It uses:

- `DEEPSEEK_API_KEY` from GitHub Secrets.
- `GITHUB_TOKEN` from GitHub Actions.
- The PR diff from the GitHub API.

The workflow uses `pull_request_target` and checks out the base commit, not the contributor branch. This matters because the reviewer can use secrets while avoiding execution of untrusted PR code.

## Official Codex Review

OpenAI Codex can also review pull requests directly in GitHub after Codex is connected to your GitHub account and enabled for the repository. You can enable automatic reviews or trigger one by commenting:

```text
@codex review
```

Use official Codex review when you want the Codex product experience and usage to count against Codex code-review limits. Use the built-in reviewer when you want a transparent, provider-switchable workflow that lives inside this repository.

## Security Notes

- Do not run PR branch code in `pull_request_target` workflows.
- Keep model keys in GitHub Secrets.
- Treat AI review as evidence, not approval.
- Keep human control over merging, especially for safety-sensitive automotive behavior.
