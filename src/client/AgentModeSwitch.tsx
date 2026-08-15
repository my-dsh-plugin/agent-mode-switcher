/**
 * The session header's agent-preset switcher.
 *
 * Replaces the shipped read-only label (the same `conversation.session.header
 * .actions` cell, id `agent-preset`) with a live chip: it names the preset the
 * current session runs and, once the model finished answering, offers every
 * mounted-able preset the deployment composes. Picking one recomposes the
 * session's agent from that preset; the conversation and its history stay in
 * the same session. The chip refuses interaction while the agent runs a turn
 * (the host refuses the swap regardless).
 */

import { useEffect, useState } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconAgentPresetOutline16, IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: pulls the ui-conversation SlotMap merge (the header actions).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ModeSwitchState } from './mode-switch-store.ts'
import css from './AgentModeSwitch.module.css'

/** Registration-side business face for the header switcher. */
export interface AgentModeSwitchInjected {
  hooks: {
    /** Roster snapshot bound by the renderer as useModeSwitch. */
    modeSwitch: SnapshotStore<ModeSwitchState>
  }
  /** Read the roster, so the button can show a name rather than an id. */
  load: () => Promise<void>
  /** Switch one session's agent preset; resolves the failure message, or undefined on success. */
  switchMode: (sessionId: SessionId, presetId: string) => Promise<string | undefined>
}

/** Full component props. */
export type AgentModeSwitchProps =
  PropsRuntime<'conversation.session.header.actions'>
  & PropsLocale<'agent-mode-switch'>
  & InjectFace<AgentModeSwitchInjected>

/**
 * Render this session's agent preset as a switchable chip.
 * @param props - composed slot props.
 * @returns the chip, or null when the session records no preset.
 */
export function AgentModeSwitch({
  sessionId, useSessions, useSession, useModeSwitch, load, switchMode, t,
}: AgentModeSwitchProps) {
  const preset = useSessions(state => state.byId[sessionId]?.agentPreset)
  const running = useSession(state => state.running)
  const options = useModeSwitch(state => state.options)
  const switching = useModeSwitch(state => state.switching)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    // Deployments that compose no presets never label anything, so the roster
    // is only worth a request once a session reports one.
    if (preset !== undefined) void load()
  }, [preset, load])

  if (preset === undefined) return null

  const busy = running || switching
  const current = options.find(option => option.id === preset)
  const label = current?.name ?? preset
  const handleSelect = (id: string): void => {
    if (id === preset || busy) return
    setPending(id)
    setFailed(null)
    void switchMode(sessionId, id).then(error => {
      setPending(null)
      if (error !== undefined) setFailed(error)
    })
  }

  return (
    <div className={css.switcher}>
      <Menu
        open={open}
        onClose={() => { setOpen(false) }}
        items={options.map(option => {
          const name = option.name ?? option.id
          return {
            id: option.id,
            label: option.trust === 'user' ? `${name} · ${t('userTrust')}` : name,
            disabled: option.id === preset,
          }
        })}
        selectedId={preset}
        onSelect={handleSelect}
        align="end"
        portal
        anchor={(
          <button
            type="button"
            className={css.seat}
            aria-haspopup="menu"
            aria-expanded={open}
            disabled={busy}
            title={failed ?? (running ? t('runningHint') : current?.description ?? t('headerHint'))}
            onClick={() => { setOpen(!open) }}
          >
            <IconAgentPresetOutline16 size={14} className={css.icon} />
            <span className={css.name}>{pending !== null ? t('switching') : label}</span>
            <IconChevronDownOutline14 className={css.chevron} />
          </button>
        )}
      />
      {failed !== null && (
        <span className={css.error} role="alert">{failed}</span>
      )}
    </div>
  )
}
