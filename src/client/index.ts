/**
 * agent-mode-switcher settings/header surface, browser half. Replaces the
 * shipped read-only agent-preset label in the session header (the
 * `conversation.session.header.actions` cell, id `agent-preset`) with a live
 * switcher: pick another preset and the session's agent is recomposed from
 * it, the conversation continuing in the same session. A second registration
 * in the composer tool row keeps the switch entry available while a new blank
 * conversation is still in the hero phase (where the session header is hidden).
 *
 * @module dsh-agent-mode-switcher/client
 */

import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
// Type-only: the ctx.locale Context merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import { AgentModeSwitch } from './AgentModeSwitch.tsx'
import type { AgentModeSwitchInjected } from './AgentModeSwitch.tsx'
import { AGENT_PRESET_SETTINGS_NS, ModeSwitchController } from './mode-switch-store.ts'
import { en, zh } from './locales.ts'
import type { Dictionary } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The session-header agent-preset switcher copy. */
    'agent-mode-switch': Dictionary
  }
}

/** Locale dictionary namespace owned by this header cell. */
const NS = 'agent-mode-switch'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'connection', 'remote', 'sessions']

/**
 * Mount the session-header agent-preset switcher.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'agent-mode-switch: dictionaries')

  const connection = ctx.get('connection') as ConnectionHandle
  const controller = new ModeSwitchController(connection.api, (sessionId, agentPreset) => {
    // The select echo is the commit point; mirror the shipped seat so the
    // header label moves without relying on the forwarded event.
    ctx.sessions.noteAgentPreset(sessionId, agentPreset)
  })

  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    // The shipped cell, reused: registering the same id replaces the
    // read-only label with this switcher.
    id: 'agent-preset',
    // Static session context occupies the header's leading negative-order band.
    order: -10,
    locale: NS,
    inject: (): AgentModeSwitchInjected => ({
      hooks: {
        modeSwitch: controller.store,
      },
      load: () => controller.load(),
      switchMode: (sessionId: SessionId, presetId: string) => controller.switch(sessionId, presetId),
    }),
  }, AgentModeSwitch))

  // Blank-session fallback: the session header is hidden during the blank
  // hero phase, so put a compact switcher in the composer tool row while a
  // new blank conversation has no committed preset yet.
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'agent-mode-switch',
    order: 0,
    locale: NS,
    inject: (): AgentModeSwitchInjected => ({
      blankOnly: true,
      hooks: {
        modeSwitch: controller.store,
      },
      load: () => controller.load(),
      switchMode: (sessionId: SessionId, presetId: string) => controller.switch(sessionId, presetId),
    }),
  }, AgentModeSwitch))

  // Authoring writes a FILE, not a setting, so nothing on the wire announces
  // it; the settings surface is the one announcement that exists (the shipped
  // agent-preset seat refreshes the same way).
  ctx.effect(() => ctx.remote.$on('settings/document-updated', (ns) => {
    if (ns === AGENT_PRESET_SETTINGS_NS) void controller.load()
  }), 'agent-mode-switch: roster refresh')
}
