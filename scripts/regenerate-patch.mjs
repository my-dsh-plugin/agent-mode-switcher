#!/usr/bin/env node
/**
 * Regenerate patches/dsh-agent-preset-mid-conversation-switch.patch from a
 * deepseek-harness checkout whose working tree (or a branch above
 * DSH_PATCH_BASE) carries the api-proxy relaxation. Run this after the
 * harness upstream moves so the bundled patch stays in sync.
 *
 * Usage: node scripts/regenerate-patch.mjs [path-to-harness]
 * (defaults to ../deepseek-harness-fork next to this repository, where the
 * author keeps the working-tree changes)
 *
 * Set DSH_PATCH_BASE=<commit> to regenerate from a committed branch instead
 * of the working tree.
 */

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const harness = resolve(process.argv[2] ?? resolve(repoRoot, '..', 'deepseek-harness-fork'))
const patch = resolve(repoRoot, 'patches', 'dsh-agent-preset-mid-conversation-switch.patch')

const FILES = [
  'packages/host/apiproxy/src/api-proxy.ts',
  'packages/host/apiproxy/src/api/agent-presets.ts',
  'packages/host/apiproxy/tests/api-proxy-agent-preset.spec.ts',
]

if (!existsSync(resolve(harness, 'package.json'))) {
  console.error(`no deepseek-harness checkout at ${harness}; pass the path as the first argument`)
  process.exit(1)
}

const base = process.env.DSH_PATCH_BASE
const range = base === undefined ? 'HEAD' : `${base}..HEAD`
const diff = execFileSync('git', ['diff', range, '--', ...FILES], { cwd: harness, encoding: 'utf8' })
if (diff.trim().length === 0) {
  console.error(`no diff for the api-proxy files in ${harness}${base === undefined ? ' working tree' : ` (${range})`}; nothing to write`)
  process.exit(1)
}

const { writeFileSync } = await import('node:fs')
writeFileSync(patch, diff)

// Verify the FRESH patch reverse-applies cleanly against the checkout, i.e.
// it describes the current state exactly — a stale or partial write fails.
try {
  execFileSync('git', ['apply', '--check', '--reverse', patch], { cwd: harness, stdio: 'pipe' })
} catch {
  console.error(`regenerated patch does not describe ${range} exactly; refusing`)
  process.exit(1)
}

console.log(`Regenerated ${patch} from ${range} in ${harness}`)
console.log('Verify it applies cleanly to a fresh checkout before committing:')
console.log(`  git apply --check ${patch}`)
