import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { readFile } from 'fs/promises';

const MARKER = '~/AGENTS.md';

const ALWAYS_ENABLED = ['codeGeneration.instructions'];

const OPTIONAL_SETTINGS: Record<string, string> = {
  'reviewSelection.instructions': 'agentsMd.enableForReview',
  'commitMessageGeneration.instructions': 'agentsMd.enableForCommitMessages',
  'testGeneration.instructions': 'agentsMd.enableForTests',
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
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('agentsMd')) {
        sync();
      }
    }),
    watcher
  );
}

export function deactivate(): Promise<void> {
  return clear();
}

async function readAgentsMd(): Promise<string | null> {
  try {
    return await readFile(path.join(os.homedir(), 'AGENTS.md'), 'utf8');
  } catch {
    return null;
  }
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

async function sync(): Promise<void> {
  const content = await readAgentsMd();
  if (!content) {
    return clear();
  }

  const cfg = vscode.workspace.getConfiguration('github.copilot.chat');
  const active = activeKeys();

  for (const key of active) {
    const existing = (cfg.get<{ text?: string }[]>(key) ?? []).filter(
      e => !e.text?.startsWith(MARKER)
    );
    await cfg.update(
      key,
      [{ text: `${MARKER}\n${content}` }, ...existing],
      vscode.ConfigurationTarget.Global
    );
  }

  // Strip from settings that are now disabled
  const nowDisabled = Object.keys(OPTIONAL_SETTINGS).filter(k => !active.includes(k));
  for (const key of nowDisabled) {
    await stripMarker(cfg, key);
  }
}

async function clear(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('github.copilot.chat');
  const allKeys = [...ALWAYS_ENABLED, ...Object.keys(OPTIONAL_SETTINGS)];
  for (const key of allKeys) {
    await stripMarker(cfg, key);
  }
}

async function stripMarker(
  cfg: vscode.WorkspaceConfiguration,
  key: string
): Promise<void> {
  const existing = cfg.get<{ text?: string }[]>(key) ?? [];
  const filtered = existing.filter(e => !e.text?.startsWith(MARKER));
  await cfg.update(
    key,
    filtered.length > 0 ? filtered : undefined,
    vscode.ConfigurationTarget.Global
  );
}
