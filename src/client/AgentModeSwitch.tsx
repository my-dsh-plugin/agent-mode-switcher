/**
 * The session header's agent-preset switcher.
 *
 * Replaces the shipped read-only label (the same `conversation.session.header
 * .actions` cell, id `agent-preset`) with a live chip: it names the preset the
 * current session runs and, once the model finished answering, offers every
 * mounted-able preset the deployment composes. Picking one recomposes the
 * session's agent from that preset; the conversation and its history stay in
 * the same session. The chip refuses interaction while the agent runs a turn
 * (the host refuses the swap regardless). The same component can register in
 * the composer tool row with `blankOnly: true`, so a new blank conversation
 * (whose header is hidden) still has a switch entry and shows the deployment
 * default until a preset is committed.
 */

import { useEffect, useState } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconAgentPresetOutline16, IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: pulls the ui-conversation SlotMap merge (header actions + input row).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ModeSwitchState } from './mode-switch-store.ts'
import css from './AgentModeSwitch.module.css'

/** Registration-side business face for the header/composer switcher. */
export interface AgentModeSwitchInjected {
  hooks: {
    /** Roster snapshot bound by the renderer as useModeSwitch. */
    modeSwitch: SnapshotStore<ModeSwitchState>
  }
  /** Read the roster, so the button can show a name rather than an id. */
  load: () => Promise<void>
  /** Switch one session's agent preset; resolves the failure message, or undefined on success. */
  switchMode: (sessionId: SessionId, presetId: string) => Promise<string | undefined>
  /**
   * Render only while the session is still blank. The composer registration
   * uses this so a new blank conversation keeps a switch entry even though
   * the session header is hidden in the blank hero phase.
   */
  blankOnly?: boolean
}

/** Full component props. */
export type AgentModeSwitchProps =
  PropsRuntime<'conversation.session.header.actions'>
  & PropsLocale<'agent-mode-switch'>
  & InjectFace<AgentModeSwitchInjected>

/**
 * Render this session's agent preset as a switchable chip.
 * @param props - composed slot props.
 * @returns the chip, or null for a non-blank-only registration on an active session.
 */
export function AgentModeSwitch({
  sessionId, useSessions, useSession, useModeSwitch, load, switchMode, t, blankOnly,
}: AgentModeSwitchProps) {
  const preset = useSessions(state => state.byId[sessionId]?.agentPreset)
  const running = useSession(state => state.running)
  const blank = useSession(state => state.blank)
  const options = useModeSwitch(state => state.options)
  const switching = useModeSwitch(state => state.switching)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    // Load once on mount: the roster is needed both to name the session's
    // preset and to offer the deployment default on a still-blank session.
    void load()
  }, [load])

  // The composer registration only supplements the hidden blank-session
  // header; on an active session it stays out of the tool row.
  if (blankOnly === true && !blank) return null

  const busy = running || switching
  const currentId = preset ?? options.find(option => option.isDefault)?.id
  const current = options.find(option => option.id === currentId)
  const label = current?.name ?? currentId ?? t('noMode')
  const empty = options.length === 0
  const handleSelect = (id: string): void => {
    if (id === currentId || busy) return
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
            disabled: option.id === currentId,
          }
        })}
        selectedId={currentId ?? ''}
        onSelect={handleSelect}
        align="end"
        portal
        anchor={(
          <button
            type="button"
            className={css.seat}
            aria-haspopup="menu"
            aria-expanded={open}
            disabled={busy || empty}
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
