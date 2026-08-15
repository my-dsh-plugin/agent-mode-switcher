#!/usr/bin/env node
/**
 * Apply the bundled harness patch (patches/dsh-agent-preset-mid-conversation-switch.patch)
 * to a deepseek-harness source checkout, then print the rebuild steps.
 *
 * The patch lets `agentPreset.select` switch an idle session that already
 * started (the host guard changes from "blank only" to "not running"). It is
 * additive and does not change existing blank-session behavior.
 *
 * Usage: node scripts/apply-patch.mjs [path-to-harness]
 * (defaults to ../deepseek-harness next to this repository)
 */

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const harness = resolve(process.argv[2] ?? resolve(repoRoot, '..', 'deepseek-harness'))
const patch = resolve(repoRoot, 'patches', 'dsh-agent-preset-mid-conversation-switch.patch')

if (!existsSync(patch)) {
  console.error(`missing patch file: ${patch}`)
  process.exit(1)
}
if (!existsSync(resolve(harness, 'package.json'))) {
  console.error(`no deepseek-harness checkout at ${harness}; pass the path as the first argument`)
  process.exit(1)
}

try {
  execFileSync('git', ['apply', '--check', patch], { cwd: harness, stdio: 'inherit' })
} catch {
  console.error(`\nThe patch does not apply cleanly to ${harness}.`)
  console.error('It targets the current api-proxy select guard; try `git apply -3` or check the harness version.')
  process.exit(1)
}
execFileSync('git', ['apply', patch], { cwd: harness, stdio: 'inherit' })
console.log(`\nApplied ${patch} to ${harness}`)
console.log('Next, rebuild the harness runtime libs, then restart it:')
console.log(`  cd ${harness}`)
console.log('  npm run build:lib:host')
console.log('Then install this plugin into your profile per the README and restart the GUI.')
