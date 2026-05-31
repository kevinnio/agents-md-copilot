# Contributing

## Development setup

```bash
pnpm install
```

## Build

```bash
pnpm compile   # single build
pnpm watch     # rebuild on save
```

Output goes to `out/`.

## Run locally

Press **F5** in VS Code to open the Extension Development Host with the extension loaded.

Alternatively, package and install manually:

```bash
pnpm package
code --install-extension agents-md-copilot-0.0.1.vsix
```

## Testing changes

1. Create `~/AGENTS.md` with some recognizable text
2. Reload the Extension Development Host window
3. Check **Settings → Extensions → AGENTS.md for Copilot** to confirm the injected entry appears under `github.copilot.chat.codeGeneration.instructions`
4. Open Copilot Chat and verify the instruction is followed
5. Edit `~/AGENTS.md` and confirm settings update without a reload
6. Delete `~/AGENTS.md` and confirm the entry is removed

## Publishing a new version

1. Bump the version in `package.json` and add an entry to `CHANGELOG.md`
2. Commit and push to `main`
3. Create and push a version tag — the release workflow publishes automatically:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow uses the `VSCE_PAT` repository secret (a VS Marketplace Personal Access Token with **Marketplace → Publish** scope). To set one up:

1. Go to https://dev.azure.com → User Settings → Personal access tokens
2. Create a token with **Marketplace → Manage** scope
3. Add it as a secret named `VSCE_PAT` in this repo's Settings → Secrets → Actions

The publisher registered on the marketplace must match the `publisher` field in `package.json`.
