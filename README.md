# AGENTS.md for Copilot

Automatically injects your `~/AGENTS.md` file into GitHub Copilot's instruction context — no setup beyond creating the file.

## Requirements

- VS Code 1.93+
- [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)

## Usage

Create `~/AGENTS.md` with whatever instructions you want Copilot to always follow:

```markdown
# My Copilot Instructions

- Always use TypeScript strict mode
- Prefer named exports over default exports
- Write tests using Vitest
```

The extension picks it up on startup and injects it into Copilot's code generation instructions. Changes to the file take effect immediately without restarting VS Code.

## Optional Settings

`~/AGENTS.md` is always injected into code generation (chat and inline). The settings below extend it to additional Copilot features:

| Setting | Description | Default |
|---|---|---|
| `agentsMd.enableForReview` | Copilot code review | `false` |
| `agentsMd.enableForCommitMessages` | Copilot commit message generation | `false` |
| `agentsMd.enableForPullRequestDescriptions` | Copilot pull request description generation | `false` |

## How It Works

On activation the extension reads `~/AGENTS.md` and writes a `{ text: "<file contents>" }` object into the opted-in Copilot settings, so the full file content is injected directly into Copilot's context. A file watcher re-syncs on every change to `~/AGENTS.md`, so edits take effect immediately without restarting VS Code.

## Publishing to the Marketplace

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to build and publish a new version.
