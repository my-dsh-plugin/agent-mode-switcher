/**
 * The mode-switch roster controller: roster reads and switch writes against
 * the standard `agentPreset` wire face. The session summary's current preset
 * lives in the runtime store, so the controller snapshot carries only the
 * roster and the busy flag.
 */

import { describe, expect, it, vi } from 'vitest'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import { ModeSwitchController } from '../src/client/mode-switch-store.ts'

/** One roster row as the host reports it. */
function rosterPreset(overrides: Partial<{
  id: string; trust: 'system' | 'user'; name?: string; description?: string; broken?: string
}> = {}) {
  return {
    id: 'standard',
    trust: 'system' as const,
    isDefault: true,
    ...overrides,
  }
}

function okValue(value: unknown) {
  return { result: { ok: true as const, value } }
}

function errResponse(message: string) {
  return { result: { ok: false as const, error: { code: 'agent-preset-locked', message, details: {} } } }
}

/** The wire face the controller reads, with spies. */
function fakeApi(options: { list?: unknown; select?: unknown } = {}) {
  return {
    agentPresets: {
      list: options.list ?? vi.fn(() => Promise.resolve(okValue({ presets: [], authorable: false, hasDocument: false }))),
      select: options.select ?? vi.fn(() => Promise.resolve(okValue({ agentPreset: 'minimal' }))),
    },
  } as unknown as Pick<IApiClient, 'agentPresets'>
}

const SESSION = 's1' as SessionId

describe('ModeSwitchController', () => {
  it('loads the roster, dropping presets that cannot compose a session', async () => {
    const api = fakeApi({
      list: vi.fn(() => Promise.resolve(okValue({
        presets: [
          rosterPreset({ id: 'standard', name: 'Standard mode', description: 'Full coding agent' }),
          rosterPreset({ id: 'broken-one', trust: 'user', broken: 'composition is not valid YAML' }),
        ],
        authorable: true,
        hasDocument: false,
      }))),
    })
    const controller = new ModeSwitchController(api)

    await controller.load()

    expect(controller.store.getSnapshot().options).toEqual([
      { id: 'standard', trust: 'system', name: 'Standard mode', description: 'Full coding agent' },
    ])
  })

  it('keeps the current options when the roster transport fails', async () => {
    const api = fakeApi({ list: vi.fn(() => Promise.reject(new Error('socket closed'))) })
    const controller = new ModeSwitchController(api)
    await controller.load()

    expect(controller.store.getSnapshot().options).toEqual([])
  })

  it('ignores an ok:false roster envelope', async () => {
    const api = fakeApi({ list: vi.fn(() => Promise.resolve(errResponse('roster unavailable'))) })
    const controller = new ModeSwitchController(api)
    await controller.load()

    expect(controller.store.getSnapshot().options).toEqual([])
  })

  it('switches a session and returns no failure', async () => {
    const select = vi.fn(() => Promise.resolve(okValue({ agentPreset: 'minimal' })))
    const controller = new ModeSwitchController(fakeApi({ select }))

    const failure = await controller.switch(SESSION, 'minimal')

    expect(failure).toBeUndefined()
    expect(select).toHaveBeenCalledWith({ sessionId: SESSION, agentPreset: 'minimal' })
  })

  it('flips the busy flag for the duration of a switch', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => { release = resolve })
    const controller = new ModeSwitchController(fakeApi({
      select: vi.fn(() => gate.then(() => okValue({ agentPreset: 'minimal' }))),
    }))

    const pending = controller.switch(SESSION, 'minimal')
    expect(controller.store.getSnapshot().switching).toBe(true)
    release()
    await pending
    expect(controller.store.getSnapshot().switching).toBe(false)
  })

  it('reports a transport rejection as the failure message', async () => {
    const controller = new ModeSwitchController(fakeApi({
      select: vi.fn(() => Promise.reject(new Error('socket closed'))),
    }))

    const failure = await controller.switch(SESSION, 'minimal')

    expect(failure).toBe('socket closed')
    expect(controller.store.getSnapshot().switching).toBe(false)
  })

  it('reports an ok:false envelope as the failure message', async () => {
    const controller = new ModeSwitchController(fakeApi({
      select: vi.fn(() => Promise.resolve(errResponse('session "s1" is running a turn'))),
    }))

    const failure = await controller.switch(SESSION, 'minimal')

    expect(failure).toBe('session "s1" is running a turn')
  })
})
