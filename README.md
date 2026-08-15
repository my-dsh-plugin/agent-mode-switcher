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
   swap during a running turn regardless.

## Requirements

- The host must allow idle-session switches. The fork's api-proxy relaxation
  (`agentPreset.select` guard: blank-only → not-running) is the supporting
  change this plugin is built against; a stock harness still answers
  `agent-preset-locked` for started sessions.
- The deployment must compose agent presets (the shipped presets do).

## Install

The plugin mounts through a profile bundle patch:

```yaml
# cordis.patch.yml (profile overlay)
- insert:
    - id: agent-mode-switcher
      name: dsh-agent-mode-switcher
```

and the package must appear in the profile's `dsh.profile.bundles` (its
`dsh.bundle.patch` supplies the insert). The browser half is discovered from
the package's `dsh.client` manifest.

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
