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

By default only code generation (panel chat and inline chat) is affected. You can extend injection to other Copilot features in your settings:

| Setting | Description | Default |
|---|---|---|
| `agentsMd.enableForReview` | Copilot code review | `false` |
| `agentsMd.enableForCommitMessages` | Copilot commit message generation | `false` |
| `agentsMd.enableForTests` | Copilot test generation | `false` |

## How It Works

On activation the extension reads `~/AGENTS.md` and writes its content into the `github.copilot.chat.codeGeneration.instructions` global user setting (and any opted-in settings). It tags its entry so it can safely remove it on deactivation without touching instructions you've set manually.

## Publishing to the Marketplace

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to build and publish a new version.
