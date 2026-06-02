import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { access } from 'fs/promises';

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

async function sync(): Promise<void> {
  if (!(await fileExists())) {
    return clear();
  }

  const cfg = vscode.workspace.getConfiguration('github.copilot.chat');
  const active = activeKeys();

  for (const key of active) {
    const existing = (cfg.get<{ file?: string; text?: string }[]>(key) ?? []).filter(
      e => e.file !== AGENTS_MD_PATH
    );
    await cfg.update(
      key,
      [{ file: AGENTS_MD_PATH }, ...existing],
      vscode.ConfigurationTarget.Global
    );
  }

  // Remove reference from settings that are disabled
  const nowDisabled = Object.keys(OPTIONAL_SETTINGS).filter(k => !active.includes(k));
  for (const key of nowDisabled) {
    await removeReference(cfg, key);
  }
}

async function clear(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('github.copilot.chat');
  for (const key of [...ALWAYS_ENABLED, ...Object.keys(OPTIONAL_SETTINGS)]) {
    await removeReference(cfg, key);
  }
}

async function removeReference(
  cfg: vscode.WorkspaceConfiguration,
  key: string
): Promise<void> {
  const existing = cfg.get<{ file?: string; text?: string }[]>(key) ?? [];
  const filtered = existing.filter(e => e.file !== AGENTS_MD_PATH);
  await cfg.update(
    key,
    filtered.length > 0 ? filtered : undefined,
    vscode.ConfigurationTarget.Global
  );
}
