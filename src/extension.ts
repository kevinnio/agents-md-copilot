import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { access, readFile } from 'fs/promises';

const AGENTS_MD_PATH = path.join(os.homedir(), 'AGENTS.md');

const ALWAYS_ENABLED = ['codeGeneration.instructions'];

const OPTIONAL_SETTINGS: Record<string, string> = {
  'reviewSelection.instructions': 'agentsMd.enableForReview',
  'commitMessageGeneration.instructions': 'agentsMd.enableForCommitMessages',
  'pullRequestDescriptionGeneration.instructions': 'agentsMd.enableForPullRequestDescriptions',
};

export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
  await sync();

  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(vscode.Uri.file(os.homedir()), 'AGENTS.md')
  );

  ctx.subscriptions.push(
    watcher.onDidChange(sync),
    watcher.onDidCreate(sync),
    watcher.onDidDelete(clear),
    vscode.workspace.onDidChangeConfiguration(async e => {
      if (e.affectsConfiguration('agentsMd')) {
        await sync();
      }
    }),
    watcher
  );
}

export function deactivate(): Promise<void> {
  return clear();
}

function activeKeys(): string[] {
  const extCfg = vscode.workspace.getConfiguration('agentsMd');
  return [
    ...ALWAYS_ENABLED,
    ...Object.entries(OPTIONAL_SETTINGS)
      .filter(([, flag]) => extCfg.get<boolean>(flag) === true)
      .map(([key]) => key),
  ];
}

async function fileExists(): Promise<boolean> {
  try {
    await access(AGENTS_MD_PATH);
    return true;
  } catch {
    return false;
  }
}

async function readAgentsMd(): Promise<string | undefined> {
  if (!(await fileExists())) {
    return undefined;
  }
  return readFile(AGENTS_MD_PATH, 'utf8');
}

async function sync(): Promise<void> {
  const content = await readAgentsMd();
  if (content === undefined) {
    return clear();
  }

  const cfg = vscode.workspace.getConfiguration('github.copilot.chat');
  const active = activeKeys();

  for (const key of active) {
    const existing = (cfg.get<InstructionEntry[]>(key) ?? []).filter(
      e => !isOwnedByUs(e, content)
    );
    await cfg.update(
      key,
      [{ text: content, _agentsMd: true }, ...existing],
      vscode.ConfigurationTarget.Global
    );
  }

  // Remove reference from settings that are disabled
  const nowDisabled = Object.keys(OPTIONAL_SETTINGS).filter(k => !active.includes(k));
  for (const key of nowDisabled) {
    await removeReference(cfg, key, content);
  }
}

async function clear(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('github.copilot.chat');
  const content = await readAgentsMd();
  for (const key of [...ALWAYS_ENABLED, ...Object.keys(OPTIONAL_SETTINGS)]) {
    await removeReference(cfg, key, content);
  }
}

async function removeReference(
  cfg: vscode.WorkspaceConfiguration,
  key: string,
  content?: string
): Promise<void> {
  const existing = cfg.get<InstructionEntry[]>(key) ?? [];
  const filtered = existing.filter(e => !isOwnedByUs(e, content));
  await cfg.update(
    key,
    filtered.length > 0 ? filtered : undefined,
    vscode.ConfigurationTarget.Global
  );
}

type InstructionEntry = { file?: string; text?: string; _agentsMd?: boolean };

// ponytail: matches current text-injecting entries, legacy { file } refs, and
// stale text entries from prior versions (e.g. "~/AGENTS.md\n<content>").
// Ceiling: if another tool writes an entry whose text is identical to
// AGENTS.md, we'd drop it too. Upgrade path: use a dedicated setting key.
function isOwnedByUs(e: InstructionEntry, content?: string): boolean {
  if (e._agentsMd === true) return true;
  if (e.file === AGENTS_MD_PATH) return true;
  if (content !== undefined && typeof e.text === 'string') {
    if (e.text === content) return true;
    if (e.text.endsWith(content) && e.text.startsWith('~/AGENTS.md')) return true;
  }
  return false;
}
