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

On activation the extension checks that `~/AGENTS.md` exists and writes a `{ file: "/absolute/path/to/AGENTS.md" }` reference object into the opted-in Copilot settings. VS Code reads the file on each request so edits to `~/AGENTS.md` take effect immediately.

## Publishing to the Marketplace

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to build and publish a new version.
