# dsh-agent-mode-switcher

DeepSeek Harness plugin: switch the current conversation's agent preset
(mode) after the model finishes answering, and keep chatting in the same
session.

## What it does

The session header already shows which mode (agent preset) a conversation
runs — 标准模式 / PTC 模式 / 极简模式 or a custom preset. In a stock harness
that label is read-only once the conversation started, because
`agentPreset.select` refuses every non-blank session. This plugin:

1. **Replaces the shipped header label** with a live switcher chip (the same
   `conversation.session.header.actions` cell, id `agent-preset`).
2. Picking another preset calls the standard `agentPreset.select` RPC, which
   recomposes the session's agent from that preset. The conversation, its
   history, and its workspace stay exactly where they are — only the
   toolset/prompt composition changes, recorded in the session log so a
   resume or fork rebuilds the same mode. The select echo updates the
   session summary immediately (the shipped seat's own pattern), so the
   header chip reflects the new mode without a page refresh.
3. The chip is disabled while the model is answering and the host refuses the
   swap during a running turn regardless. A new blank conversation (whose
   session header is hidden in the hero phase) gets a compact switcher in the
   composer tool row, showing the deployment default until a mode is chosen.

## Requirements

The harness does not ship the idle-session preset switch yet (no upstream
release channel), so **a source checkout of deepseek-harness with the bundled
patch applied is required today**. On a harness without the patch the host
still answers `agent-preset-locked` for started sessions and the switcher
cannot change modes.

## Install

**The plugin itself never needs to be built.** The repository ships the
prebuilt host entry and browser bundle in `lib/` (committed), so installing
is a clone/pull plus one CLI command — no `pnpm install` in this repo, no
`prepare` scripts, no `allowBuilds` approvals. The only build in the whole
flow is the harness's own, for the core patch in step 1.

### 1. Patch the harness core

From this repository, against your deepseek-harness checkout:

```sh
node scripts/apply-patch.mjs /path/to/deepseek-harness
cd /path/to/deepseek-harness
npm run build:lib:host
```

The patch (`patches/dsh-agent-preset-mid-conversation-switch.patch`) relaxes
the `agentPreset.select` guard from "blank only" to "not running", letting an
idle session that already started switch modes. It is additive only — no
existing behavior changes for blank sessions.

### 2. Install the plugin (no build needed)

**From a local clone (recommended for iterating)** — installs as a link: the
committed `lib/` is served as-is, and `git pull` in the clone updates the
plugin without any build:

```sh
git clone https://github.com/my-dsh-plugin/agent-mode-switcher.git
pnpm dsh plugin add --profile web /path/to/agent-mode-switcher
```

(`dsh` CLI from your harness checkout; set `DSH_HOME` to your harness home
if it is not the default `~/.dsh`.)

**Straight from git** — pnpm fetches the repository and uses the committed
`lib/`; no build script runs:

```sh
pnpm dsh plugin add --profile web github:my-dsh-plugin/agent-mode-switcher
```

`dsh plugin add` adds the dependency and reconciles the
`dsh.profile.bundles` layer list. The manual equivalent is editing the
profile's `package.json`:

```json
"dependencies": {
  "dsh-agent-mode-switcher": "link:/path/to/agent-mode-switcher"
}
```

```json
"dsh": {
  "profile": {
    "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-agent-mode-switcher"]
  }
}
```

then `pnpm install` inside the profile directory.

### 3. Restart and verify

Restart the harness (`npx @deepseek-ai/dsh web` or however you launch it).
Open any started conversation: the header's agent-preset label is now a
switcher chip. After the model finishes answering, pick another mode — the
chip updates immediately and the conversation continues in the same session.

- The chip is there but selecting a mode does nothing → the core patch is not
  active in the running build (check the rebuild step, or that the old
  process was fully stopped).
- The chip is missing entirely → the plugin is not in the running profile's
  bundle layer (re-run `dsh plugin add`, verify the bundles list).

## Maintenance

The patch is pinned to the current api-proxy select guard, so it drifts as
the harness upstream moves. When your checkout updates, regenerate and
re-verify the patch before committing:

```sh
node scripts/regenerate-patch.mjs /path/to/deepseek-harness
git -C /path/to/deepseek-harness stash
git -C /path/to/deepseek-harness apply --check /path/to/agent-mode-switcher/patches/dsh-agent-preset-mid-conversation-switch.patch
git -C /path/to/deepseek-harness stash pop
```

The regeneration covers only this plugin's core extension (the three
api-proxy files). Set `DSH_PATCH_BASE=<commit>` when the extension lives on a
committed branch instead of the working tree.

## Development

Building is only for **changing the plugin itself** — consumers never build.
It requires the sibling `deepseek-harness` checkout (`../deepseek-harness`)
because the client bundle is produced by the shared harness preset:

```sh
pnpm install
pnpm test       # vitest: controller and select-echo suites
pnpm typecheck  # tsc -b over src + tests against the harness checkout
pnpm build      # tsc declarations + tsdown host + client bundle into lib/
```

After a build, commit `lib/` so consumers keep getting the prebuilt artifacts
(a `git pull` is all a link-installed profile needs to pick up a change).

## Trade-offs

Switching a started conversation's mode leaves any history produced under the
previous composition — logged tool calls the new toolset cannot make are the
caller's accepted cost. The switch is refused while a turn runs, so the
running request's tool schemas never change mid-answer.

## Known Limitations and Deferred Work

- The switch is offered wherever the header renders; a session with pending
  interactions (an approval dialog) may still switch, and the host guard
  (running only) is the only enforcement.
- Roster refresh rides the `settings/document-updated` event and the
  component's own load; a preset authored on another machine requires a
  session reload to appear, matching the shipped agent-preset surfaces.
- Other open tabs see the new mode only after a refresh (same as the shipped
  agent-preset surfaces).

## License

Apache-2.0
