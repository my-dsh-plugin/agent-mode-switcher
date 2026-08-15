/**
 * Mode-switch roster controller: which presets the deployment offers and the
 * in-flight state of one switch.
 *
 * Options and the switch both ride the standard `agentPreset` wire face, so
 * the controller needs no plugin-owned RPC. The current preset of the session
 * lives in the runtime's session summary (the `agent-preset/selected` remote
 * event updates it app-wide), which is why the snapshot here holds only the
 * roster and the busy flag.
 */

import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { createSnapshotStore, type SessionId, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'

/** The agent-preset settings namespace on the host wire. */
export const AGENT_PRESET_SETTINGS_NS = 'agent-presets'

/**
 * Human text for a rejected wire call. A transport failure rejects with an
 * Error; a host or a runtime can reject with anything, and the surface still
 * has to say something.
 * @param error - the rejection value.
 * @returns the message to show.
 */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** One selectable preset. */
export interface AgentPresetOption {
  /** Preset id, written to the switch and the button's fallback label. */
  id: string
  /** Whether the preset ships with the deployment or was authored locally. */
  trust: 'system' | 'user'
  /** Display name the preset published, absent when it published none. */
  name?: string
  /** One sentence on what the preset is for. */
  description?: string
  /** Whether a session that names no preset gets this one. */
  isDefault?: boolean
}

/** Mode-switch header snapshot. */
export interface ModeSwitchState {
  /** Presets the deployment composes and can mount; empty means no switch possible. */
  options: readonly AgentPresetOption[]
  /** A switch is in flight; the trigger refuses interaction. */
  switching: boolean
}

const INITIAL: ModeSwitchState = { options: [], switching: false }

/** Reads the roster and issues one switch. */
export class ModeSwitchController {
  /** Header snapshot the renderer subscribes to. */
  readonly store: SnapshotStore<ModeSwitchState> = createSnapshotStore(INITIAL)

  constructor(
    private readonly api: Pick<IApiClient, 'agentPresets'>,
    /**
     * Publish a committed switch into the session list, so the header moves
     * with the composition instead of waiting for the forwarded event or the
     * next full list refresh (the seat's own select-echo precedent).
     */
    private readonly onApplied?: (sessionId: SessionId, agentPreset: string) => void,
  ) {}

  private set(patch: Partial<ModeSwitchState>): void {
    this.store.set({ ...this.store.getSnapshot(), ...patch })
  }

  /**
   * Read the roster; a failure leaves the current options in place.
   *
   * Best-effort by design: the button can still show the session's preset id
   * without the roster, and the switch itself is refused by the host when a
   * preset is unknown.
   */
  async load(): Promise<void> {
    let response
    try {
      response = await this.api.agentPresets.list({})
    } catch {
      return
    }
    if (!response.result.ok) return
    this.set({
      // A preset that cannot compose a session must not be offered: picking it
      // would always fail on the host. Only mounted-able rows are options.
      options: response.result.value.presets
        .filter(preset => preset.broken === undefined)
        .map(preset => ({
          id: preset.id,
          trust: preset.trust,
          ...preset.name === undefined ? {} : { name: preset.name },
          ...preset.description === undefined ? {} : { description: preset.description },
          ...preset.isDefault === undefined ? {} : { isDefault: preset.isDefault },
        })),
    })
  }

  /**
   * Switch one session to another preset.
   * @param sessionId - the session whose agent gets recomposed.
   * @param presetId - the target preset id.
   * @returns the failure message, or undefined once the switch committed.
   */
  async switch(sessionId: SessionId, presetId: string): Promise<string | undefined> {
    this.set({ switching: true })
    let response
    try {
      response = await this.api.agentPresets.select({ sessionId, agentPreset: presetId })
    } catch (error) {
      this.set({ switching: false })
      return messageOf(error)
    }
    this.set({ switching: false })
    if (!response.result.ok) return response.result.error.message
    // The select echo is the commit point: record it immediately so the
    // header label reflects the new composition without a page refresh.
    this.onApplied?.(sessionId, response.result.value.agentPreset)
    return undefined
  }
}
