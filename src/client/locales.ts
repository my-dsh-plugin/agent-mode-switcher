/** Locale bundles for the session-header agent-preset switcher. */

/** Locale keys this surface renders. */
export type AgentModeSwitchKey =
  | 'headerHint' | 'runningHint' | 'switching' | 'userTrust' | 'noMode'

/** English copy. */
export const en: Record<AgentModeSwitchKey, string> = {
  headerHint: 'The agent preset this session runs',
  runningHint: 'Answering now — switch once the model finishes',
  switching: 'Switching…',
  userTrust: 'Custom',
  noMode: 'No mode selected',
}

/** The dictionary key face other client modules read. */
export type Dictionary = keyof typeof en

/** 简体中文文案。 */
export const zh: Record<Dictionary, string> = {
  headerHint: '当前会话运行的 agent 预设（模式）',
  runningHint: '模型回答中，完成后可切换模式',
  switching: '切换中…',
  userTrust: '自定义',
  noMode: '未选择模式',
}
